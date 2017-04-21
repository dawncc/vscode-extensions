"use strict";
var vscode = require("vscode");
var fs = require("fs");
exports.NO_BOOKMARKS = -1;
exports.NO_MORE_BOOKMARKS = -2;
exports.JUMP_FORWARD = 1;
exports.JUMP_BACKWARD = -1;
(function (JUMP_DIRECTION) {
    JUMP_DIRECTION[JUMP_DIRECTION["JUMP_FORWARD"] = 0] = "JUMP_FORWARD";
    JUMP_DIRECTION[JUMP_DIRECTION["JUMP_BACKWARD"] = 1] = "JUMP_BACKWARD";
})(exports.JUMP_DIRECTION || (exports.JUMP_DIRECTION = {}));
var JUMP_DIRECTION = exports.JUMP_DIRECTION;
;
var Bookmark = (function () {
    function Bookmark(fsPath) {
        this.fsPath = fsPath;
        this.bookmarks = [];
    }
    Bookmark.prototype.nextBookmark = function (currentline, direction) {
        var _this = this;
        if (direction === void 0) { direction = exports.JUMP_FORWARD; }
        return new Promise(function (resolve, reject) {
            if (typeof _this.bookmarks === "undefined") {
                reject('typeof this.bookmarks == "undefined"');
                return;
            }
            var navigateThroughAllFiles;
            navigateThroughAllFiles = vscode.workspace.getConfiguration("bookmarks").get("navigateThroughAllFiles", false);
            if (_this.bookmarks.length === 0) {
                if (navigateThroughAllFiles) {
                    resolve(exports.NO_BOOKMARKS);
                    return;
                }
                else {
                    resolve(currentline);
                    return;
                }
            }
            var nextBookmark;
            if (direction === exports.JUMP_FORWARD) {
                // for (let index = 0; index < this.bookmarks.length; index++) {
                for (var _i = 0, _a = _this.bookmarks; _i < _a.length; _i++) {
                    var element = _a[_i];
                    // let element = this.bookmarks[ index ];
                    if (element > currentline) {
                        nextBookmark = element;
                        break;
                    }
                }
                if (typeof nextBookmark === "undefined") {
                    if (navigateThroughAllFiles) {
                        resolve(exports.NO_MORE_BOOKMARKS);
                        return;
                    }
                    else {
                        resolve(_this.bookmarks[0]);
                        return;
                    }
                }
                else {
                    resolve(nextBookmark);
                    return;
                }
            }
            else {
                for (var index = _this.bookmarks.length; index >= 0; index--) {
                    var element = _this.bookmarks[index];
                    if (element < currentline) {
                        nextBookmark = element;
                        break;
                    }
                }
                if (typeof nextBookmark === "undefined") {
                    if (navigateThroughAllFiles) {
                        resolve(exports.NO_MORE_BOOKMARKS);
                        return;
                    }
                    else {
                        resolve(_this.bookmarks[_this.bookmarks.length - 1]);
                        return;
                    }
                }
                else {
                    resolve(nextBookmark);
                    return;
                }
            }
        });
    };
    Bookmark.prototype.listBookmarks = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // no bookmark, returns empty
            if (_this.bookmarks.length === 0) {
                resolve({});
                return;
            }
            // file does not exist, returns empty
            if (!fs.existsSync(_this.fsPath)) {
                resolve({});
                return;
            }
            var uriDocBookmark = vscode.Uri.file(_this.fsPath);
            vscode.workspace.openTextDocument(uriDocBookmark).then(function (doc) {
                var items = [];
                var invalids = [];
                // tslint:disable-next-line:prefer-for-of
                for (var index = 0; index < _this.bookmarks.length; index++) {
                    var element = _this.bookmarks[index] + 1;
                    // check for 'invalidated' bookmarks, when its outside the document length
                    if (element <= doc.lineCount) {
                        var lineText = doc.lineAt(element - 1).text;
                        var normalizedPath = doc.uri.fsPath;
                        items.push({
                            label: element.toString(),
                            description: lineText,
                            detail: normalizedPath
                        });
                    }
                    else {
                        invalids.push(element);
                    }
                }
                if (invalids.length > 0) {
                    var idxInvalid = void 0;
                    // tslint:disable-next-line:prefer-for-of
                    for (var indexI = 0; indexI < invalids.length; indexI++) {
                        idxInvalid = _this.bookmarks.indexOf(invalids[indexI] - 1);
                        _this.bookmarks.splice(idxInvalid, 1);
                    }
                }
                resolve(items);
                return;
            });
        });
    };
    Bookmark.prototype.clear = function () {
        this.bookmarks.length = 0;
    };
    return Bookmark;
}());
exports.Bookmark = Bookmark;
//# sourceMappingURL=Bookmark.js.map