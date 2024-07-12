const { type } = require("os");

const vscode = acquireVsCodeApi();
const startButton = document.getElementById("startButton");
const ipAddressInput = document.getElementById("ipAddress");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const protoFile = document.getElementById("protoFile");

startButton.addEventListener("click", () => {
	vscode.postMessage({
		type: "startListening",
		ipAddress: ipAddressInput.value,
	});
});

sendButton.addEventListener("click", () => {
	vscode.postMessage({
		type: "sendMessage",
		message: messageInput.value,
	});
	messageInput.value = "";
});

protoFile.addEventListener("change", () => {
	vscode.postMessage({
		type: "assignProtoFile",
		file: protoFile.files[0],
	});
});
