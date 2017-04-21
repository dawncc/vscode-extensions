"use strict";
var vs = require("vscode");
var openurl = require("openurl");
var serializeError = require("serialize-error");
var childProcess = require("child_process");
var documenter_1 = require("./documenter");
var utilities_1 = require("./utilities");
var documenter;
function lazyInitializeDocumenter() {
    if (!documenter) {
        documenter = new documenter_1.Documenter();
    }
}
function languageIsSupported(document) {
    return (document.languageId === "javascript" ||
        document.languageId === "typescript" ||
        document.languageId === "vue" ||
        document.languageId === "javascriptreact" ||
        document.languageId === "typescriptreact");
}
function verifyLanguageSupport(document, commandName) {
    if (!languageIsSupported(document)) {
        vs.window.showWarningMessage("Sorry! '" + commandName + "' currently supports JavaScript and TypeScript only.");
        return false;
    }
    return true;
}
function reportError(error, action) {
    vs.window.showErrorMessage("Sorry! '" + action + "' encountered an error.", "Report Issue").then(function () {
        try {
            var sb = new utilities_1.StringBuilder();
            sb.appendLine("Platform: " + process.platform);
            sb.appendLine();
            sb.appendLine("Steps to reproduce the error:");
            sb.appendLine();
            sb.appendLine("Code excerpt that reproduces the error (optional):");
            sb.appendLine();
            sb.appendLine("Exception:");
            sb.appendLine(JSON.stringify(serializeError(error)));
            var uri = "https://github.com/joelday/vscode-docthis/issues/new?title=" + encodeURIComponent("Exception thrown in '" + action + "': " + error.message) + "&body=" + encodeURIComponent(sb.toString());
            if (process.platform !== "win32") {
                openurl.open(uri, function (openErr) { console.error("Failed to launch browser", openErr); });
            }
            else {
                childProcess.spawnSync("cmd", [
                    "/c",
                    "start",
                    uri.replace(/[&]/g, "^&")
                ]);
            }
        }
        catch (reportErr) {
            reportError(reportErr, "Report Error");
        }
    });
}
function runCommand(commandName, document, implFunc) {
    if (!verifyLanguageSupport(document, commandName)) {
        return;
    }
    try {
        lazyInitializeDocumenter();
        implFunc();
    }
    catch (e) {
        reportError(e, commandName);
    }
}
function activate(context) {
    context.subscriptions.push(vs.workspace.onDidChangeTextDocument(function (e) {
        if (!vs.workspace.getConfiguration().get("docthis.automaticForBlockComments", true)) {
            return;
        }
        if (!languageIsSupported(e.document)) {
            return;
        }
        var editor = vs.window.activeTextEditor;
        if (editor.document !== e.document) {
            return;
        }
        if (e.contentChanges.length > 1) {
            return;
        }
        var change = e.contentChanges[0];
        if (change.text !== "*") {
            return;
        }
        var testRange = new vs.Range(new vs.Position(change.range.start.line, change.range.start.character - 2), new vs.Position(change.range.end.line, change.range.end.character + 1));
        if (e.document.getText(testRange) === "/**") {
            setTimeout(function () {
                editor.edit(function (edit) {
                    try {
                        lazyInitializeDocumenter();
                        documenter.automaticDocument(editor, edit);
                    }
                    catch (ex) {
                        console.error("docthis: Failed to document at current position.");
                    }
                });
            }, 0);
        }
    }));
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentThis", function (editor, edit) {
        var commandName = "Document This";
        runCommand(commandName, editor.document, function () {
            documenter.documentThis(editor, edit, commandName);
        });
    }));
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentEverything", function (editor, edit) {
        var commandName = "Document Everything";
        runCommand(commandName, editor.document, function () {
            documenter.documentEverything(editor, edit, false, commandName);
        });
    }));
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.documentEverythingVisible", function (editor, edit) {
        var commandName = "Document Everything Visible";
        runCommand(commandName, editor.document, function () {
            documenter.documentEverything(editor, edit, true, commandName);
        });
    }));
    context.subscriptions.push(vs.commands.registerTextEditorCommand("docthis.traceTypeScriptSyntaxNode", function (editor, edit) {
        var commandName = "Trace TypeScript Syntax Node";
        runCommand(commandName, editor.document, function () {
            documenter.traceNode(editor, edit);
        });
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map