"use strict";
var vs = require("vscode");
var path = require("path");
var ts = require("typescript");
var utils = require("./utilities");
var LanguageServiceHost = (function () {
    function LanguageServiceHost() {
        this._fileNames = [];
        this._files = {};
    }
    LanguageServiceHost.prototype.setCurrentFile = function (fileName, fileText) {
        for (var fileName_1 in this._files) {
            delete this._files[fileName_1].text;
        }
        if (this._files[fileName]) {
            this._files[fileName].version++;
            this._files[fileName].text = fileText;
        }
        else {
            this._files[fileName] = { text: fileText, version: 0 };
        }
    };
    LanguageServiceHost.prototype.getScriptFileNames = function () {
        return this._fileNames;
    };
    LanguageServiceHost.prototype.getScriptVersion = function (fileName) {
        return this._files[fileName] && this._files[fileName].version.toString();
    };
    LanguageServiceHost.prototype.getScriptSnapshot = function (fileName) {
        return ts.ScriptSnapshot.fromString(this._files[fileName] ? this._files[fileName].text : "");
    };
    LanguageServiceHost.prototype.getCurrentDirectory = function () {
        return vs.workspace.rootPath ?
            utils.fixWinPath(path.resolve(vs.workspace.rootPath)) : process.cwd();
    };
    LanguageServiceHost.prototype.getDefaultLibFileName = function (options) {
        return ts.getDefaultLibFilePath(options);
    };
    LanguageServiceHost.prototype.getCompilationSettings = function () {
        return {};
    };
    return LanguageServiceHost;
}());
exports.LanguageServiceHost = LanguageServiceHost;
//# sourceMappingURL=languageServiceHost.js.map