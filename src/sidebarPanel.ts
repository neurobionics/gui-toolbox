import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { SliderData } from "./extension";

export class GuiToolboxSidebarProvider implements vscode.WebviewViewProvider {
	private protoFilePath: string | null = null;
	private webviewView: vscode.WebviewView | undefined;
	constructor(
		private context: vscode.ExtensionContext,
		private variable_inputs: string[],
		private sliders: SliderData[],
		private buttons: string[]
	) {}

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

		this.webviewView = webviewView;
		this.webviewView.webview.html = this._getWebviewContent(
			webviewView.webview
		);

		this.webviewView.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "protoFile": {
					this.protoFilePath = data.protoFilePath;
					vscode.window.showInformationMessage(
						`Proto file assigned: ${this.protoFilePath}`
					);
					break;
				}
				case "startListening": {
					vscode.window.showInformationMessage(
						"Starting gRPC client"
					);

					vscode.commands.executeCommand(
						"gui-toolbox.startListening",
						data.ipAddress
					);
					break;
				}
				case "openGUIPanel": {
					vscode.commands.executeCommand("gui-toolbox.openGUIPanel");
					break;
				}

				case "setVariables": {
					vscode.commands.executeCommand(
						"gui-toolbox.setVariables",
						data.variables
					);
					break;
				}

				case "setSliders": {
					vscode.commands.executeCommand(
						"gui-toolbox.setSliders",
						data.sliders
					);

					break;
				}

				case "setButtons": {
					vscode.commands.executeCommand(
						"gui-toolbox.setButtons",
						data.buttons
					);
					break;
				}
				case "saveGUIPanel": {
					vscode.window.showInformationMessage("Saving GUI Panel");
					vscode.commands.executeCommand("gui-toolbox.saveGUIPanel");
					break;
				}
				case "loadGUIPanel": {
					vscode.window.showInformationMessage("Loading GUI Panel");
					vscode.commands.executeCommand("gui-toolbox.loadGUIPanel");

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
				"index.html"
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
			.replace('href="styles.css"', `href="${cssUri}"`)
			.replace('src="script.js"', `src="${scriptUri}"`);

		// Insert variables into HTML
		html = html
			.replace(
				"const VARIABLE_INPUTS = [];",
				`const VARIABLE_INPUTS = ${JSON.stringify(
					this.variable_inputs
				)};`
			)
			.replace(
				"const SLIDERS = [];",
				`const SLIDERS = ${JSON.stringify(this.sliders)};`
			)
			.replace(
				"const BUTTONS = [];",
				`const BUTTONS = ${JSON.stringify(this.buttons)};`
			);

		return html;
	}

	public update(data: any) {
		this.variable_inputs = data.variable_inputs;
		this.sliders = data.sliders;
		this.buttons = data.buttons;

		if (this.webviewView) {
			this.webviewView.webview.html = this._getWebviewContent(
				this.webviewView.webview
			);
		}
	}
}
