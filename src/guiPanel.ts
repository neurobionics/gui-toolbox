import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class GUIPanelProvider {
	constructor(private readonly context: vscode.ExtensionContext) {}

	public getWebviewContent(webview: vscode.Webview): string {
		const htmlPath = vscode.Uri.file(
			path.join(this.context.extensionPath, "media", "gui", "index.html")
		);
		let html = fs.readFileSync(htmlPath.fsPath, "utf-8");

		const scriptUri = webview.asWebviewUri(
			vscode.Uri.file(
				path.join(
					this.context.extensionPath,
					"media",
					"gui",
					"script.js"
				)
			)
		);
		html = html.replace('src="script.js"', `src="${scriptUri}"`);

		return html;
	}
}
