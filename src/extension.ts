import * as vscode from "vscode";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { GuiToolboxSidebarProvider } from "./sidebarPanel";
import { GUIPanelProvider } from "./guiPanel";
import * as fs from "fs";

export type SliderData = {
	variableName: string;
	step: number;
	min: number;
	max: number;
};

let variables: string[] = [];
let server_data: { [key: string]: number } = {};

let variable_inputs: string[] = [];
let sliders: SliderData[] = [];
let buttons: string[] = [];

let dynamicPackage: any = null;

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
					variables,
					variable_inputs,
					sliders,
					buttons
				);
				guiPanel.webview.html = guiPanelProvider.getWebviewContent(
					guiPanel.webview
				);

				guiPanel.webview.onDidReceiveMessage((message) => {
					switch (message.type) {
						case "sendVariables": {
							guiLogger.appendLine(
								`Received variable inputs: ${JSON.stringify(
									message.data
								)}`
							);

							if (!client) {
								vscode.window.showErrorMessage(
									"Not connected to gRPC server"
								);
								return;
							}

							const requestData = { values: message.data };

							client.SendData(
								requestData,
								(
									error: grpc.ServiceError | null,
									response: any
								) => {
									if (error) {
										console.error(
											"Error sending message:",
											error
										);
										guiLogger.appendLine(
											`Error sending message: ${error.message}`
										);
									} else {
										console.log(
											"Message sent successfully"
										);
										guiLogger.appendLine(
											`Message sent successfully: ${JSON.stringify(
												requestData
											)}`
										);
									}
								}
							);
							break;
						}
						case "buttonClicked": {
							guiLogger.appendLine(
								`Button clicked: ${message.data}`
							);

							if (!client) {
								vscode.window.showErrorMessage(
									"Not connected to gRPC server"
								);
								return;
							}

							client.CallFunction(
								{ name: message.data },
								(
									error: grpc.ServiceError | null,
									response: any
								) => {
									if (error) {
										console.error(
											"Error sending message:",
											error
										);
										guiLogger.appendLine(
											`Error sending message: ${error.message}`
										);
									} else {
										console.log(
											"Message sent successfully"
										);
										guiLogger.appendLine(
											`Message sent successfully: ${message.data}`
										);
									}
								}
							);
						}
					}
				});

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
			dynamicPackage = protoDescriptor.dynamic;

			client = new dynamicPackage.DynamicService(
				`${ipAddress}:50051`,
				grpc.credentials.createInsecure()
			);

			const call = client.ReceiveData({});

			call.on("data", (message: any) => {
				server_data = message.values;

				// get all the variable names ie the keys
				variables = Object.keys(server_data);
				// guiLogger.appendLine(
				// 	`Received from Python: ${JSON.stringify(variables)}`
				// );
				if (guiPanel) {
					guiPanel.webview.postMessage({
						type: "updatePlot",
						data: message.values,
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

	const setVariablesCommand = vscode.commands.registerCommand(
		"gui-toolbox.setVariables",
		(newVariables: string[]) => {
			guiLogger.appendLine(`Setting variables: ${newVariables}`);
			variable_inputs = newVariables;
		}
	);

	const setSlidersCommand = vscode.commands.registerCommand(
		"gui-toolbox.setSliders",
		(newSliders: SliderData[]) => {
			guiLogger.appendLine(`Setting sliders: ${newSliders}`);
			sliders = newSliders;
		}
	);

	const setButtonsCommand = vscode.commands.registerCommand(
		"gui-toolbox.setButtons",
		(newButtons: string[]) => {
			guiLogger.appendLine(`Setting buttons: ${newButtons}`);
			buttons = newButtons;
		}
	);

	context.subscriptions.push(
		startListeningCommand,
		sendMessageCommand,
		openGUIPanelCommand,
		setVariablesCommand,
		setSlidersCommand,
		setButtonsCommand
	);
}

export function deactivate() {}
