import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class GUIPanelProvider {
	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly variables: string[]
	) {}

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

		const cssUri = webview.asWebviewUri(
			vscode.Uri.file(
				path.join(
					this.context.extensionPath,
					"media",
					"gui",
					"styles.css"
				)
			)
		);

		// Replace script src
		html = html
			.replace('src="script.js"', `src="${scriptUri}"`)
			.replace('href="styles.css"', `href="${cssUri}"`);

		// Insert variables into HTML
		const variablesJson = JSON.stringify(this.variables);
		html = html.replace(
			"const VARIABLES = [];",
			`const VARIABLES = ${variablesJson};`
		);

		return html;
	}
}
