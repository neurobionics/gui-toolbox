import * as vscode from "vscode";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { GuiToolboxSidebarProvider } from "./sidebarPanel";
import { GUIPanelProvider } from "./guiPanel";
import * as fs from "fs";
import * as path from "path";

export type SliderData = {
	variableName: string;
	defaultValue: number;
	step: number;
	min: number;
	max: number;
};

export type VariableInputData = {
	variableName: string;
	defaultValue: number;
};

let variables: string[] = [];
let variable_inputs: VariableInputData[] = [];
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

	const sidebarProvider = new GuiToolboxSidebarProvider(
		context,
		variable_inputs,
		sliders,
		buttons
	);
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
				// refreshing content of the panel
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
				// get all the variable names ie the keys
				variables = Object.keys(message.values);
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

	const stopListeningCommand = vscode.commands.registerCommand(
		"gui-toolbox.stopListening",
		() => {
			if (client) {
				grpc.closeClient(client);
				client = null;
				guiLogger.appendLine("gRPC client stopped");
			} else {
				guiLogger.appendLine("No gRPC client to stop");
			}
		}
	);

	const setVariablesCommand = vscode.commands.registerCommand(
		"gui-toolbox.setVariables",
		(newVariables: VariableInputData[]) => {
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

	const saveGUIPanelCommand = vscode.commands.registerCommand(
		"gui-toolbox.saveGUIPanel",
		async () => {
			// save all the variables, sliders, buttons, and other useful data to a .gui file that can then be loaded later
			// the .gui file is basically a JSON file with the variables, variable_inputs, sliders, buttons, and maybe the guipanel layout

			const uri = await vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file(
					path.join(vscode.workspace.rootPath || "", "gui-panel.gui")
				),
				filters: {
					"GUI Panel": ["gui"],
				},
			});
			if (uri) {
				const data = {
					variables,
					variable_inputs,
					sliders,
					buttons,
				};
				fs.writeFileSync(uri.fsPath, JSON.stringify(data, null, 2));
			}
		}
	);

	const loadGUIPanelCommand = vscode.commands.registerCommand(
		"gui-toolbox.loadGUIPanel",
		() => {
			vscode.window
				.showOpenDialog({
					canSelectFiles: true,
					canSelectFolders: false,
					filters: {
						Proto: ["gui"],
					},
				})
				.then((uri) => {
					if (uri) {
						const filePath = uri[0].fsPath;
						const data = JSON.parse(
							fs.readFileSync(filePath, "utf8")
						);
						variables = data.variables;
						variable_inputs = data.variable_inputs;
						sliders = data.sliders;
						buttons = data.buttons;

						vscode.commands.executeCommand(
							"gui-toolbox.openGUIPanel"
						);

						// we also want these variables and data to be sent to the sidebar view
						sidebarProvider.update(data);
						guiLogger.appendLine("Updated sidebar view");
					}
				});
		}
	);

	context.subscriptions.push(
		startListeningCommand,
		stopListeningCommand,
		openGUIPanelCommand,
		loadGUIPanelCommand,
		setVariablesCommand,
		setSlidersCommand,
		setButtonsCommand
	);
}

export function deactivate() {}
