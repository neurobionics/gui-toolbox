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
const buttonInputsContainer = document.getElementById("buttonInputsContainer");

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

	const stepInput = document.createElement("input");
	stepInput.type = "number";
	stepInput.placeholder = "Step";
	const minInput = document.createElement("input");
	minInput.type = "number";
	minInput.placeholder = "Min";
	const maxInput = document.createElement("input");
	maxInput.type = "number";
	maxInput.placeholder = "Max";

	newSlider.appendChild(variableNameInput);
	newSlider.appendChild(stepInput);
	newSlider.appendChild(minInput);
	newSlider.appendChild(maxInput);

	sliderInputsContainer.appendChild(newSlider);
}

function removeSliderInput() {
	const sliders = sliderInputsContainer.getElementsByClassName("sliderInput");
	if (sliders.length > 0) {
		sliderInputsContainer.removeChild(sliders[sliders.length - 1]);
	}
}

function setSliderInputs() {
	const sliders = sliderInputsContainer.getElementsByClassName("sliderInput");
	const sliderData = [];
	for (let slider of sliders) {
		const inputs = slider.getElementsByTagName("input");
		const sliderObj = {
			variableName: inputs[0].value.trim(),
			step: parseFloat(inputs[1].value),
			min: parseFloat(inputs[2].value),
			max: parseFloat(inputs[3].value),
		};
		sliderData.push(sliderObj);
	}
	console.log(sliderData);
	vscode.postMessage({
		type: "setSliders",
		sliders: sliderData,
	});
}

function addButtonInputs() {
	/* We wanna get the button name, callback function name, and arguments that are variable names */
	const newButton = document.createElement("div");
	newButton.className = "buttonInput";
	const buttonNameInput = document.createElement("input");
	buttonNameInput.type = "text";
	buttonNameInput.placeholder = "Button Name";
	const callbackFunctionInput = document.createElement("input");
	callbackFunctionInput.type = "text";
	callbackFunctionInput.placeholder = "Callback Function Name";
	const argumentsInput = document.createElement("input");
	argumentsInput.type = "text";
	argumentsInput.placeholder = "Arguments (comma separated)";

	newButton.appendChild(buttonNameInput);
	newButton.appendChild(callbackFunctionInput);
	newButton.appendChild(argumentsInput);

	buttonInputsContainer.appendChild(newButton);
}

function removeButtonInputs() {
	const buttons = buttonInputsContainer.getElementsByClassName("buttonInput");
	if (buttons.length > 0) {
		buttonInputsContainer.removeChild(buttons[buttons.length - 1]);
	}
}

function setButtonInputs() {
	const buttons = buttonInputsContainer.getElementsByClassName("buttonInput");
	const buttonData = [];
	for (let button of buttons) {
		const inputs = button.getElementsByTagName("input");
		const buttonObj = {
			buttonName: inputs[0].value.trim(),
			callbackFunctionName: inputs[1].value.trim(),
			arguments: inputs[2].value.split(",").map((arg) => arg.trim()),
		};
		buttonData.push(buttonObj);
	}
	console.log(buttonData);
	vscode.postMessage({
		type: "setButtons",
		buttons: buttonData,
	});
}
