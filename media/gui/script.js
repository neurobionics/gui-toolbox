const vscode = acquireVsCodeApi();

let trace = {
	y: [],
	type: "scatter",
};

let layout = {
	title: "Real-time Plot",
};

Plotly.newPlot("plot", [trace], layout);

let count = 0;
let selectedVariable = "";

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
	trace.y = [];
	count = 0;
	Plotly.react("plot", [trace], layout);
});

window.addEventListener("message", (event) => {
	const message = event.data;
	switch (message.type) {
		case "updatePlot":
			const data = message.data;
			if (selectedVariable in data) {
				Plotly.extendTraces("plot", { y: [[data[selectedVariable]]] }, [
					0,
				]);
				count++;
				if (count > 500) {
					Plotly.relayout("plot", {
						xaxis: {
							range: [count - 500, count],
						},
					});
				}
			}
			break;
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
