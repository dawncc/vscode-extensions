"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_1 = require('vscode');
var CodeMetricsCodeLens = (function (_super) {
    __extends(CodeMetricsCodeLens, _super);
    function CodeMetricsCodeLens(model, document) {
        _super.call(this, new vscode_1.Range(document.positionAt(model.start), document.positionAt(model.end)));
        this.model = model;
    }
    CodeMetricsCodeLens.prototype.getSumComplexity = function () {
        return this.model.getSumComplexity();
    };
    CodeMetricsCodeLens.prototype.toString = function (appConfig) {
        return this.model.toString(appConfig.codeMetricsSettings);
    };
    CodeMetricsCodeLens.prototype.getExplanation = function (appConfig) {
        return this.model.getExplanation();
    };
    CodeMetricsCodeLens.prototype.getChildren = function () {
        return this.model.children;
    };
    return CodeMetricsCodeLens;
}(vscode_1.CodeLens));
exports.CodeMetricsCodeLens = CodeMetricsCodeLens;
//# sourceMappingURL=CodeMetricsCodeLens.js.map