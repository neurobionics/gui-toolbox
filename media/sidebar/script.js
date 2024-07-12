const vscode = acquireVsCodeApi();
const startButton = document.getElementById("startButton");
const ipAddressInput = document.getElementById("ipAddress");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const protoPicker = document.getElementById("protoPicker");

startButton.addEventListener("click", () => {
	console.log("startButton clicked");
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

protoPicker.addEventListener("click", () => {
	vscode.postMessage({
		type: "pickProtoFile",
	});
});
