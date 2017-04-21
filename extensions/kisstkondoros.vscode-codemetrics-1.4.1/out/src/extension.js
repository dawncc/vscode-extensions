"use strict";
var vscode = require('vscode');
var vscode_1 = require('vscode');
var CodeMetricsCodeLensProvider_1 = require('./providers/CodeMetricsCodeLensProvider');
var AppConfiguration_1 = require('./models/AppConfiguration');
function activate(context) {
    var config = new AppConfiguration_1.AppConfiguration();
    var disposables = [];
    var providers = [
        new CodeMetricsCodeLensProvider_1.CodeMetricsCodeLensProvider(config)
    ];
    providers.forEach(function (provider) {
        disposables.push(vscode_1.languages.registerCodeLensProvider(provider.selector, provider));
    });
    var triggerCodeLensComputation = function () {
        if (!vscode.window.activeTextEditor) {
            return;
        }
        var end = vscode.window.activeTextEditor.selection.end;
        vscode.window.activeTextEditor.edit(function (editbuilder) {
            editbuilder.insert(end, " ");
        }).then(function () {
            vscode_1.commands.executeCommand("undo");
        });
    };
    disposables.push(vscode_1.commands.registerCommand("codemetrics.toggleCodeMetricsForArrowFunctions", function () {
        config.codeMetricsForArrowFunctionsToggled = !config.codeMetricsForArrowFunctionsToggled;
        triggerCodeLensComputation();
    }));
    disposables.push(vscode_1.commands.registerCommand("codemetrics.toggleCodeMetricsDisplayed", function () {
        config.codeMetricsDisplayed = !config.codeMetricsDisplayed;
        triggerCodeLensComputation();
    }));
    disposables.push(vscode_1.commands.registerCommand("codemetrics.showCodeMetricsCodeLensInfo", function (codelens) {
        var items = codelens.getChildren().filter(function (item) { return item.complexity > 0; });
        var explanations = items.map(function (item) { return item.toLogString("").trim() + " - " + item.description; });
        vscode.window.showQuickPick(explanations).then(function (selected) {
            if (selected) {
                var selectedCodeLens = items[explanations.indexOf(selected)];
                if (selectedCodeLens) {
                    var characterPosition = vscode.window.activeTextEditor.document.positionAt(selectedCodeLens.start);
                    vscode.window.activeTextEditor.selection = new vscode.Selection(characterPosition, characterPosition);
                }
            }
        });
    }));
    (_a = context.subscriptions).push.apply(_a, disposables);
    var _a;
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map