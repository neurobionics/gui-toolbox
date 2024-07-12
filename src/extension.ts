import * as vscode from "vscode";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
	let guiLogger = vscode.window.createOutputChannel("GUI Toolbox");
	guiLogger.show();
	guiLogger.appendLine(
		'Congratulations, your extension "gui-toolbox" is now active!'
	);

	let client: any = null;

	const sidebarProvider = new GuiToolboxSidebarProvider(context);
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
			const protoPath = sidebarProvider.getProtoFilePath();
			if (!protoPath) {
				vscode.window.showErrorMessage(
					"Please select a proto file first."
				);
				return;
			}

			guiLogger.appendLine(
				`Creating gRPC client for ${ipAddress} using proto file: ${protoPath}`
			);

			const packageDefinition = protoLoader.loadSync(protoPath, {
				keepCase: true,
				longs: String,
				enums: String,
				defaults: true,
				oneofs: true,
			});

			const protoDescriptor = grpc.loadPackageDefinition(
				packageDefinition
			) as any;
			const messageService = protoDescriptor.message.MessageService;

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
	private protoFilePath: string | null = null;
	constructor(private readonly context: vscode.ExtensionContext) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.file(
					path.join(this.context.extensionPath, "media", "sidebar")
				),
			],
		};

		webviewView.webview.html = this._getWebviewContent(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "pickProtoFile": {
					vscode.window.showInformationMessage(
						"Proto file picker opened"
					);
					const result = await vscode.window.showOpenDialog({
						canSelectFiles: true,
						canSelectFolders: false,
						canSelectMany: false,
						filters: {
							"Proto Files": ["proto"],
						},
					});
					if (result && result[0]) {
						this.protoFilePath = result[0].fsPath;
						vscode.window.showInformationMessage(
							`Proto file assigned: ${this.protoFilePath}`
						);
					}
					break;
				}
				case "startListening": {
					vscode.window.showInformationMessage(
						"Start listening command received"
					);

					vscode.commands.executeCommand(
						"gui-toolbox.startListening",
						data.ipAddress
					);
					break;
				}
				case "sendMessage": {
					vscode.window.showInformationMessage(
						"Send message command received"
					);
					vscode.commands.executeCommand(
						"gui-toolbox.sendMessage",
						data.message
					);
					break;
				}
			}
		});
	}

	public getProtoFilePath(): string | null {
		return this.protoFilePath;
	}

	private _getWebviewContent(webview: vscode.Webview) {
		const htmlPath = vscode.Uri.file(
			path.join(
				this.context.extensionPath,
				"media",
				"sidebar",
				"webview.html"
			)
		);

		const cssPath = vscode.Uri.file(
			path.join(
				this.context.extensionPath,
				"media",
				"sidebar",
				"styles.css"
			)
		);

		const cssUri = webview.asWebviewUri(cssPath);

		const scriptPath = vscode.Uri.file(
			path.join(
				this.context.extensionPath,
				"media",
				"sidebar",
				"script.js"
			)
		);

		const scriptUri = webview.asWebviewUri(scriptPath);

		let html = fs.readFileSync(htmlPath.fsPath, "utf-8");

		html = html
			.replace('href="style.css"', `href="${cssUri}"`)
			.replace('src="script.js"', `src="${scriptUri}"`);

		return html;
	}
}

export function deactivate() {}
