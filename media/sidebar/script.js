const vscode = acquireVsCodeApi();
const startButton = document.getElementById("startButton");
const ipAddressInput = document.getElementById("ipAddress");
const protoFile = document.getElementById("protoFile");
const openGUIPanelButton = document.getElementById("openGUIPanelButton");

const variableInputsContainer = document.getElementById(
	"variableInputsContainer"
);
const sliderInputsContainer = document.getElementById("sliderInputsContainer");
const buttonInputsContainer = document.getElementById("buttonInputsContainer");

const saveGUIPanelButton = document.getElementById("saveGUIPanelButton");
const loadGUIPanelButton = document.getElementById("loadGUIPanelButton");

VARIABLE_INPUTS.forEach((variable) => {
	addVariableInput(variable);
});

SLIDERS.forEach((slider) => {
	addSliderInput(slider.variableName, slider.step, slider.min, slider.max);
});

BUTTONS.forEach((button) => {
	addButton(button);
});

startButton.addEventListener("click", () => {
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

openGUIPanelButton.addEventListener("click", () => {
	setVariableInputs();
	setSliderInputs();
	setButtons();
	vscode.postMessage({
		type: "openGUIPanel",
	});
});

saveGUIPanelButton.addEventListener("click", () => {
	setVariableInputs();
	setSliderInputs();
	setButtons();
	vscode.postMessage({
		type: "saveGUIPanel",
	});
});

loadGUIPanelButton.addEventListener("click", () => {
	vscode.postMessage({
		type: "loadGUIPanel",
	});
});

function addVariableInput(variableName = undefined) {
	const newInput = document.createElement("input");
	newInput.type = "text";
	newInput.placeholder = "Variable Name";
	newInput.id = `variableInput${variableInputsContainer.children.length}`;

	if (variableName) {
		newInput.value = variableName;
	}

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
	vscode.postMessage({
		type: "setVariables",
		variables: variables,
	});
}

function addSliderInput(
	variableName = undefined,
	step = undefined,
	min = undefined,
	max = undefined
) {
	// we wanna get the variable name, the min, the max, and the step from the user
	const newSlider = document.createElement("div");
	newSlider.className = "sliderInput";
	const variableNameInput = document.createElement("input");
	variableNameInput.type = "text";
	variableNameInput.placeholder = "Variable Name";

	if (variableName) {
		variableNameInput.value = variableName;
	}

	const stepInput = document.createElement("input");
	stepInput.type = "number";
	stepInput.placeholder = "Step";

	if (step) {
		stepInput.value = step;
	}

	const minInput = document.createElement("input");
	minInput.type = "number";
	minInput.placeholder = "Min";

	if (min) {
		minInput.value = min;
	}

	const maxInput = document.createElement("input");
	maxInput.type = "number";
	maxInput.placeholder = "Max";

	if (max) {
		maxInput.value = max;
	}

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
	vscode.postMessage({
		type: "setSliders",
		sliders: sliderData,
	});
}

function addButton(callbackName = undefined) {
	/* We wanna get the button name, callback function name, and arguments that are variable names */
	const newButton = document.createElement("div");
	newButton.className = "buttonInput";
	const callbackFunctionInput = document.createElement("input");
	callbackFunctionInput.type = "text";
	callbackFunctionInput.placeholder = "Callback Name";

	if (callbackName) {
		callbackFunctionInput.value = callbackName;
	}

	newButton.appendChild(callbackFunctionInput);
	buttonInputsContainer.appendChild(newButton);
}

function removeButton() {
	const buttons = buttonInputsContainer.getElementsByClassName("buttonInput");
	if (buttons.length > 0) {
		buttonInputsContainer.removeChild(buttons[buttons.length - 1]);
	}
}

function setButtons() {
	const buttons = buttonInputsContainer.getElementsByClassName("buttonInput");
	const buttonData = [];
	for (let button of buttons) {
		const callbackName = button
			.getElementsByTagName("input")[0]
			.value.trim();
		buttonData.push(callbackName);
	}
	vscode.postMessage({
		type: "setButtons",
		buttons: buttonData,
	});
}
