"use strict";
var vscode_1 = require('vscode');
var CodeMetricsCodeLens_1 = require('../models/CodeMetricsCodeLens');
var MetricsParser_1 = require('tsmetrics-core/MetricsParser');
var ts = require('typescript');
var fs_1 = require('fs');
var path = require('path');
var CodeMetricsCodeLensProvider = (function () {
    function CodeMetricsCodeLensProvider(appConfig) {
        this.appConfig = appConfig;
    }
    Object.defineProperty(CodeMetricsCodeLensProvider.prototype, "selector", {
        get: function () {
            var tsDocSelector = {
                language: 'typescript',
                scheme: 'file'
            };
            var jsDocSelector = {
                language: 'javascript',
                scheme: 'file'
            };
            var jsxDocSelector = {
                language: 'javascriptreact',
                scheme: 'file'
            };
            var tsxDocSelector = {
                language: 'typescriptreact',
                scheme: 'file'
            };
            return [tsDocSelector, jsDocSelector, jsxDocSelector, tsxDocSelector];
        },
        enumerable: true,
        configurable: true
    });
    ;
    CodeMetricsCodeLensProvider.prototype.getScriptTarget = function (target, isJS) {
        var keys = Object.keys(ts.ScriptTarget);
        var result = isJS ? ts.ScriptTarget.ES5 : ts.ScriptTarget.ES3;
        if (target) {
            target = target.toLowerCase();
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                var value = ts.ScriptTarget[key];
                if (key.toLowerCase() === target) {
                    result = value;
                }
            }
        }
        return result;
    };
    CodeMetricsCodeLensProvider.prototype.loadConfig = function (isJS) {
        var fileName = isJS ? "jsconfig.json" : "tsconfig.json";
        var config = ts.readConfigFile(fileName, function (filePath) {
            var fullPath = path.join(vscode_1.workspace.rootPath, filePath);
            return fs_1.readFileSync(fullPath, 'UTF-8');
        });
        return config;
    };
    CodeMetricsCodeLensProvider.prototype.isLanguageDisabled = function (languageId) {
        if (languageId == 'typescript' && !this.appConfig.codeMetricsSettings.EnabledForTS)
            return true;
        if (languageId == 'typescriptreact' && !this.appConfig.codeMetricsSettings.EnabledForTSX)
            return true;
        if (languageId == 'javascript' && !this.appConfig.codeMetricsSettings.EnabledForJS)
            return true;
        if (languageId == 'javascriptreact' && !this.appConfig.codeMetricsSettings.EnabledForJSX)
            return true;
        return false;
    };
    CodeMetricsCodeLensProvider.prototype.isAboveFileSizeLimit = function (fileName) {
        if (this.appConfig.codeMetricsSettings.FileSizeLimitMB < 0) {
            return false;
        }
        try {
            var fileSizeInBytes = fs_1.statSync(fileName).size;
            var configuredLimit = this.appConfig.codeMetricsSettings.FileSizeLimitMB * 1024 * 1024;
            return fileSizeInBytes > configuredLimit;
        }
        catch (error) {
            return false;
        }
    };
    CodeMetricsCodeLensProvider.prototype.provideCodeLenses = function (document, token) {
        var result = [];
        if (this.isAboveFileSizeLimit(document.fileName))
            return;
        if (this.isLanguageDisabled(document.languageId))
            return;
        if (this.appConfig.codeMetricsDisplayed) {
            var target = ts.ScriptTarget.ES3;
            var isJS = false;
            if (document.fileName) {
                var parsedPath = path.parse(document.fileName);
                var extension = parsedPath.ext;
                isJS = extension && extension.toLowerCase() == ".js";
            }
            var projectConfig = this.loadConfig(isJS);
            if (projectConfig.config && projectConfig.config.compilerOptions) {
                target = this.getScriptTarget(projectConfig.config.compilerOptions.target, isJS);
            }
            var settings = this.appConfig.codeMetricsSettings;
            var metrics = MetricsParser_1.MetricsParser.getMetricsFromText(document.fileName, document.getText(), settings, target).metrics;
            var collect = function (model) {
                if (model.visible && model.getSumComplexity() >= settings.CodeLensHiddenUnder) {
                    result.push(new CodeMetricsCodeLens_1.CodeMetricsCodeLens(model, document));
                }
                model.children.forEach(function (element) {
                    collect(element);
                });
            };
            collect(metrics);
        }
        return result;
    };
    CodeMetricsCodeLensProvider.prototype.resolveCodeLens = function (codeLens, token) {
        if (codeLens instanceof CodeMetricsCodeLens_1.CodeMetricsCodeLens) {
            codeLens.command = {
                title: codeLens.toString(this.appConfig),
                command: "codemetrics.showCodeMetricsCodeLensInfo",
                arguments: [codeLens]
            };
            return codeLens;
        }
        return null;
    };
    return CodeMetricsCodeLensProvider;
}());
exports.CodeMetricsCodeLensProvider = CodeMetricsCodeLensProvider;
//# sourceMappingURL=CodeMetricsCodeLensProvider.js.map