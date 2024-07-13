let trace = {
	y: [],
	type: "scatter",
};

let layout = {
	title: "Real-time Plot",
};

Plotly.newPlot("plot", [trace], layout);

let count = 0;

window.addEventListener("message", (event) => {
	const message = event.data;
	switch (message.type) {
		case "updatePlot":
			Plotly.extendTraces("plot", { y: [[message.value]] }, [0]);
			count++;
			if (count > 500) {
				Plotly.relayout("plot", {
					xaxis: {
						range: [count - 500, count],
					},
				});
			}
			break;
		// You can add more cases here for different types of messages
		// For example, to handle button clicks or update other GUI elements
	}
});

// You can add functions here to create and manage buttons
// For example:
function addButton(label, functionName) {
	const button = document.createElement("button");
	button.textContent = label;
	button.onclick = () => {
		vscode.postMessage({
			type: "buttonClick",
			function: functionName,
		});
	};
	document.getElementById("controls").appendChild(button);
}

// Call this function to add buttons as needed
// addButton('My Function', 'myPythonFunction');
