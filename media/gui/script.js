const vscode = acquireVsCodeApi();
const MAX_POINTS = 200; // Number of points to show in the sliding window
let data = [];
let xData = [];
let yMin = Infinity;
let yMax = -Infinity;

let layout = {
	title: "Real-time Plot",
	font: { color: "#ffffff" },
	paper_bgcolor: "#1e1e1e",
	plot_bgcolor: "#1e1e1e",
	xaxis: {
		gridcolor: "#444",
		zerolinecolor: "#666",
		title: "Time (s)",
	},
	yaxis: {
		gridcolor: "#444",
		zerolinecolor: "#666",
		title: "Value",
	},
	datarevision: 0,
};

let config = {
	responsive: true,
	displayModeBar: false, // Hide the modebar for better performance
};

Plotly.newPlot(
	"plot",
	[
		{
			x: xData,
			y: data,
			type: "scatter",
			mode: "lines",
			line: { color: "#00ff00" },
		},
	],
	layout,
	config
);

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
	// Reset the plot when changing variables
	data = [];
	xData = [];
	count = 0;
	yMin = Infinity;
	yMax = -Infinity;
	startTime = Date.now();
	Plotly.update("plot", { x: [xData], y: [data] });
});

// Use a more efficient update method
function efficientUpdate(newData) {
	const currentTime = (Date.now() - startTime) / 1000; // Time in seconds
	data.push(newData);
	xData.push(currentTime);
	if (data.length > MAX_POINTS) {
		data.shift();
		xData.shift();
	}

	// Update y-axis range
	yMin = Math.min(yMin, newData);
	yMax = Math.max(yMax, newData);
	const yRange = yMax - yMin;
	const newYMin = yMin - yRange * 0.1;
	const newYMax = yMax + yRange * 0.1;

	// Update only the data and layout, which is more efficient
	Plotly.update(
		"plot",
		{ x: [xData], y: [data] },
		{
			xaxis: { range: [xData[0], xData[xData.length - 1]] },
			yaxis: { range: [newYMin, newYMax] },
			datarevision: count,
		}
	);

	count++;
}

// Debounce function to limit update frequency
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// Debounced update function
const debouncedUpdate = debounce(efficientUpdate, 16); // ~60fps

window.addEventListener("message", (event) => {
	const message = event.data;
	if (message.type === "updatePlot") {
		const data = message.data;
		if (selectedVariable in data) {
			debouncedUpdate(data[selectedVariable]);
		}
	}
});

// You can add functions here to create and manage buttons
function addButton(label, functionName) {
	const button = document.createElement("button");
	button.textContent = label;
	button.onclick = () => {
		vscode.postMessage({
			type: "buttonClick",
			function: functionName,
		});
	};
	document.body.appendChild(button);
}
