const vscode = acquireVsCodeApi();
const MAX_POINTS = 1000; // Number of points to show in the sliding window
const FPS = 120; // Frames per second, can be altered in the future
const FRAME_DURATION = 1000 / FPS; // Duration of each frame in milliseconds

let data = new Array(MAX_POINTS).fill(null);
let xData = Array.from({ length: MAX_POINTS }, (_, i) => i * (10 / MAX_POINTS));
let yMin = null;
let yMax = null;
let autoScale = true;

let layout = {
	font: { color: "#ffffff" },
	paper_bgcolor: "#1e1e1e",
	plot_bgcolor: "#1e1e1e",
	xaxis: {
		gridcolor: "#444",
		zerolinecolor: "#666",
		title: "Time (s)",
		range: [0, 10], // Initial 10-second window
	},
	yaxis: {
		gridcolor: "#444",
		zerolinecolor: "#666",
		title: "Value",
	},
};

let config = {
	responsive: true,
	displayModeBar: false,
};

const trace = {
	x: xData,
	y: data,
	type: "scatter",
	mode: "lines",
	line: { color: "#00ff00" },
};

Plotly.newPlot("plot", [trace], layout, config);

let count = 0;
let selectedVariable = "";
let startTime = Date.now();

// Populate the select element with variables
const selectElement = document.getElementById("variableSelect");
VARIABLES.forEach((variable) => {
	const option = document.createElement("option");
	option.value = variable;
	option.textContent = variable;
	selectElement.appendChild(option);
});

// Set initial selected variable
if (VARIABLES.length > 0) {
	selectedVariable = VARIABLES[0];
	selectElement.value = selectedVariable;
}

selectElement.addEventListener("change", (event) => {
	selectedVariable = event.target.value;
	resetPlot();
});

function resetPlot() {
	data.fill(null);
	xData.fill(0);
	count = 0;
	yMin = null;
	yMax = null;
	startTime = Date.now();
	Plotly.update(
		"plot",
		{
			x: [xData],
			y: [data],
		},
		{
			xaxis: { range: [0, 10] },
		}
	);
	updateYAxisRange();
}

// Y-axis limit controls
const yMinInput = document.getElementById("yMin");
const yMaxInput = document.getElementById("yMax");
const applyYAxisButton = document.getElementById("applyYAxis");

applyYAxisButton.addEventListener("click", () => {
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
		const filteredData = data.filter((d) => d !== null);
		if (filteredData.length > 0) {
			const dataMin = Math.min(...filteredData);
			const dataMax = Math.max(...filteredData);
			const range = dataMax - dataMin;
			newYMin = dataMin - range * 0.1;
			newYMax = dataMax + range * 0.1;
		}
	} else {
		newYMin =
			yMin !== null ? yMin : Math.min(...data.filter((d) => d !== null));
		newYMax =
			yMax !== null ? yMax : Math.max(...data.filter((d) => d !== null));
	}

	if (newYMin !== undefined && newYMax !== undefined) {
		Plotly.relayout("plot", { "yaxis.range": [newYMin, newYMax] });
	}
}

function efficientUpdate(newData) {
	const currentTime = (Date.now() - startTime) / 1000;

	data.push(newData);
	data.shift();

	xData.push(currentTime);
	xData.shift();

	const xRange = [Math.max(0, currentTime - 10), currentTime];

	Plotly.update(
		"plot",
		{
			x: [xData],
			y: [data],
		},
		{
			xaxis: { range: xRange },
		}
	);

	if (count % 10 === 0) {
		updateYAxisRange();
	}

	count++;
}

// Use requestAnimationFrame for smoother updates
let lastUpdateTime = 0;
function animationLoop(timestamp) {
	if (timestamp - lastUpdateTime > FRAME_DURATION) {
		if (pendingUpdate !== null) {
			efficientUpdate(pendingUpdate);
			pendingUpdate = null;
		}
		lastUpdateTime = timestamp;
	}
	requestAnimationFrame(animationLoop);
}
requestAnimationFrame(animationLoop);

let pendingUpdate = null;
window.addEventListener("message", (event) => {
	const message = event.data;
	if (message.type === "updatePlot") {
		const data = message.data;
		if (selectedVariable in data) {
			pendingUpdate = data[selectedVariable];
		}
	}
});

// You can add functions here to create and manage buttons
const variableInputsContainer = document.getElementById(
	"variableInputsContainer"
);
// if (VARIABLE_INPUTS.length > 0) {
// 	variableInputsContainer.hidden = false;
// }
VARIABLE_INPUTS.forEach((variable) => {
	const variable_input = document.createElement("div");
	variable_input.className = "variableInput";

	const variable_name = document.createElement("label");
	variable_name.textContent = variable + ": ";
	variable_input.appendChild(variable_name);

	const variable_input_field = document.createElement("input");
	variable_input_field.type = "number";
	variable_input_field.value = 0;
	variable_input_field.id = "variable" + variable;

	variable_input.appendChild(variable_name);
	variable_input.appendChild(variable_input_field);
	variableInputsContainer.appendChild(variable_input);
});

const slidersContainer = document.getElementById("slidersContainer");
// if (SLIDERS.length > 0) {
// 	slidersContainer.hidden = false;
// }

SLIDERS.forEach((slider) => {
	const sliderDiv = document.createElement("div");
	sliderDiv.className = "sliderInput";

	const sliderLabel = document.createElement("label");
	sliderLabel.textContent = slider.variableName + ": ";
	sliderDiv.appendChild(sliderLabel);

	const sliderInput = document.createElement("input");
	sliderInput.type = "range";
	sliderInput.min = slider.min;
	sliderInput.max = slider.max;
	sliderInput.step = slider.step;
	sliderInput.value = (slider.min + slider.max) / 2;
	sliderInput.id = "slider" + slider.variableName;

	const sliderValue = document.createElement("span");
	sliderValue.textContent = sliderInput.value;
	sliderDiv.appendChild(sliderValue);

	sliderInput.addEventListener("input", function () {
		sliderValue.textContent = sliderInput.value;
	});

	sliderDiv.appendChild(sliderInput);
	sliderDiv.appendChild(sliderValue);
	slidersContainer.appendChild(sliderDiv);
});

function sendVariableInputs() {
	const values = getAndUpdateVariableInputs();
	vscode.postMessage({
		type: "sendVariableInputs",
		data: values,
	});
}

function getAndUpdateVariableInputs() {
	const values = {};
	VARIABLE_INPUTS.forEach((variable) => {
		values[variable] = parseFloat(
			document.getElementById("variable" + variable).value
		);
	});

	return values;
}

function sendSliderValues() {
	const values = getAndUpdateSliders();
	vscode.postMessage({
		type: "sendSliderValues",
		data: values,
	});
}

function getAndUpdateSliders() {
	const values = {};
	SLIDERS.forEach((slider) => {
		values[slider.variableName] = parseFloat(
			document.getElementById("slider" + slider.variableName).value
		);
	});

	return values;
}
