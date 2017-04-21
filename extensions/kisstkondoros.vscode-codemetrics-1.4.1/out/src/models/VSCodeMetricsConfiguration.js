"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var MetricsConfiguration_1 = require('tsmetrics-core/MetricsConfiguration');
var VSCodeMetricsConfiguration = (function (_super) {
    __extends(VSCodeMetricsConfiguration, _super);
    function VSCodeMetricsConfiguration() {
        _super.apply(this, arguments);
        this.EnabledForJS = true;
        this.EnabledForJSX = true;
        this.EnabledForTS = true;
        this.EnabledForTSX = true;
        this.FileSizeLimitMB = 0.5;
    }
    return VSCodeMetricsConfiguration;
}(MetricsConfiguration_1.MetricsConfiguration));
exports.VSCodeMetricsConfiguration = VSCodeMetricsConfiguration;
//# sourceMappingURL=VSCodeMetricsConfiguration.js.map