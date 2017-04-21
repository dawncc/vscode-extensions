"use strict";
var vscode = require("vscode");
var fs = require("fs");
var Bookmark_1 = require("./Bookmark");
var Bookmarks = (function () {
    function Bookmarks(jsonObject) {
        this.activeBookmark = undefined;
        this.bookmarks = [];
    }
    Bookmarks.normalize = function (uri) {
        // a simple workaround for what appears to be a vscode.Uri bug
        // (inconsistent fsPath values for the same document, ex. ///foo/x.cpp and /foo/x.cpp)
        return uri.replace("///", "/");
    };
    Bookmarks.prototype.dispose = function () {
        this.zip();
    };
    Bookmarks.prototype.loadFrom = function (jsonObject, relativePath) {
        if (jsonObject === "") {
            return;
        }
        var jsonBookmarks = jsonObject.bookmarks;
        for (var idx = 0; idx < jsonBookmarks.length; idx++) {
            var jsonBookmark = jsonBookmarks[idx];
            // each bookmark (line)
            this.add(jsonBookmark.fsPath);
            // for (let index = 0; index < jsonBookmark.bookmarks.length; index++) {
            for (var _i = 0, _a = jsonBookmark.bookmarks; _i < _a.length; _i++) {
                var element = _a[_i];
                this.bookmarks[idx].bookmarks.push(element); // jsonBookmark.bookmarks[index]);
            }
        }
        if (relativePath) {
            for (var _b = 0, _c = this.bookmarks; _b < _c.length; _b++) {
                var element = _c[_b];
                element.fsPath = element.fsPath.replace("$ROOTPATH$", vscode.workspace.rootPath);
            }
        }
    };
    Bookmarks.prototype.fromUri = function (uri) {
        uri = Bookmarks.normalize(uri);
        // for (let index = 0; index < this.bookmarks.length; index++) {
        for (var _i = 0, _a = this.bookmarks; _i < _a.length; _i++) {
            var element = _a[_i];
            // let element = this.bookmarks[index];
            if (element.fsPath === uri) {
                return element;
            }
        }
    };
    Bookmarks.prototype.add = function (uri) {
        // console.log(`Adding bookmark/file: ${uri}`);
        uri = Bookmarks.normalize(uri);
        var existing = this.fromUri(uri);
        if (typeof existing === "undefined") {
            var bookmark = new Bookmark_1.Bookmark(uri);
            this.bookmarks.push(bookmark);
        }
    };
    Bookmarks.prototype.nextDocumentWithBookmarks = function (active, direction) {
        var _this = this;
        if (direction === void 0) { direction = Bookmark_1.JUMP_FORWARD; }
        var currentBookmark = active;
        var currentBookmarkId;
        for (var index = 0; index < this.bookmarks.length; index++) {
            var element = this.bookmarks[index];
            if (element === active) {
                currentBookmarkId = index;
            }
        }
        return new Promise(function (resolve, reject) {
            if (direction === Bookmark_1.JUMP_FORWARD) {
                currentBookmarkId++;
                if (currentBookmarkId === _this.bookmarks.length) {
                    currentBookmarkId = 0;
                }
            }
            else {
                currentBookmarkId--;
                if (currentBookmarkId === -1) {
                    currentBookmarkId = _this.bookmarks.length - 1;
                }
            }
            currentBookmark = _this.bookmarks[currentBookmarkId];
            if (currentBookmark.bookmarks.length === 0) {
                if (currentBookmark === _this.activeBookmark) {
                    resolve(Bookmark_1.NO_MORE_BOOKMARKS);
                    return;
                }
                else {
                    _this.nextDocumentWithBookmarks(currentBookmark, direction)
                        .then(function (nextDocument) {
                        resolve(nextDocument);
                        return;
                    })
                        .catch(function (error) {
                        reject(error);
                        return;
                    });
                }
            }
            else {
                if (fs.existsSync(currentBookmark.fsPath)) {
                    resolve(currentBookmark.fsPath);
                    return;
                }
                else {
                    _this.nextDocumentWithBookmarks(currentBookmark, direction)
                        .then(function (nextDocument) {
                        resolve(nextDocument);
                        return;
                    })
                        .catch(function (error) {
                        reject(error);
                        return;
                    });
                }
            }
        });
    };
    Bookmarks.prototype.nextBookmark = function (active, currentLine) {
        var _this = this;
        var currentBookmark = active;
        var currentBookmarkId;
        for (var index = 0; index < this.bookmarks.length; index++) {
            var element = this.bookmarks[index];
            if (element === active) {
                currentBookmarkId = index;
            }
        }
        return new Promise(function (resolve, reject) {
            currentBookmark.nextBookmark(currentLine)
                .then(function (newLine) {
                resolve(newLine);
                return;
            })
                .catch(function (error) {
                // next document                  
                currentBookmarkId++;
                if (currentBookmarkId === _this.bookmarks.length) {
                    currentBookmarkId = 0;
                }
                currentBookmark = _this.bookmarks[currentBookmarkId];
            });
        });
    };
    Bookmarks.prototype.zip = function (relativePath) {
        function isNotEmpty(book) {
            return book.bookmarks.length > 0;
        }
        var newBookmarks = new Bookmarks("");
        //  newBookmarks.bookmarks = this.bookmarks.filter(isNotEmpty);
        newBookmarks.bookmarks = JSON.parse(JSON.stringify(this.bookmarks)).filter(isNotEmpty);
        if (!relativePath) {
            return newBookmarks;
        }
        for (var _i = 0, _a = newBookmarks.bookmarks; _i < _a.length; _i++) {
            var element = _a[_i];
            element.fsPath = element.fsPath.replace(vscode.workspace.rootPath, "$ROOTPATH$");
        }
        return newBookmarks;
    };
    return Bookmarks;
}());
exports.Bookmarks = Bookmarks;
//# sourceMappingURL=Bookmarks.js.map