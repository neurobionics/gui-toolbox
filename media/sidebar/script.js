const vscode = acquireVsCodeApi();
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
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
	addVariableInput(variable.variableName, variable.defaultValue);
});

SLIDERS.forEach((slider) => {
	addSliderInput(
		slider.variableName,
		slider.defaultValue,
		slider.step,
		slider.min,
		slider.max
	);
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

stopButton.addEventListener("click", () => {
	vscode.postMessage({
		type: "stopListening",
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

function addVariableInput(variableName = undefined, defaultValue = undefined) {
	const variableInput = document.createElement("div");
	variableInput.className = "variableInput";
	variableInput.id = `variableInput${variableInputsContainer.children.length}`;

	const variableNameInput = document.createElement("input");
	variableNameInput.type = "text";
	variableNameInput.placeholder = "Variable Name";
	if (variableName) {
		variableNameInput.value = variableName;
	}

	const defaultValueInput = document.createElement("input");
	defaultValueInput.type = "number";
	defaultValueInput.placeholder = "Default Value";

	if (defaultValue) {
		defaultValueInput.value = defaultValue;
	}

	variableInput.appendChild(variableNameInput);
	variableInput.appendChild(defaultValueInput);
	variableInputsContainer.appendChild(variableInput);
}

function removeVariableInput() {
	const inputs = variableInputsContainer.getElementsByTagName("input");
	if (inputs.length > 0) {
		variableInputsContainer.removeChild(inputs[inputs.length - 1]);
	}
}

function setVariableInputs() {
	const variableInputs =
		variableInputsContainer.getElementsByClassName("variableInput");
	const variables = [];

	for (let variableInput of variableInputs) {
		const inputs = variableInput.getElementsByTagName("input");

		const variableObject = {
			variableName: inputs[0].value.trim(),
			defaultValue: parseFloat(inputs[1].value),
		};
		variables.push(variableObject);
	}

	vscode.postMessage({
		type: "setVariables",
		variables: variables,
	});
}

function addSliderInput(
	variableName = undefined,
	defaultValue = undefined,
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

	const defaultValueInput = document.createElement("input");
	defaultValueInput.type = "number";
	defaultValueInput.placeholder = "Default Value";

	if (defaultValue) {
		defaultValueInput.value = defaultValue;
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
	newSlider.appendChild(defaultValueInput);
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
			defaultValue: parseFloat(inputs[1].value),
			step: parseFloat(inputs[2].value),
			min: parseFloat(inputs[3].value),
			max: parseFloat(inputs[4].value),
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
