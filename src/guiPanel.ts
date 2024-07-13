import * as vscode from "vscode";
import * as path from "path";

export class GUIPanelProvider {
	constructor(private readonly context: vscode.ExtensionContext) {}

	public getWebviewContent(webview: vscode.Webview): string {
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

		return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>GUI Panel</title>
                <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            </head>
            <body>
                <div id="plot"></div>
                <div id="controls"></div>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
	}
}
