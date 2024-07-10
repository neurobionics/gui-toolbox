import * as vscode from "vscode";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "path";

const PROTO_PATH = path.resolve(__dirname, "../src/message.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const messageService = protoDescriptor.message.MessageService;

export function activate(context: vscode.ExtensionContext) {
	let guiLogger = vscode.window.createOutputChannel("GUI Toolbox");
	guiLogger.show();
	guiLogger.appendLine(
		'Congratulations, your extension "gui-toolbox" is now active!'
	);

	let client: any = null;

	const sidebarProvider = new GuiToolboxSidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"guiToolboxSidebar",
			sidebarProvider
		)
	);

	const startListeningCommand = vscode.commands.registerCommand(
		"gui-toolbox.startListening",
		(ipAddress: string) => {
			if (client) {
				guiLogger.appendLine("gRPC client already exists.");
				return;
			}

			guiLogger.appendLine(`Creating gRPC client for ${ipAddress}...`);
			client = new messageService(
				`${ipAddress}:50051`,
				grpc.credentials.createInsecure()
			);

			const call = client.getMessages({});

			call.on("data", (message: { content: string }) => {
				console.log("Received from Python:", message.content);
				guiLogger.appendLine(
					`Received from Python: ${message.content}`
				);
			});

			call.on("error", (error: Error) => {
				console.error("gRPC error:", error);
				guiLogger.appendLine(`gRPC error: ${error.message}`);
				client = null;
			});

			call.on("end", () => {
				guiLogger.appendLine("gRPC stream ended");
				client = null;
			});
		}
	);

	const sendMessageCommand = vscode.commands.registerCommand(
		"gui-toolbox.sendMessage",
		(message: string) => {
			if (!client) {
				vscode.window.showErrorMessage("Not connected to gRPC server");
				return;
			}

			client.sendMessage(
				{ content: message },
				(error: Error | null, response: any) => {
					if (error) {
						console.error("Error sending message:", error);
						guiLogger.appendLine(
							`Error sending message: ${error.message}`
						);
					} else {
						console.log("Message sent successfully");
						guiLogger.appendLine(
							`Message sent successfully: ${message}`
						);
					}
				}
			);
		}
	);

	context.subscriptions.push(startListeningCommand, sendMessageCommand);
}

class GuiToolboxSidebarProvider implements vscode.WebviewViewProvider {
	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "startListening": {
					vscode.commands.executeCommand(
						"gui-toolbox.startListening",
						data.ipAddress
					);
					break;
				}
				case "sendMessage": {
					vscode.commands.executeCommand(
						"gui-toolbox.sendMessage",
						data.message
					);
					break;
				}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GUI Toolbox</title>
      </head>
      <body>
        <input type="text" id="ipAddress" placeholder="Enter IP Address" value="localhost">
        <button id="startButton">Start Listening</button>
        <br><br>
        <input type="text" id="messageInput" placeholder="Enter message">
        <button id="sendButton">Send Message</button>

        <script>
          const vscode = acquireVsCodeApi();
          const startButton = document.getElementById('startButton');
          const ipAddressInput = document.getElementById('ipAddress');
          const messageInput = document.getElementById('messageInput');
          const sendButton = document.getElementById('sendButton');

          startButton.addEventListener('click', () => {
            vscode.postMessage({
              type: 'startListening',
              ipAddress: ipAddressInput.value
            });
          });

          sendButton.addEventListener('click', () => {
            vscode.postMessage({
              type: 'sendMessage',
              message: messageInput.value
            });
            messageInput.value = '';
          });
        </script>
      </body>
      </html>
    `;
	}
}

export function deactivate() {}
