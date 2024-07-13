const vscode = acquireVsCodeApi();
const startButton = document.getElementById("startButton");
const ipAddressInput = document.getElementById("ipAddress");
const messageInput = document.getElementById("messageInput");
const protoFile = document.getElementById("protoFile");
const openGUIPanelButton = document.getElementById("openGUIPanelButton");

const variableInputsContainer = document.getElementById(
	"variableInputsContainer"
);
const sliderInputsContainer = document.getElementById("sliderInputsContainer");

startButton.addEventListener("click", () => {
	console.log("startButton clicked");
	vscode.postMessage({
		type: "startListening",
		ipAddress: ipAddressInput.value,
	});
});

protoFile.addEventListener("change", () => {
	const file = protoFile.files[0];
	const reader = new FileReader();
	reader.onload = (event) => {
		vscode.postMessage({
			type: "protoFile",
			protoFilePath: file.path,
		});
	};
	reader.readAsText(file);
});

messageInput.addEventListener("change", () => {
	vscode.postMessage({
		type: "sendMessage",
		message: messageInput.value,
	});
	messageInput.value = "";
});

openGUIPanelButton.addEventListener("click", () => {
	vscode.postMessage({
		type: "openGUIPanel",
	});
});

function addVariableInput() {
	const newInput = document.createElement("input");
	newInput.type = "text";
	newInput.placeholder = "Variable name";
	newInput.id = `variableInput${variableInputsContainer.children.length}`;
	variableInputsContainer.appendChild(newInput);
}

function removeVariableInput() {
	const inputs = variableInputsContainer.getElementsByTagName("input");
	if (inputs.length > 0) {
		variableInputsContainer.removeChild(inputs[inputs.length - 1]);
	}
}

function setVariableInputs() {
	const inputs = variableInputsContainer.getElementsByTagName("input");
	const variables = [];
	for (let input of inputs) {
		variables.push(input.value.trim());
	}
	console.log(variables);
	vscode.postMessage({
		type: "setVariables",
		variables: variables,
	});
}

function addSliderInput() {
	// we wanna get the variable name, the min, the max, and the step from the user
	const newSlider = document.createElement("div");
	newSlider.className = "sliderInput";
	const variableNameInput = document.createElement("input");
	variableNameInput.type = "text";
	variableNameInput.placeholder = "Variable Name";
	const minInput = document.createElement("input");
	minInput.type = "number";
	minInput.placeholder = "Min";
	const maxInput = document.createElement("input");
	maxInput.type = "number";
	maxInput.placeholder = "Max";
	const stepInput = document.createElement("input");
	stepInput.type = "number";
	stepInput.placeholder = "Step";
	newSlider.appendChild(variableNameInput);
	newSlider.appendChild(minInput);
	newSlider.appendChild(maxInput);
	newSlider.appendChild(stepInput);
	sliderInputsContainer.appendChild(newSlider);
}

function removeSliderInput() {
	const sliders = sliderInputsContainer.getElementsByClassName("sliderInput");
	if (sliders.length > 0) {
		sliderInputsContainer.removeChild(sliders[sliders.length - 1]);
	}
}
