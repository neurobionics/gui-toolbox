import * as vscode from "vscode";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { GuiToolboxSidebarProvider } from "./sidebar";

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

export function deactivate() {}
