"use strict";
//"use strict";
const environmentPath_1 = require("./environmentPath");
class ExtensionConfig {
    constructor() {
        this.token = null;
        this.gist = null;
        this.lastUpload = null;
        this.autoDownload = false;
        this.autoUpload = false;
        this.lastDownload = null;
        this.version = null;
        this.showSummary = true;
        this.forceDownload = false;
        this.workspaceSync = false;
        this.anonymousGist = false;
        this.version = environmentPath_1.Environment.CURRENT_VERSION;
    }
}
exports.ExtensionConfig = ExtensionConfig;
class LocalConfig {
    constructor() {
        this.publicGist = false;
        this.userName = null;
        this.name = null;
        this.config = null;
        this.config = new ExtensionConfig();
    }
}
exports.LocalConfig = LocalConfig;
class CloudSetting {
    constructor() {
        this.lastUpload = null;
        this.extensionVersion = null;
        this.extensionVersion = "v" + environmentPath_1.Environment.getVersion();
    }
}
exports.CloudSetting = CloudSetting;
//# sourceMappingURL=setting.js.map