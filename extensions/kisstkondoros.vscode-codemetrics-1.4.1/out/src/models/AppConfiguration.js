"use strict";
var vscode_1 = require('vscode');
var VSCodeMetricsConfiguration_1 = require('./VSCodeMetricsConfiguration');
var AppConfiguration = (function () {
    function AppConfiguration() {
        var _this = this;
        this.codeMetricsDisplayed = true;
        vscode_1.workspace.onDidChangeConfiguration(function (e) {
            _this.cachedSettings = null;
        });
    }
    Object.defineProperty(AppConfiguration.prototype, "extensionName", {
        get: function () {
            return 'codemetrics';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AppConfiguration.prototype, "codeMetricsSettings", {
        get: function () {
            if (!this.cachedSettings) {
                var settings = vscode_1.workspace.getConfiguration(this.extensionName);
                this.cachedSettings = new VSCodeMetricsConfiguration_1.VSCodeMetricsConfiguration();
                for (var propertyName in this.cachedSettings) {
                    var property = "nodeconfiguration." + propertyName;
                    if (settings.has(property)) {
                        this.cachedSettings[propertyName] = settings.get(property);
                        continue;
                    }
                    property = "basics." + propertyName;
                    if (settings.has(property)) {
                        this.cachedSettings[propertyName] = settings.get(property);
                        continue;
                    }
                }
            }
            this.cachedSettings.MetricsForArrowFunctionsToggled = this.codeMetricsForArrowFunctionsToggled;
            return this.cachedSettings;
        },
        enumerable: true,
        configurable: true
    });
    return AppConfiguration;
}());
exports.AppConfiguration = AppConfiguration;
//# sourceMappingURL=AppConfiguration.js.map