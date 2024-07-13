import * as vscode from "vscode";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { GuiToolboxSidebarProvider } from "./sidebarPanel";
import { GUIPanelProvider } from "./guiPanel";
import * as fs from "fs";

let variables: string[] = [];

export function activate(context: vscode.ExtensionContext) {
	let guiLogger = vscode.window.createOutputChannel("GUI Toolbox");
	guiLogger.show();
	guiLogger.appendLine(
		'Congratulations, your extension "gui-toolbox" is now active!'
	);

	let client: any = null;
	let guiPanel: vscode.WebviewPanel | undefined;

	const sidebarProvider = new GuiToolboxSidebarProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			"guiToolboxSidebar",
			sidebarProvider
		)
	);

	const openGUIPanelCommand = vscode.commands.registerCommand(
		"gui-toolbox.openGUIPanel",
		() => {
			if (guiPanel) {
				guiPanel.reveal(vscode.ViewColumn.Active);
			} else {
				guiPanel = vscode.window.createWebviewPanel(
					"guiPanel",
					"GUI Panel",
					vscode.ViewColumn.Active,
					{
						enableScripts: true,
						retainContextWhenHidden: true,
					}
				);
				const guiPanelProvider = new GUIPanelProvider(
					context,
					variables
				);
				guiPanel.webview.html = guiPanelProvider.getWebviewContent(
					guiPanel.webview
				);
				guiPanel.onDidDispose(() => {
					guiPanel = undefined;
				});
			}
		}
	);

	const startListeningCommand = vscode.commands.registerCommand(
		"gui-toolbox.startListening",
		async (ipAddress: string) => {
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

			// Parse the proto file to extract variable names
			const protoContent = fs.readFileSync(protoPath, "utf8");
			variables = extractVariables(protoContent);

			guiLogger.appendLine(
				`Creating gRPC client for ${ipAddress} using proto file: ${protoPath}`
			);

			const packageDefinition = await protoLoader.load(protoPath, {
				keepCase: true,
				longs: String,
				enums: String,
				defaults: true,
				oneofs: true,
			});

			const protoDescriptor = grpc.loadPackageDefinition(
				packageDefinition
			) as any;
			const dynamicService = protoDescriptor.dynamic.DynamicService;

			client = new dynamicService(
				`${ipAddress}:50051`,
				grpc.credentials.createInsecure()
			);

			const call = client.getUpdates({});

			call.on("data", (message: any) => {
				guiLogger.appendLine(
					`Received from Python: ${JSON.stringify(message)}`
				);
				if (guiPanel) {
					guiPanel.webview.postMessage({
						type: "updatePlot",
						data: message,
					});
				}
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

			client.sendUpdate(
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

	context.subscriptions.push(
		startListeningCommand,
		sendMessageCommand,
		openGUIPanelCommand
	);
}

function extractVariables(protoContent: string): string[] {
	const messageRegex = /message\s+UpdateMessage\s*{([^}]*)}/;
	const fieldRegex = /\s*(\w+)\s+(\w+)\s*=\s*\d+;/g;

	const messageMatch = protoContent.match(messageRegex);
	if (!messageMatch) {
		return [];
	}

	const messageContent = messageMatch[1];
	const variables: string[] = [];
	let match;
	while ((match = fieldRegex.exec(messageContent)) !== null) {
		variables.push(match[2]); // match[2] is the variable name
	}
	return variables;
}

export function deactivate() {}
