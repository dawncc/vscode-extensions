"use strict";
var vs = require("vscode");
var ts = require("typescript");
var utils = require("./utilities");
var languageServiceHost_1 = require("./languageServiceHost");
function includeTypes() {
    return vs.workspace.getConfiguration().get("docthis.includeTypes", true);
}
function enableHungarianNotationEvaluation() {
    return vs.workspace.getConfiguration().get("docthis.enableHungarianNotationEvaluation", false);
}
var Documenter = (function () {
    function Documenter() {
        this._languageServiceHost = new languageServiceHost_1.LanguageServiceHost();
        this._services = ts.createLanguageService(this._languageServiceHost, ts.createDocumentRegistry());
        this._program = this._services.getProgram();
    }
    Documenter.prototype.automaticDocument = function (editor, edit) {
        var selection = editor.selection;
        var caret = selection.start;
        var sourceFile = this._getSourceFile(editor.document);
        var newText = editor.document.getText();
        sourceFile.update(newText, {
            newLength: newText.length,
            span: {
                start: 0,
                length: newText.length
            }
        });
        var position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        var node = utils.findChildForPosition(sourceFile, position);
        var documentNode = utils.nodeIsOfKind(node) ? node : utils.findFirstParent(node);
        var sb = new utils.StringBuilder();
        var foundLocation = this._documentNode(sb, documentNode, editor, sourceFile);
        if (foundLocation) {
            var foundLocationOffset = editor.document.offsetAt(new vs.Position(foundLocation.line, foundLocation.character));
            var caretOffset = editor.document.offsetAt(caret);
            if (caretOffset > foundLocationOffset) {
                return;
            }
            this._insertDocumentation(sb, caret, editor, edit, sourceFile, false, true);
        }
    };
    Documenter.prototype.documentThis = function (editor, edit, commandName) {
        var selection = editor.selection;
        var caret = selection.start;
        var sourceFile = this._getSourceFile(editor.document);
        var position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        var node = utils.findChildForPosition(sourceFile, position);
        var documentNode = utils.nodeIsOfKind(node) ? node : utils.findFirstParent(node);
        if (!documentNode) {
            this._showFailureMessage(commandName, "at the current caret position");
            return;
        }
        var sb = new utils.StringBuilder();
        var docLocation = this._documentNode(sb, documentNode, editor, sourceFile);
        if (docLocation) {
            this._insertDocumentation(sb, docLocation, editor, edit, sourceFile, true, true);
        }
        else {
            this._showFailureMessage(commandName, "at the current caret position");
        }
    };
    Documenter.prototype._jumpToDescriptionLocation = function (commentText) {
        if (vs.workspace.getConfiguration().get("docthis.enableJumpToDescriptionLocation", true)) {
            var lines = commentText.split("\n");
            var count = lines.length;
            var line = vs.window.activeTextEditor.selection.start.line - (count - 2);
            var character = lines[1].length;
            var position = new vs.Position(line, character);
            var selection = new vs.Selection(position, position);
            vs.window.activeTextEditor.selection = selection;
        }
    };
    Documenter.prototype.documentEverything = function (editor, edit, visibleOnly, commandName) {
        var _this = this;
        var sourceFile = this._getSourceFile(editor.document);
        var documentable = visibleOnly ? utils.findVisibleChildrenOfKind(sourceFile) : utils.findChildrenOfKind(sourceFile);
        var showFailure = false;
        documentable.forEach(function (node) {
            var sb = new utils.StringBuilder();
            var docLocation = _this._documentNode(sb, node, editor, sourceFile);
            if (docLocation) {
                _this._insertDocumentation(sb, docLocation, editor, edit, sourceFile);
            }
            else {
                showFailure = true;
            }
            sourceFile = _this._getSourceFile(editor.document);
        });
        if (showFailure) {
            this._showFailureMessage(commandName, "for everything in the document");
        }
    };
    Documenter.prototype.traceNode = function (editor, edit) {
        var selection = editor.selection;
        var caret = selection.start;
        var sourceFile = this._getSourceFile(editor.document);
        var position = ts.getPositionOfLineAndCharacter(sourceFile, caret.line, caret.character);
        var node = utils.findChildForPosition(sourceFile, position);
        var nodes = [];
        var parent = node;
        while (parent) {
            nodes.push(this._printNodeInfo(parent, sourceFile));
            parent = parent.parent;
        }
        var sb = new utils.StringBuilder();
        nodes.reverse().forEach(function (n) {
            sb.appendLine(n);
        });
        if (!this._outputChannel) {
            this._outputChannel = vs.window.createOutputChannel("TypeScript Syntax Node Trace");
        }
        this._outputChannel.show();
        this._outputChannel.appendLine(sb.toString());
    };
    Documenter.prototype._printNodeInfo = function (node, sourceFile) {
        var sb = new utils.StringBuilder();
        sb.appendLine(node.getStart() + " to " + node.getEnd() + " --- (" + node.kind + ") " + ts.SyntaxKind[node.kind]);
        var column = sourceFile.getLineAndCharacterOfPosition(node.getStart()).character;
        for (var i = 0; i < column; i++) {
            sb.append(" ");
        }
        sb.appendLine(node.getText());
        return sb.toString();
    };
    Documenter.prototype._showFailureMessage = function (commandName, condition) {
        vs.window.showErrorMessage("Sorry! '" + commandName + "' wasn't able to produce documentation " + condition + ".");
    };
    // TODO: This is pretty messy...
    Documenter.prototype._insertDocumentation = function (sb, position, editor, edit, sourceFile, withStart, goToDescription) {
        var _this = this;
        if (withStart === void 0) { withStart = true; }
        if (goToDescription === void 0) { goToDescription = false; }
        var location = new vs.Position(position.line, position.character);
        var indentStartLocation = new vs.Position(position.line, 0);
        var indentRange = new vs.Range(indentStartLocation, location);
        var commentText;
        if (!withStart) {
            if (position.character - 3 >= 0) {
                indentRange = new vs.Range(indentStartLocation, new vs.Position(position.line, position.character - 3));
            }
            var indent = editor.document.getText(indentRange);
            commentText = sb.toCommentString(indent, withStart);
            var lines = commentText.split("\n");
            var firstLines = lines.splice(0, 2).join("\n");
            edit.insert(location, firstLines);
            var latterLocation = new vs.Position(position.line, position.character);
            edit.insert(latterLocation, "\n" + lines.join("\n"));
        }
        else {
            var indent = editor.document.getText(indentRange);
            commentText = sb.toCommentString(indent, withStart);
            edit.insert(location, commentText);
        }
        if (withStart) {
            var newText = editor.document.getText();
            try {
                sourceFile.update(newText, {
                    newLength: newText.length,
                    span: {
                        start: 0,
                        length: newText.length
                    }
                });
            }
            catch (error) {
                console.warn("Error in source file update:", error);
            }
        }
        if (goToDescription) {
            setTimeout(function () {
                _this._jumpToDescriptionLocation(commentText);
            }, 100);
        }
    };
    Documenter.prototype._getSourceFile = function (document) {
        var fileName = utils.fixWinPath(document.fileName);
        var fileText = document.getText();
        this._languageServiceHost.setCurrentFile(fileName, fileText);
        return this._services.getSourceFile(fileName);
    };
    Documenter.prototype._documentNode = function (sb, node, editor, sourceFile) {
        switch (node.kind) {
            case ts.SyntaxKind.ClassDeclaration:
                this._emitClassDeclaration(sb, node);
                break;
            case ts.SyntaxKind.PropertyDeclaration:
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
                this._emitPropertyDeclaration(sb, node);
                break;
            case ts.SyntaxKind.InterfaceDeclaration:
                this._emitInterfaceDeclaration(sb, node);
                break;
            case ts.SyntaxKind.EnumDeclaration:
                this._emitEnumDeclaration(sb, node);
                break;
            case ts.SyntaxKind.EnumMember:
                sb.appendLine();
                break;
            case ts.SyntaxKind.FunctionDeclaration:
            case ts.SyntaxKind.MethodDeclaration:
            case ts.SyntaxKind.MethodSignature:
                this._emitMethodDeclaration(sb, node);
                break;
            case ts.SyntaxKind.Constructor:
                this._emitConstructorDeclaration(sb, node);
                break;
            case ts.SyntaxKind.FunctionExpression:
            case ts.SyntaxKind.ArrowFunction:
                return this._emitFunctionExpression(sb, node, sourceFile);
            default:
                return;
        }
        return ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
    };
    Documenter.prototype._emitFunctionExpression = function (sb, node, sourceFile) {
        var targetNode = node.parent;
        if (node.parent.kind !== ts.SyntaxKind.PropertyAssignment &&
            node.parent.kind !== ts.SyntaxKind.BinaryExpression) {
            targetNode = utils.findFirstParent(targetNode, [ts.SyntaxKind.VariableDeclarationList]);
            if (!targetNode) {
                return;
            }
        }
        sb.appendLine();
        sb.appendLine();
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
        this._emitMemberOf(sb, node.parent);
        return ts.getLineAndCharacterOfPosition(sourceFile, targetNode.getStart());
    };
    Documenter.prototype._emitClassDeclaration = function (sb, node) {
        sb.appendLine();
        sb.appendLine();
        this._emitModifiers(sb, node);
        sb.appendLine("@class " + node.name.getText());
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    };
    Documenter.prototype._emitPropertyDeclaration = function (sb, node) {
        sb.appendLine();
        sb.appendLine();
        if (node.kind === ts.SyntaxKind.GetAccessor) {
            var name_1 = utils.findFirstChildOfKindDepthFirst(node, [ts.SyntaxKind.Identifier]).getText();
            var parentClass = node.parent;
            var hasSetter = !!parentClass.members.find(function (c) { return c.kind === ts.SyntaxKind.SetAccessor &&
                utils.findFirstChildOfKindDepthFirst(c, [ts.SyntaxKind.Identifier]).getText() === name_1; });
            if (!hasSetter) {
                sb.appendLine("@readonly");
            }
        }
        this._emitModifiers(sb, node);
        // JSDoc fails to emit documentation for arrow function syntax. (https://github.com/jsdoc3/jsdoc/issues/1100)
        if (includeTypes()) {
            if (node.type && node.type.getText().indexOf("=>") === -1) {
                sb.append("@type " + utils.formatTypeName(node.type.getText()));
            }
            else if (enableHungarianNotationEvaluation() && this._isHungarianNotation(node.name.getText())) {
                sb.append("@type " + this._getHungarianNotationType(node.name.getText()));
            }
        }
        this._emitMemberOf(sb, node.parent);
    };
    Documenter.prototype._emitInterfaceDeclaration = function (sb, node) {
        sb.appendLine();
        sb.appendLine();
        this._emitModifiers(sb, node);
        sb.appendLine("@interface " + node.name.getText());
        this._emitHeritageClauses(sb, node);
        this._emitTypeParameters(sb, node);
    };
    Documenter.prototype._emitEnumDeclaration = function (sb, node) {
        sb.appendLine();
        sb.appendLine();
        this._emitModifiers(sb, node);
        sb.appendLine("@enum {number}");
    };
    Documenter.prototype._emitDescriptionDeclaration = function (sb) {
        if (vs.workspace.getConfiguration().get("docthis.includeDescriptionTag", true)) {
            sb.appendLine("@description");
        }
    };
    Documenter.prototype._emitMethodDeclaration = function (sb, node) {
        sb.appendLine();
        sb.appendLine();
        this._emitModifiers(sb, node);
        this._emitTypeParameters(sb, node);
        this._emitParameters(sb, node);
        this._emitReturns(sb, node);
        this._emitMemberOf(sb, node.parent);
        this._emitDescriptionDeclaration(sb);
    };
    Documenter.prototype._emitMemberOf = function (sb, parent) {
        var enabledForClasses = parent.kind === ts.SyntaxKind.ClassDeclaration && vs.workspace.getConfiguration().get("docthis.includeMemberOfOnClassMembers", true);
        var enabledForInterfaces = parent.kind === ts.SyntaxKind.InterfaceDeclaration && vs.workspace.getConfiguration().get("docthis.includeMemberOfOnInterfaceMembers", true);
        if (parent && (enabledForClasses || enabledForInterfaces)) {
            sb.appendLine();
            sb.appendLine("@memberOf " + parent["name"].text);
        }
    };
    Documenter.prototype._emitReturns = function (sb, node) {
        if (utils.findNonVoidReturnInCurrentScope(node) || (node.type && node.type.getText() !== "void")) {
            sb.append("@returns");
            if (includeTypes() && node.type) {
                sb.append(" " + utils.formatTypeName(node.type.getText()));
            }
            sb.appendLine();
        }
    };
    Documenter.prototype._emitParameters = function (sb, node) {
        var _this = this;
        if (!node.parameters) {
            return;
        }
        node.parameters.forEach(function (parameter) {
            var name = parameter.name.getText();
            var isOptional = parameter.questionToken || parameter.initializer;
            var isArgs = !!parameter.dotDotDotToken;
            var initializerValue = parameter.initializer ? parameter.initializer.getText() : null;
            var typeName = "{any}";
            if (includeTypes()) {
                if (parameter.initializer && !parameter.type) {
                    if (/^[0-9]/.test(initializerValue)) {
                        typeName = "{number}";
                    }
                    else if (initializerValue.indexOf("\"") !== -1 ||
                        initializerValue.indexOf("'") !== -1 ||
                        initializerValue.indexOf("`") !== -1) {
                        typeName = "{string}";
                    }
                    else if (initializerValue.indexOf("true") !== -1 ||
                        initializerValue.indexOf("false") !== -1) {
                        typeName = "{boolean}";
                    }
                }
                else if (parameter.type) {
                    typeName = utils.formatTypeName((isArgs ? "..." : "") + parameter.type.getFullText().trim());
                }
                else if (enableHungarianNotationEvaluation() && _this._isHungarianNotation(name)) {
                    typeName = _this._getHungarianNotationType(name);
                }
            }
            sb.append("@param ");
            if (includeTypes()) {
                sb.append(typeName + " ");
            }
            if (isOptional) {
                sb.append("[");
            }
            sb.append(name);
            if (parameter.initializer && typeName) {
                sb.append("=" + parameter.initializer.getText());
            }
            if (isOptional) {
                sb.append("]");
            }
            sb.appendLine();
        });
    };
    Documenter.prototype._isHungarianNotation = function (name) {
        return /^[abefimos][A-Z]/.test(name);
    };
    Documenter.prototype._getHungarianNotationType = function (name) {
        switch (name.charAt(0)) {
            case "a": return "{Array}";
            case "b": return "{boolean}";
            case "e": return "{Object}"; // Enumeration
            case "f": return "{function}";
            case "i": return "{number}";
            case "m": return "{Object}"; // Map
            case "o": return "{Object}";
            case "s": return "{string}";
            default: return "{any}";
        }
    };
    Documenter.prototype._emitConstructorDeclaration = function (sb, node) {
        sb.appendLine("Creates an instance of " + node.parent.name.getText() + ".");
        sb.appendLine();
        this._emitParameters(sb, node);
        this._emitMemberOf(sb, node.parent);
    };
    Documenter.prototype._emitTypeParameters = function (sb, node) {
        if (!node.typeParameters) {
            return;
        }
        node.typeParameters.forEach(function (parameter) {
            sb.appendLine("@template " + parameter.name.getText());
        });
    };
    Documenter.prototype._emitHeritageClauses = function (sb, node) {
        if (!node.heritageClauses || !includeTypes()) {
            return;
        }
        node.heritageClauses.forEach(function (clause) {
            var heritageType = clause.token === ts.SyntaxKind.ExtendsKeyword ? "@extends" : "@implements";
            clause.types.forEach(function (t) {
                var tn = t.expression.getText();
                if (t.typeArguments) {
                    tn += "<";
                    tn += t.typeArguments.map(function (a) { return a.getText(); }).join(", ");
                    tn += ">";
                }
                sb.append(heritageType + " " + utils.formatTypeName(tn));
                sb.appendLine();
            });
        });
    };
    Documenter.prototype._emitModifiers = function (sb, node) {
        if (!node.modifiers) {
            return;
        }
        node.modifiers.forEach(function (modifier) {
            switch (modifier.kind) {
                case ts.SyntaxKind.ExportKeyword:
                    sb.appendLine("@export");
                    return;
                case ts.SyntaxKind.AbstractKeyword:
                    sb.appendLine("@abstract");
                    return;
                case ts.SyntaxKind.ProtectedKeyword:
                    sb.appendLine("@protected");
                    return;
                case ts.SyntaxKind.PrivateKeyword:
                    sb.appendLine("@private");
                    return;
                case ts.SyntaxKind.StaticKeyword:
                    sb.appendLine("@static");
                    return;
            }
        });
    };
    Documenter.prototype.dispose = function () {
        if (this._outputChannel) {
            this._outputChannel.dispose();
        }
        this._services.dispose();
    };
    return Documenter;
}());
exports.Documenter = Documenter;
//# sourceMappingURL=documenter.js.map