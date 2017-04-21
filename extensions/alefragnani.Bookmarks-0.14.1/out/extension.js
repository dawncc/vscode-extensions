"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require("vscode");
var fs = require("fs");
var path = require("path");
var Bookmark_1 = require("./Bookmark");
var Bookmarks_1 = require("./Bookmarks");
// this method is called when vs code is activated
function activate(context) {
    var bookmarks;
    var activeEditorCountLine;
    // load pre-saved bookmarks
    var didLoadBookmarks = loadWorkspaceState();
    // Define the Bookmark Decoration
    var pathIcon = vscode.workspace.getConfiguration("bookmarks").get("gutterIconPath", "");
    if (pathIcon !== "") {
        if (!fs.existsSync(pathIcon)) {
            vscode.window.showErrorMessage('The file "' + pathIcon + '" used for "bookmarks.gutterIconPath" does not exists.');
            pathIcon = context.asAbsolutePath("images\\bookmark.png");
        }
    }
    else {
        pathIcon = context.asAbsolutePath("images\\bookmark.png");
    }
    pathIcon = pathIcon.replace(/\\/g, "/");
    // let pathIcon = context.asAbsolutePath('images\\bookmark.png');
    var bookmarkDecorationType = vscode.window.createTextEditorDecorationType({
        gutterIconPath: pathIcon,
        overviewRulerLane: vscode.OverviewRulerLane.Full,
        overviewRulerColor: "rgba(21, 126, 251, 0.7)"
    });
    // Connect it to the Editors Events
    var activeEditor = vscode.window.activeTextEditor;
    // let activeBookmark: Bookmark;
    if (activeEditor) {
        if (!didLoadBookmarks) {
            bookmarks.add(activeEditor.document.uri.fsPath);
        }
        activeEditorCountLine = activeEditor.document.lineCount;
        bookmarks.activeBookmark = bookmarks.fromUri(activeEditor.document.uri.fsPath);
        triggerUpdateDecorations();
    }
    // new docs
    vscode.workspace.onDidOpenTextDocument(function (doc) {
        // activeEditorCountLine = doc.lineCount;
        bookmarks.add(doc.uri.fsPath);
    });
    vscode.window.onDidChangeActiveTextEditor(function (editor) {
        activeEditor = editor;
        if (editor) {
            activeEditorCountLine = editor.document.lineCount;
            bookmarks.activeBookmark = bookmarks.fromUri(editor.document.uri.fsPath);
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(function (event) {
        if (activeEditor && event.document === activeEditor.document) {
            //            triggerUpdateDecorations();
            var updatedBookmark = true;
            // call sticky function when the activeEditor is changed
            if (bookmarks.activeBookmark && bookmarks.activeBookmark.bookmarks.length > 0) {
                updatedBookmark = stickyBookmarks(event);
            }
            activeEditorCountLine = event.document.lineCount;
            updateDecorations();
            if (updatedBookmark) {
                saveWorkspaceState();
            }
        }
    }, null, context.subscriptions);
    // Timeout
    var timeout = null;
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 100);
        //        updateDecorations();
    }
    // Evaluate (prepare the list) and DRAW
    function updateDecorations() {
        if (!activeEditor) {
            return;
        }
        if (!bookmarks.activeBookmark) {
            return;
        }
        if (bookmarks.activeBookmark.bookmarks.length === 0) {
            var books_1 = [];
            activeEditor.setDecorations(bookmarkDecorationType, books_1);
            return;
        }
        var books = [];
        // Remove all bookmarks if active file is empty
        if (activeEditor.document.lineCount === 1 && activeEditor.document.lineAt(0).text === "") {
            bookmarks.activeBookmark.bookmarks = [];
        }
        else {
            var invalids = [];
            // for (let index = 0; index < bookmarks.activeBookmark.bookmarks.length; index++) {
            for (var _i = 0, _a = bookmarks.activeBookmark.bookmarks; _i < _a.length; _i++) {
                var element = _a[_i];
                // let element = bookmarks.activeBookmark.bookmarks[index];
                if (element <= activeEditor.document.lineCount) {
                    var decoration = new vscode.Range(element, 0, element, 0);
                    books.push(decoration);
                }
                else {
                    invalids.push(element);
                }
            }
            if (invalids.length > 0) {
                var idxInvalid = void 0;
                // for (let indexI = 0; indexI < invalids.length; indexI++) {
                for (var _b = 0, invalids_1 = invalids; _b < invalids_1.length; _b++) {
                    var element = invalids_1[_b];
                    idxInvalid = bookmarks.activeBookmark.bookmarks.indexOf(element); // invalids[indexI]);
                    bookmarks.activeBookmark.bookmarks.splice(idxInvalid, 1);
                }
            }
        }
        activeEditor.setDecorations(bookmarkDecorationType, books);
    }
    vscode.commands.registerCommand("bookmarks.clear", function () {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage("Open a file first to clear bookmarks");
            return;
        }
        bookmarks.activeBookmark.clear();
        saveWorkspaceState();
        updateDecorations();
    });
    vscode.commands.registerCommand("bookmarks.clearFromAllFiles", function () {
        // for (let index = 0; index < bookmarks.bookmarks.length; index++) {
        for (var _i = 0, _a = bookmarks.bookmarks; _i < _a.length; _i++) {
            var element = _a[_i];
            // let element = bookmarks.bookmarks[index];
            element.clear();
        }
        saveWorkspaceState();
        updateDecorations();
    });
    function selectLines(editor, lines) {
        var doc = editor.document;
        editor.selections.shift();
        var sels = new Array();
        var newSe;
        lines.forEach(function (line) {
            newSe = new vscode.Selection(line, 0, line, doc.lineAt(line).text.length);
            sels.push(newSe);
        });
        editor.selections = sels;
    }
    vscode.commands.registerCommand("bookmarks.selectLines", function () {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage("Open a file first to clear bookmarks");
            return;
        }
        if (bookmarks.activeBookmark.bookmarks.length === 0) {
            vscode.window.showInformationMessage("No Bookmark found");
            return;
        }
        selectLines(vscode.window.activeTextEditor, bookmarks.activeBookmark.bookmarks);
    });
    function expandLineRange(editor, toLine, direction) {
        var doc = editor.document;
        var newSe;
        var actualSelection = editor.selection;
        // no matter 'the previous selection'. going FORWARD will become 'isReversed = FALSE'
        if (direction === Bookmark_1.JUMP_FORWARD) {
            if (actualSelection.isEmpty || !actualSelection.isReversed) {
                newSe = new vscode.Selection(editor.selection.start.line, editor.selection.start.character, toLine, doc.lineAt(toLine).text.length);
            }
            else {
                newSe = new vscode.Selection(editor.selection.end.line, editor.selection.end.character, toLine, doc.lineAt(toLine).text.length);
            }
        }
        else {
            if (actualSelection.isEmpty || !actualSelection.isReversed) {
                newSe = new vscode.Selection(editor.selection.start.line, editor.selection.start.character, toLine, 0);
            }
            else {
                newSe = new vscode.Selection(editor.selection.end.line, editor.selection.end.character, toLine, 0);
            }
        }
        editor.selection = newSe;
    }
    function shrinkLineRange(editor, toLine, direction) {
        var doc = editor.document;
        var newSe;
        // no matter 'the previous selection'. going FORWARD will become 'isReversed = FALSE'
        if (direction === Bookmark_1.JUMP_FORWARD) {
            newSe = new vscode.Selection(editor.selection.end.line, editor.selection.end.character, toLine, 0);
        }
        else {
            newSe = new vscode.Selection(editor.selection.start.line, editor.selection.start.character, toLine, doc.lineAt(toLine).text.length);
        }
        editor.selection = newSe;
    }
    vscode.commands.registerCommand("bookmarks.expandSelectionToNext", function () { return expandSelectionToNextBookmark(Bookmark_1.JUMP_FORWARD); });
    vscode.commands.registerCommand("bookmarks.expandSelectionToPrevious", function () { return expandSelectionToNextBookmark(Bookmark_1.JUMP_BACKWARD); });
    vscode.commands.registerCommand("bookmarks.shrinkSelection", function () { return shrinkSelection(); });
    function shrinkSelection() {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage("Open a file first to shrink bookmark selection");
            return;
        }
        if (vscode.window.activeTextEditor.selections.length > 1) {
            vscode.window.showInformationMessage("Command not supported with more than one selection");
            return;
        }
        if (vscode.window.activeTextEditor.selection.isEmpty) {
            vscode.window.showInformationMessage("No selection found");
            return;
        }
        if (bookmarks.activeBookmark.bookmarks.length === 0) {
            vscode.window.showInformationMessage("No Bookmark found");
            return;
        }
        // which direction?
        var direction = vscode.window.activeTextEditor.selection.isReversed ? Bookmark_1.JUMP_FORWARD : Bookmark_1.JUMP_BACKWARD;
        var activeSelectionStartLine = vscode.window.activeTextEditor.selection.isReversed ? vscode.window.activeTextEditor.selection.end.line : vscode.window.activeTextEditor.selection.start.line;
        var baseLine;
        if (direction === Bookmark_1.JUMP_FORWARD) {
            baseLine = vscode.window.activeTextEditor.selection.start.line;
        }
        else {
            baseLine = vscode.window.activeTextEditor.selection.end.line;
        }
        bookmarks.activeBookmark.nextBookmark(baseLine, direction)
            .then(function (nextLine) {
            if ((nextLine === Bookmark_1.NO_MORE_BOOKMARKS) || (nextLine === Bookmark_1.NO_BOOKMARKS)) {
                vscode.window.setStatusBarMessage("No more bookmarks", 2000);
                return;
            }
            else {
                if ((direction === Bookmark_1.JUMP_BACKWARD && nextLine < activeSelectionStartLine) ||
                    (direction === Bookmark_1.JUMP_FORWARD && nextLine > activeSelectionStartLine)) {
                    // vscode.window.showInformationMessage('No more bookmarks to shrink...');
                    vscode.window.setStatusBarMessage("No more bookmarks to shrink", 2000);
                }
                else {
                    shrinkLineRange(vscode.window.activeTextEditor, parseInt(nextLine.toString(), 10), direction);
                }
            }
        })
            .catch(function (error) {
            console.log("activeBookmark.nextBookmark REJECT" + error);
        });
    }
    function expandSelectionToNextBookmark(direction) {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage("Open a file first to clear bookmarks");
            return;
        }
        if (bookmarks.activeBookmark.bookmarks.length === 0) {
            vscode.window.showInformationMessage("No Bookmark found");
            return;
        }
        if (bookmarks.activeBookmark.bookmarks.length === 1) {
            vscode.window.showInformationMessage("There is only one bookmark in this file");
            return;
        }
        var baseLine;
        if (vscode.window.activeTextEditor.selection.isEmpty) {
            baseLine = vscode.window.activeTextEditor.selection.active.line;
        }
        else {
            if (direction === Bookmark_1.JUMP_FORWARD) {
                baseLine = vscode.window.activeTextEditor.selection.end.line;
            }
            else {
                baseLine = vscode.window.activeTextEditor.selection.start.line;
            }
        }
        bookmarks.activeBookmark.nextBookmark(baseLine, direction)
            .then(function (nextLine) {
            if ((nextLine === Bookmark_1.NO_MORE_BOOKMARKS) || (nextLine === Bookmark_1.NO_BOOKMARKS)) {
                // vscode.window.showInformationMessage('No more bookmarks...');
                vscode.window.setStatusBarMessage("No more bookmarks", 2000);
                return;
            }
            else {
                expandLineRange(vscode.window.activeTextEditor, parseInt(nextLine.toString(), 10), direction);
            }
        })
            .catch(function (error) {
            console.log("activeBookmark.nextBookmark REJECT" + error);
        });
    }
    ;
    // other commands
    vscode.commands.registerCommand("bookmarks.toggle", function () {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage("Open a file first to toggle bookmarks");
            return;
        }
        var line = vscode.window.activeTextEditor.selection.active.line;
        // fix issue emptyAtLaunch
        if (!bookmarks.activeBookmark) {
            bookmarks.add(vscode.window.activeTextEditor.document.uri.fsPath);
            bookmarks.activeBookmark = bookmarks.fromUri(vscode.window.activeTextEditor.document.uri.fsPath);
        }
        var index = bookmarks.activeBookmark.bookmarks.indexOf(line);
        if (index < 0) {
            bookmarks.activeBookmark.bookmarks.push(line);
        }
        else {
            bookmarks.activeBookmark.bookmarks.splice(index, 1);
        }
        // sorted
        /* let itemsSorted = [] =*/
        bookmarks.activeBookmark.bookmarks.sort(function (n1, n2) {
            if (n1 > n2) {
                return 1;
            }
            if (n1 < n2) {
                return -1;
            }
            return 0;
        });
        saveWorkspaceState();
        updateDecorations();
    });
    vscode.commands.registerCommand("bookmarks.jumpToNext", function () {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage("Open a file first to jump to bookmarks");
            return;
        }
        if (!bookmarks.activeBookmark) {
            return;
        }
        // 
        bookmarks.activeBookmark.nextBookmark(vscode.window.activeTextEditor.selection.active.line)
            .then(function (nextLine) {
            if ((nextLine === Bookmark_1.NO_MORE_BOOKMARKS) || (nextLine === Bookmark_1.NO_BOOKMARKS)) {
                bookmarks.nextDocumentWithBookmarks(bookmarks.activeBookmark)
                    .then(function (nextDocument) {
                    if (nextDocument === Bookmark_1.NO_MORE_BOOKMARKS) {
                        return;
                    }
                    // same document?
                    var activeDocument = Bookmarks_1.Bookmarks.normalize(vscode.window.activeTextEditor.document.uri.fsPath);
                    if (nextDocument.toString() === activeDocument) {
                        revealLine(bookmarks.activeBookmark.bookmarks[0]);
                    }
                    else {
                        vscode.workspace.openTextDocument(nextDocument.toString()).then(function (doc) {
                            vscode.window.showTextDocument(doc).then(function (editor) {
                                revealLine(bookmarks.activeBookmark.bookmarks[0]);
                            });
                        });
                    }
                })
                    .catch(function (error) {
                    vscode.window.showInformationMessage("No more bookmarks...");
                });
            }
            else {
                revealLine(parseInt(nextLine.toString(), 10));
            }
        })
            .catch(function (error) {
            console.log("activeBookmark.nextBookmark REJECT" + error);
        });
    });
    vscode.commands.registerCommand("bookmarks.jumpToPrevious", function () {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage("Open a file first to jump to bookmarks");
            return;
        }
        if (!bookmarks.activeBookmark) {
            return;
        }
        // 
        bookmarks.activeBookmark.nextBookmark(vscode.window.activeTextEditor.selection.active.line, Bookmark_1.JUMP_BACKWARD)
            .then(function (nextLine) {
            if ((nextLine === Bookmark_1.NO_MORE_BOOKMARKS) || (nextLine === Bookmark_1.NO_BOOKMARKS)) {
                bookmarks.nextDocumentWithBookmarks(bookmarks.activeBookmark, Bookmark_1.JUMP_BACKWARD)
                    .then(function (nextDocument) {
                    if (nextDocument === Bookmark_1.NO_MORE_BOOKMARKS) {
                        return;
                    }
                    // same document?
                    var activeDocument = Bookmarks_1.Bookmarks.normalize(vscode.window.activeTextEditor.document.uri.fsPath);
                    if (nextDocument.toString() === activeDocument) {
                        // revealLine(activeBookmark.bookmarks[0]);
                        revealLine(bookmarks.activeBookmark.bookmarks[bookmarks.activeBookmark.bookmarks.length - 1]);
                    }
                    else {
                        vscode.workspace.openTextDocument(nextDocument.toString()).then(function (doc) {
                            vscode.window.showTextDocument(doc).then(function (editor) {
                                // revealLine(activeBookmark.bookmarks[0]);
                                revealLine(bookmarks.activeBookmark.bookmarks[bookmarks.activeBookmark.bookmarks.length - 1]);
                            });
                        });
                    }
                })
                    .catch(function (error) {
                    vscode.window.showInformationMessage("No more bookmarks...");
                });
            }
            else {
                revealLine(parseInt(nextLine.toString(), 10));
            }
        })
            .catch(function (error) {
            console.log("activeBookmark.nextBookmark REJECT" + error);
        });
    });
    vscode.commands.registerCommand("bookmarks.list", function () {
        if (!vscode.window.activeTextEditor) {
            vscode.window.showInformationMessage("Open a file first to list bookmarks");
            return;
        }
        // no active bookmark
        if (!bookmarks.activeBookmark) {
            vscode.window.showInformationMessage("No Bookmark found");
            return;
        }
        // no bookmark
        if (bookmarks.activeBookmark.bookmarks.length === 0) {
            vscode.window.showInformationMessage("No Bookmark found");
            return;
        }
        // push the items
        var items = [];
        // tslint:disable-next-line:prefer-for-of
        for (var index = 0; index < bookmarks.activeBookmark.bookmarks.length; index++) {
            var element = bookmarks.activeBookmark.bookmarks[index] + 1;
            var lineText = vscode.window.activeTextEditor.document.lineAt(element - 1).text;
            items.push({ label: element.toString(), description: lineText });
        }
        // pick one
        var currentLine = vscode.window.activeTextEditor.selection.active.line + 1;
        var options = {
            placeHolder: "Type a line number or a piece of code to navigate to",
            matchOnDescription: true,
            onDidSelectItem: function (item) {
                revealLine(parseInt(item.label, 10) - 1);
            }
        };
        vscode.window.showQuickPick(items, options).then(function (selection) {
            if (typeof selection === "undefined") {
                revealLine(currentLine - 1);
                return;
            }
            revealLine(parseInt(selection.label, 10) - 1);
        });
    });
    vscode.commands.registerCommand("bookmarks.listFromAllFiles", function () {
        // no bookmark
        var totalBookmarkCount = 0;
        // for (let index = 0; index < bookmarks.bookmarks.length; index++) {
        for (var _i = 0, _a = bookmarks.bookmarks; _i < _a.length; _i++) {
            var element = _a[_i];
            // totalBookmarkCount = totalBookmarkCount +  bookmarks.bookmarks[index].bookmarks.length;
            totalBookmarkCount = totalBookmarkCount + element.bookmarks.length;
        }
        if (totalBookmarkCount === 0) {
            vscode.window.showInformationMessage("No Bookmarks found");
            return;
        }
        // push the items
        var items = [];
        var activeTextEditorPath = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.uri.fsPath : "";
        var promisses = [];
        var currentLine = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.selection.active.line + 1 : -1;
        // for (let index = 0; index < bookmarks.bookmarks.length; index++) {
        for (var _b = 0, _c = bookmarks.bookmarks; _b < _c.length; _b++) {
            var bookmark = _c[_b];
            // let bookmark = bookmarks.bookmarks[index];
            var pp = bookmark.listBookmarks();
            promisses.push(pp);
        }
        Promise.all(promisses).then(function (values) {
            // for (let index = 0; index < values.length; index++) {
            for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                var element = values_1[_i];
                // let element = values[index];
                // for (let indexInside = 0; indexInside < element.length; indexInside++) {
                for (var _a = 0, element_1 = element; _a < element_1.length; _a++) {
                    var elementInside = element_1[_a];
                    // let elementInside = element[indexInside];
                    if (elementInside.detail.toString().toLowerCase() === activeTextEditorPath.toLowerCase()) {
                        items.push({
                            label: elementInside.label,
                            description: elementInside.description
                        });
                    }
                    else {
                        var itemPath = removeRootPathFrom(elementInside.detail);
                        items.push({
                            label: elementInside.label,
                            description: elementInside.description,
                            detail: itemPath
                        });
                    }
                }
            }
            // sort
            // - active document
            // - no octicon - document inside project
            // - with octicon - document outside project
            var itemsSorted;
            itemsSorted = items.sort(function (a, b) {
                if (!a.detail && !b.detail) {
                    return 0;
                }
                else {
                    if (!a.detail && b.detail) {
                        return -1;
                    }
                    else {
                        if (a.detail && !b.detail) {
                            return 1;
                        }
                        else {
                            if ((a.detail.toString().indexOf("$(file-directory) ") === 0) && (b.detail.toString().indexOf("$(file-directory) ") === -1)) {
                                return 1;
                            }
                            else {
                                if ((a.detail.toString().indexOf("$(file-directory) ") === -1) && (b.detail.toString().indexOf("$(file-directory) ") === 0)) {
                                    return -1;
                                }
                                else {
                                    return 0;
                                }
                            }
                        }
                    }
                }
            });
            var options = {
                placeHolder: "Type a line number or a piece of code to navigate to",
                matchOnDescription: true,
                onDidSelectItem: function (item) {
                    var filePath;
                    // no detail - previously active document
                    if (!item.detail) {
                        filePath = activeTextEditorPath;
                    }
                    else {
                        // with octicon - document outside project
                        if (item.detail.toString().indexOf("$(file-directory) ") === 0) {
                            filePath = item.detail.toString().split("$(file-directory) ").pop();
                        }
                        else {
                            filePath = vscode.workspace.rootPath + item.detail.toString();
                        }
                    }
                    if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri.fsPath.toLowerCase() === filePath.toLowerCase()) {
                        revealLine(parseInt(item.label, 10) - 1);
                    }
                    else {
                        var uriDocument = vscode.Uri.file(filePath);
                        vscode.workspace.openTextDocument(uriDocument).then(function (doc) {
                            vscode.window.showTextDocument(doc, undefined, true).then(function (editor) {
                                revealLine(parseInt(item.label, 10) - 1);
                            });
                        });
                    }
                }
            };
            vscode.window.showQuickPick(itemsSorted, options).then(function (selection) {
                if (typeof selection === "undefined") {
                    if (activeTextEditorPath === "") {
                        return;
                    }
                    else {
                        var uriDocument = vscode.Uri.file(activeTextEditorPath);
                        vscode.workspace.openTextDocument(uriDocument).then(function (doc) {
                            vscode.window.showTextDocument(doc).then(function (editor) {
                                revealLine(currentLine - 1);
                                return;
                            });
                        });
                    }
                }
                if (typeof selection === "undefined") {
                    return;
                }
                if (!selection.detail) {
                    revealLine(parseInt(selection.label, 10) - 1);
                }
                else {
                    var newPath = vscode.workspace.rootPath + selection.detail.toString();
                    var uriDocument = vscode.Uri.file(newPath);
                    vscode.workspace.openTextDocument(uriDocument).then(function (doc) {
                        vscode.window.showTextDocument(doc).then(function (editor) {
                            revealLine(parseInt(selection.label, 10) - 1);
                        });
                    });
                }
            });
        });
    });
    function revealLine(line) {
        var reviewType = vscode.TextEditorRevealType.InCenter;
        if (line === vscode.window.activeTextEditor.selection.active.line) {
            reviewType = vscode.TextEditorRevealType.InCenterIfOutsideViewport;
        }
        var newSe = new vscode.Selection(line, 0, line, 0);
        vscode.window.activeTextEditor.selection = newSe;
        vscode.window.activeTextEditor.revealRange(newSe, reviewType);
    }
    function loadWorkspaceState() {
        var saveBookmarksInProject = vscode.workspace.getConfiguration("bookmarks").get("saveBookmarksInProject", false);
        bookmarks = new Bookmarks_1.Bookmarks("");
        if (vscode.workspace.rootPath && saveBookmarksInProject) {
            var bookmarksFileInProject = path.join(vscode.workspace.rootPath, ".vscode", "bookmarks.json");
            if (!fs.existsSync(bookmarksFileInProject)) {
                return false;
            }
            try {
                bookmarks.loadFrom(JSON.parse(fs.readFileSync(bookmarksFileInProject).toString()), true);
                return true;
            }
            catch (error) {
                vscode.window.showErrorMessage("Error loading Bookmarks: " + error.toString());
                return false;
            }
        }
        else {
            var savedBookmarks = context.workspaceState.get("bookmarks", "");
            if (savedBookmarks !== "") {
                bookmarks.loadFrom(JSON.parse(savedBookmarks));
            }
            return savedBookmarks !== "";
        }
    }
    function saveWorkspaceState() {
        var saveBookmarksInProject = vscode.workspace.getConfiguration("bookmarks").get("saveBookmarksInProject", false);
        if (vscode.workspace.rootPath && saveBookmarksInProject) {
            var bookmarksFileInProject = path.join(vscode.workspace.rootPath, ".vscode", "bookmarks.json");
            if (!fs.existsSync(path.dirname(bookmarksFileInProject))) {
                fs.mkdirSync(path.dirname(bookmarksFileInProject));
            }
            fs.writeFileSync(bookmarksFileInProject, JSON.stringify(bookmarks.zip(true), null, "\t"));
        }
        else {
            context.workspaceState.update("bookmarks", JSON.stringify(bookmarks.zip()));
        }
    }
    function HadOnlyOneValidContentChange(event) {
        // not valid
        if ((event.contentChanges.length > 2) || (event.contentChanges.length === 0)) {
            return false;
        }
        // normal behavior - only 1
        if (event.contentChanges.length === 1) {
            return true;
        }
        else {
            if (event.contentChanges.length === 2) {
                var trimAutoWhitespace = vscode.workspace.getConfiguration("editor").get("trimAutoWhitespace", true);
                if (!trimAutoWhitespace) {
                    return false;
                }
                // check if the first range is 'equal' and if the second is 'empty'
                var fistRangeEquals = (event.contentChanges[0].range.start.character === event.contentChanges[0].range.end.character) &&
                    (event.contentChanges[0].range.start.line === event.contentChanges[0].range.end.line);
                var secondRangeEmpty = (event.contentChanges[1].text === "") &&
                    (event.contentChanges[1].range.start.line === event.contentChanges[1].range.end.line) &&
                    (event.contentChanges[1].range.start.character === 0) &&
                    (event.contentChanges[1].range.end.character > 0);
                return fistRangeEquals && secondRangeEmpty;
            }
        }
    }
    // function used to attach bookmarks at the line
    function stickyBookmarks(event) {
        // sticky is now the default/only behavior
        // let useStickyBookmarks: boolean = vscode.workspace.getConfiguration("bookmarks").get("useStickyBookmarks", false);
        // if (!useStickyBookmarks) {
        //     return false;
        // }
        var diffLine;
        var updatedBookmark = false;
        // fix autoTrimWhitespace
        // if (event.contentChanges.length === 1) {
        if (HadOnlyOneValidContentChange(event)) {
            // add or delete line case
            if (event.document.lineCount !== activeEditorCountLine) {
                if (event.document.lineCount > activeEditorCountLine) {
                    diffLine = event.document.lineCount - activeEditorCountLine;
                }
                else if (event.document.lineCount < activeEditorCountLine) {
                    diffLine = activeEditorCountLine - event.document.lineCount;
                    diffLine = 0 - diffLine;
                    // one line up
                    if (event.contentChanges[0].range.end.line - event.contentChanges[0].range.start.line === 1) {
                        if ((event.contentChanges[0].range.end.character === 0) &&
                            (event.contentChanges[0].range.start.character === 0)) {
                            // the bookmarked one
                            var idxbk = bookmarks.activeBookmark.bookmarks.indexOf(event.contentChanges[0].range.start.line);
                            if (idxbk > -1) {
                                bookmarks.activeBookmark.bookmarks.splice(idxbk, 1);
                            }
                        }
                    }
                    if (event.contentChanges[0].range.end.line - event.contentChanges[0].range.start.line > 1) {
                        for (var i = event.contentChanges[0].range.start.line; i <= event.contentChanges[0].range.end.line; i++) {
                            var index = bookmarks.activeBookmark.bookmarks.indexOf(i);
                            if (index > -1) {
                                bookmarks.activeBookmark.bookmarks.splice(index, 1);
                                updatedBookmark = true;
                            }
                        }
                    }
                }
                // for (let index in bookmarks.activeBookmark.bookmarks) {
                for (var index = 0; index < bookmarks.activeBookmark.bookmarks.length; index++) {
                    var eventLine = event.contentChanges[0].range.start.line;
                    var eventcharacter = event.contentChanges[0].range.start.character;
                    // indent ?
                    if (eventcharacter > 0) {
                        var textInEventLine = activeEditor.document.lineAt(eventLine).text;
                        textInEventLine = textInEventLine.replace(/\t/g, "").replace(/\s/g, "");
                        if (textInEventLine === "") {
                            eventcharacter = 0;
                        }
                    }
                    // also =
                    if (((bookmarks.activeBookmark.bookmarks[index] > eventLine) && (eventcharacter > 0)) ||
                        ((bookmarks.activeBookmark.bookmarks[index] >= eventLine) && (eventcharacter === 0))) {
                        var newLine = bookmarks.activeBookmark.bookmarks[index] + diffLine;
                        if (newLine < 0) {
                            newLine = 0;
                        }
                        bookmarks.activeBookmark.bookmarks[index] = newLine;
                        updatedBookmark = true;
                    }
                }
            }
            // paste case
            if (!updatedBookmark && (event.contentChanges[0].text.length > 1)) {
                var selection = vscode.window.activeTextEditor.selection;
                var lineRange = [selection.start.line, selection.end.line];
                var lineMin = Math.min.apply(this, lineRange);
                var lineMax = Math.max.apply(this, lineRange);
                if (selection.start.character > 0) {
                    lineMin++;
                }
                if (selection.end.character < vscode.window.activeTextEditor.document.lineAt(selection.end).range.end.character) {
                    lineMax--;
                }
                if (lineMin <= lineMax) {
                    for (var i = lineMin; i <= lineMax; i++) {
                        var index = bookmarks.activeBookmark.bookmarks.indexOf(i);
                        if (index > -1) {
                            bookmarks.activeBookmark.bookmarks.splice(index, 1);
                            updatedBookmark = true;
                        }
                    }
                }
            }
        }
        else if (event.contentChanges.length === 2) {
            // move line up and move line down case
            if (activeEditor.selections.length === 1) {
                if (event.contentChanges[0].text === "") {
                    updatedBookmark = moveStickyBookmarks("down");
                }
                else if (event.contentChanges[1].text === "") {
                    updatedBookmark = moveStickyBookmarks("up");
                }
            }
        }
        return updatedBookmark;
    }
    function moveStickyBookmarks(direction) {
        var diffChange = -1;
        var updatedBookmark = false;
        var diffLine;
        var selection = activeEditor.selection;
        var lineRange = [selection.start.line, selection.end.line];
        var lineMin = Math.min.apply(this, lineRange);
        var lineMax = Math.max.apply(this, lineRange);
        if (selection.end.character === 0 && !selection.isSingleLine) {
            var lineAt = activeEditor.document.lineAt(selection.end.line);
            var posMin = new vscode.Position(selection.start.line + 1, selection.start.character);
            var posMax = new vscode.Position(selection.end.line, lineAt.range.end.character);
            vscode.window.activeTextEditor.selection = new vscode.Selection(posMin, posMax);
            lineMax--;
        }
        if (direction === "up") {
            diffLine = 1;
            var index = bookmarks.activeBookmark.bookmarks.indexOf(lineMin - 1);
            if (index > -1) {
                diffChange = lineMax;
                bookmarks.activeBookmark.bookmarks.splice(index, 1);
                updatedBookmark = true;
            }
        }
        else if (direction === "down") {
            diffLine = -1;
            var index = void 0;
            index = bookmarks.activeBookmark.bookmarks.indexOf(lineMax + 1);
            if (index > -1) {
                diffChange = lineMin;
                bookmarks.activeBookmark.bookmarks.splice(index, 1);
                updatedBookmark = true;
            }
        }
        lineRange = [];
        for (var i = lineMin; i <= lineMax; i++) {
            lineRange.push(i);
        }
        lineRange = lineRange.sort();
        if (diffLine < 0) {
            lineRange = lineRange.reverse();
        }
        for (var i in lineRange) {
            var index = bookmarks.activeBookmark.bookmarks.indexOf(lineRange[i]);
            if (index > -1) {
                bookmarks.activeBookmark.bookmarks[index] -= diffLine;
                updatedBookmark = true;
            }
        }
        if (diffChange > -1) {
            bookmarks.activeBookmark.bookmarks.push(diffChange);
            updatedBookmark = true;
        }
        return updatedBookmark;
    }
    function removeRootPathFrom(path) {
        if (!vscode.workspace.rootPath) {
            return path;
        }
        if (path.indexOf(vscode.workspace.rootPath) === 0) {
            return path.split(vscode.workspace.rootPath).pop();
        }
        else {
            return "$(file-directory) " + path;
        }
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map