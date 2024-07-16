const vscode = acquireVsCodeApi();

const MAX_POINTS = 1000;
const MAX_TRACES = 2;
const FPS = 120;
const FRAME_DURATION = 1000 / FPS;

let traces = [];
let startTime = Date.now();

let layout = {
	font: { color: "#ffffff" },
	paper_bgcolor: "#1e1e1e",
	plot_bgcolor: "#1e1e1e",
	title: "Serial Monitor",
	xaxis: {
		gridcolor: "#444",
		zerolinecolor: "#666",
		range: [0, 10],
	},
	yaxis: {
		gridcolor: "#444",
		zerolinecolor: "#666",
	},
	legend: {
		x: 0.5,
		xanchor: "center",
		y: 1,
		yanchor: "center",
		orientation: "h",
		bordercolor: "#808080",
		borderwidth: 1,
	},
};

let config = {
	responsive: true,
	displayModeBar: false,
};

Plotly.newPlot("plot", [], layout, config);

// Populate the select elements with variables
function populateSelectOptions(selectId) {
	const select = document.getElementById(selectId);
	select.innerHTML = VARIABLES.map(
		(variable) => `<option value="${variable}">${variable}</option>`
	).join("");
}

// Initialize the first trace
addTrace();

function addTrace() {
	if (traces.length >= MAX_TRACES) {
		return;
	}

	const traceIndex = traces.length + 1;
	const initialColor = getRandomColor();
	const traceControls = document.getElementById("traceControls");
	const newTraceControl = document.createElement("div");
	newTraceControl.className = "traceControl";
	newTraceControl.innerHTML = `
    <div class="traceLabels">
        <select id="variableSelect${traceIndex}" class="variableSelect"></select>
        <input
            class="colorPicker"
            type="color"
            id="color${traceIndex}"
            name="color${traceIndex}"
            value="${initialColor}"
        />
    </div>
    `;
	traceControls.appendChild(newTraceControl);
	populateSelectOptions(`variableSelect${traceIndex}`);

	const select = document.getElementById(`variableSelect${traceIndex}`);
	const initialVariable = select.value;

	const newTrace = {
		x: [],
		y: [],
		type: "scatter",
		mode: "lines",
		line: { color: initialColor },
		name: initialVariable,
	};

	traces.push(newTrace);
	Plotly.addTraces("plot", newTrace);

	// Add event listeners for variable selection and color change
	select.addEventListener("change", updateTraceName);
	document
		.getElementById(`color${traceIndex}`)
		.addEventListener("change", updateTraceColor);
}

function removeTrace() {
	if (traces.length > 1) {
		const traceControls = document.getElementById("traceControls");
		traceControls.lastChild.remove();
		traces.pop();
		Plotly.deleteTraces("plot", -1);
	}
}

function updateTraceName(event) {
	const traceIndex =
		parseInt(event.target.id.replace("variableSelect", "")) - 1;
	const newName = event.target.value;
	traces[traceIndex].name = newName;
	Plotly.restyle("plot", { name: newName }, [traceIndex]);
	updatePlot();
}

function getRandomColor() {
	return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

function updateTraceColor(event) {
	const traceIndex = parseInt(event.target.id.replace("color", "")) - 1;
	traces[traceIndex].line.color = event.target.value;
	Plotly.restyle("plot", { "line.color": [event.target.value] }, [
		traceIndex,
	]);
}

function updatePlot() {
	const currentTime = (Date.now() - startTime) / 1000;
	const xRange = [Math.max(0, currentTime - 10), currentTime];

	traces.forEach((trace, index) => {
		const select = document.getElementById(`variableSelect${index + 1}`);
		const selectedVariable = select.value;

		if (pendingUpdate && selectedVariable in pendingUpdate) {
			trace.x.push(currentTime);
			trace.y.push(pendingUpdate[selectedVariable]);

			if (trace.x.length > MAX_POINTS) {
				trace.x.shift();
				trace.y.shift();
			}
		}

		// Update the trace name to match the current selected variable
		trace.name = selectedVariable;
	});

	Plotly.update(
		"plot",
		traces.map((trace) => ({
			x: [trace.x],
			y: [trace.y],
			name: trace.name,
		})),
		{ xaxis: { range: xRange } }
	);

	updateYAxisRange();
}

let pendingUpdate = null;
window.addEventListener("message", (event) => {
	const message = event.data;
	if (message.type === "updatePlot") {
		pendingUpdate = message.data;
	}
});

// Use requestAnimationFrame for smoother updates
let lastUpdateTime = 0;
function animationLoop(timestamp) {
	if (timestamp - lastUpdateTime > FRAME_DURATION) {
		if (pendingUpdate !== null) {
			updatePlot();
			pendingUpdate = null;
		}
		lastUpdateTime = timestamp;
	}
	requestAnimationFrame(animationLoop);
}
requestAnimationFrame(animationLoop);

// Y-axis limit controls
const yMinInput = document.getElementById("yMin");
const yMaxInput = document.getElementById("yMax");

let yMin = null;
let yMax = null;
let autoScale = true;

yMinInput.addEventListener("change", () => {
	const newYMin = yMinInput.value !== "" ? parseFloat(yMinInput.value) : null;
	const newYMax = yMaxInput.value !== "" ? parseFloat(yMaxInput.value) : null;

	if (newYMin !== null && newYMax !== null && newYMin >= newYMax) {
		alert("Y Min must be less than Y Max");
		return;
	}

	yMin = newYMin;
	yMax = newYMax;
	autoScale = yMin === null && yMax === null;

	updateYAxisRange();
});

yMaxInput.addEventListener("change", () => {
	const newYMin = yMinInput.value !== "" ? parseFloat(yMinInput.value) : null;
	const newYMax = yMaxInput.value !== "" ? parseFloat(yMaxInput.value) : null;

	if (newYMin !== null && newYMax !== null && newYMin >= newYMax) {
		alert("Y Min must be less than Y Max");
		return;
	}

	yMin = newYMin;
	yMax = newYMax;
	autoScale = yMin === null && yMax === null;

	updateYAxisRange();
});

function updateYAxisRange() {
	let newYMin, newYMax;

	if (autoScale) {
		const allData = traces.flatMap((trace) => trace.y);
		const filteredData = allData.filter(
			(d) => d !== null && d !== undefined
		);
		if (filteredData.length > 0) {
			const dataMin = Math.min(...filteredData);
			const dataMax = Math.max(...filteredData);
			const range = dataMax - dataMin;
			newYMin = dataMin - range * 0.1;
			newYMax = dataMax + range * 0.1;
		}
	} else {
		newYMin =
			yMin !== null
				? yMin
				: Math.min(...traces.flatMap((trace) => Math.min(...trace.y)));
		newYMax =
			yMax !== null
				? yMax
				: Math.max(...traces.flatMap((trace) => Math.max(...trace.y)));
	}

	if (newYMin !== undefined && newYMax !== undefined) {
		Plotly.relayout("plot", { "yaxis.range": [newYMin, newYMax] });
	}
}

// Add event listeners for the "Add Trace" and "Remove Trace" buttons
document.getElementById("addTrace").addEventListener("click", addTrace);
document.getElementById("removeTrace").addEventListener("click", removeTrace);

// Initialize the plot
updatePlot();
