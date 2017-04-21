'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vsc = require('vscode');
const RangeUtil_1 = require('./utils/RangeUtil');
const XmlFormatter_1 = require('./services/XmlFormatter');
const XPath_1 = require('./providers/XPath');
const Execution_1 = require('./providers/Execution');
const Content_1 = require('./providers/Content');
const CFG_SECTION = 'xmlTools';
const CFG_REMOVE_COMMENTS = 'removeCommentsOnMinify';
class TextEditorCommands {
    static minifyXml(editor, edit) {
        let removeComments = vsc.workspace.getConfiguration(CFG_SECTION).get(CFG_REMOVE_COMMENTS, false);
        let range = RangeUtil_1.RangeUtil.getRangeForDocument(editor.document);
        let formatter = new XmlFormatter_1.XmlFormatter();
        let xml = formatter.minify(editor.document.getText());
        edit.replace(range, xml);
    }
    static evaluateXPath(editor, edit) {
        XPath_1.XPathFeatureProvider.evaluateXPathAsync(editor, edit);
    }
    static executeXQuery(editor, edit) {
        Execution_1.XQueryExecutionProvider.executeXQueryAsync(editor);
    }
    static viewXmlTree(editor, edit) {
        return __awaiter(this, void 0, Promise, function* () {
            try {
                yield vsc.commands.executeCommand('vscode.previewHtml', Content_1.XmlTreeDocumentContentProvider.buildUri(editor.document.uri), vsc.ViewColumn.Three);
            }
            catch (error) {
                vsc.window.showErrorMessage(`The XML Tree could not be created: ${error}`);
            }
        });
    }
}
exports.TextEditorCommands = TextEditorCommands;
