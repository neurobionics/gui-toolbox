const vscode = acquireVsCodeApi();
const startButton = document.getElementById("startButton");
const ipAddressInput = document.getElementById("ipAddress");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const protoPicker = document.getElementById("protoPicker");
const protoFile = document.getElementById("protoFile");

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
