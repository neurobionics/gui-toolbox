import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class GuiToolboxSidebarProvider implements vscode.WebviewViewProvider {
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
				case "protoFile": {
					this.protoFilePath = data.protoFilePath;
					vscode.window.showInformationMessage(
						`Proto file assigned: ${this.protoFilePath}`
					);
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
			.replace('href="styles.css"', `href="${cssUri}"`)
			.replace('src="script.js"', `src="${scriptUri}"`);

		return html;
	}
}
