"use strict";
var path = require("path");
var ts = require("typescript");
var supportedNodeKinds = [
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.PropertyDeclaration,
    ts.SyntaxKind.GetAccessor,
    ts.SyntaxKind.SetAccessor,
    ts.SyntaxKind.InterfaceDeclaration,
    ts.SyntaxKind.EnumDeclaration,
    ts.SyntaxKind.EnumMember,
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.ArrowFunction,
    ts.SyntaxKind.MethodDeclaration,
    ts.SyntaxKind.MethodSignature,
    ts.SyntaxKind.PropertySignature,
    ts.SyntaxKind.Constructor,
    ts.SyntaxKind.FunctionExpression];
function emptyArray(arr) {
    while (arr.length > 0) {
        arr.pop();
    }
}
exports.emptyArray = emptyArray;
function fixWinPath(filePath) {
    if (path.sep === "\\") {
        return filePath.replace(/\\/g, "/");
    }
    return filePath;
}
exports.fixWinPath = fixWinPath;
function findChildForPosition(node, position) {
    var lastMatchingNode;
    var findChildFunc = function (n) {
        var start = n.pos;
        var end = n.end;
        if (start > position) {
            return;
        }
        if (start <= position && end >= position) {
            lastMatchingNode = n;
        }
        n.getChildren().forEach(findChildFunc);
    };
    findChildFunc(node);
    return lastMatchingNode;
}
exports.findChildForPosition = findChildForPosition;
function findFirstChildOfKindDepthFirst(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    var children = node.getChildren();
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var c = children_1[_i];
        if (nodeIsOfKind(c, kinds)) {
            return c;
        }
        var matching = findFirstChildOfKindDepthFirst(c, kinds);
        if (matching) {
            return matching;
        }
    }
    return null;
}
exports.findFirstChildOfKindDepthFirst = findFirstChildOfKindDepthFirst;
function findChildrenOfKind(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    var children = [];
    node.getChildren().forEach(function (c) {
        if (nodeIsOfKind(c, kinds)) {
            children.push(c);
        }
        children = children.concat(findChildrenOfKind(c, kinds));
    });
    return children;
}
exports.findChildrenOfKind = findChildrenOfKind;
function findNonVoidReturnInCurrentScope(node) {
    var returnNode;
    var children = node.getChildren();
    returnNode = children.find(function (n) { return n.kind === ts.SyntaxKind.ReturnStatement; });
    if (returnNode) {
        if (returnNode.getChildren().length > 1) {
            return returnNode;
        }
    }
    for (var _i = 0, children_2 = children; _i < children_2.length; _i++) {
        var child = children_2[_i];
        if (child.kind === ts.SyntaxKind.FunctionDeclaration || child.kind === ts.SyntaxKind.FunctionExpression || child.kind === ts.SyntaxKind.ArrowFunction) {
            continue;
        }
        returnNode = findNonVoidReturnInCurrentScope(child);
        if (returnNode) {
            return returnNode;
        }
    }
    return returnNode;
}
exports.findNonVoidReturnInCurrentScope = findNonVoidReturnInCurrentScope;
function findVisibleChildrenOfKind(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    var children = findChildrenOfKind(node, kinds);
    return children.filter(function (child) {
        if (child.modifiers && child.modifiers.find(function (m) { return m.kind === ts.SyntaxKind.PrivateKeyword; })) {
            return false;
        }
        if (child.kind === ts.SyntaxKind.ClassDeclaration ||
            child.kind === ts.SyntaxKind.InterfaceDeclaration ||
            child.kind === ts.SyntaxKind.FunctionDeclaration) {
            if (!child.modifiers || !child.modifiers.find(function (m) { return m.kind === ts.SyntaxKind.ExportKeyword; })) {
                return false;
            }
        }
        return true;
    });
}
exports.findVisibleChildrenOfKind = findVisibleChildrenOfKind;
function nodeIsOfKind(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    return !!node && !!kinds.find(function (k) { return node.kind === k; });
}
exports.nodeIsOfKind = nodeIsOfKind;
function findFirstParent(node, kinds) {
    if (kinds === void 0) { kinds = supportedNodeKinds; }
    var parent = node.parent;
    while (parent) {
        if (nodeIsOfKind(parent, kinds)) {
            return parent;
        }
        parent = parent.parent;
    }
    return null;
}
exports.findFirstParent = findFirstParent;
var StringBuilder = (function () {
    function StringBuilder() {
        this._text = "";
    }
    StringBuilder.prototype.append = function (text) {
        if (text === void 0) { text = ""; }
        this._text += text;
    };
    StringBuilder.prototype.appendLine = function (text) {
        if (text === void 0) { text = ""; }
        this._text += text + "\n";
    };
    StringBuilder.prototype.toString = function () {
        return this._text;
    };
    StringBuilder.prototype.toCommentString = function (indent, withStart) {
        if (indent === void 0) { indent = ""; }
        if (withStart === void 0) { withStart = true; }
        var sb = new StringBuilder();
        if (withStart) {
            sb.appendLine("/**");
        }
        else {
            sb.appendLine();
        }
        var lines = this._text.split("\n");
        if (lines.every(function (l) { return l === ""; })) {
            emptyArray(lines);
            lines.push("");
            lines.push("");
        }
        lines.forEach(function (line, i) {
            if (line === "" && i === lines.length - 1) {
                return;
            }
            sb.append(indent + " * ");
            sb.appendLine(line);
        });
        if (withStart) {
            sb.appendLine(indent + " */");
        }
        sb.append(indent);
        return sb.toString();
    };
    return StringBuilder;
}());
exports.StringBuilder = StringBuilder;
function formatTypeName(typeName) {
    typeName = typeName.trim();
    if (typeName === "") {
        return null;
    }
    if (typeName === "any") {
        return "{*}";
    }
    if (typeName.indexOf("|") !== -1 || typeName.indexOf("&") !== -1) {
        typeName = "(" + typeName + ")";
    }
    return "{" + typeName + "}";
}
exports.formatTypeName = formatTypeName;
//# sourceMappingURL=utilities.js.map