'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// this method is called when the extension is activated
export function activate(context: vscode.ExtensionContext) {

    // console.log('Commentimg is activated');

    // create a decorator type
    const decor = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        overviewRulerColor: 'blue',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            // this color will be used in light color themes
            borderColor: 'darkblue'
        },
        dark: {
            // this color will be used in dark color themes
            borderColor: 'lightblue'
        }
    });

    // ====> Handle the active editor
    let activeEditor = vscode.window.activeTextEditor;
    if(activeEditor) {
        triggerUpdateDecorations();
    }
    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if(editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    vscode.workspace.onDidChangeTextDocument(event => {
        if(activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
    // <====

    var timeout = null;
    function triggerUpdateDecorations() {
        if(timeout) { clearTimeout(timeout); }
        timeout = setTimeout(updateDecorations, 500);
    }

    function updateDecorations() {
        if(!activeEditor) { return; }
        const regEx = /<cmg "(([a-zA-Z0-9-_\.\\\/]+)\.(png|jpg|svg))">/g;
        const text = activeEditor.document.getText();
        let cimgs: vscode.DecorationOptions[] = [];
        let match: RegExpExecArray;
        while(match = regEx.exec(text)) {
            const img: string = match[1];
            const resource = activeEditor.document.uri;
            const commentimgConfig = vscode.workspace.getConfiguration('commentimg', resource);
            const workspace_path_override = <string>commentimgConfig.get("workspace_path_override");
            const home_dir_override = <string>commentimgConfig.get("home_dir_override");
            const workspace_path_override_rel_to_home = <boolean>commentimgConfig.get("workspace_path_override_rel_to_home");
            const workspace_path_override_dev_container = <boolean>commentimgConfig.get("workspace_path_override_dev_container");
            let rootpath_extern: string | undefined;
            rootpath_extern = vscode.workspace.rootPath;
            if (workspace_path_override || workspace_path_override_rel_to_home) {
                if (workspace_path_override_rel_to_home) {
                    var homedir: string | undefined;
                    homedir = require('os').homedir();
                    if (home_dir_override && workspace_path_override_dev_container) {
                        homedir = home_dir_override;
                    }
                    rootpath_extern = homedir;
                } else {
                    rootpath_extern = ""
                }
                rootpath_extern = path.join(rootpath_extern,workspace_path_override);
            }
            var rootpath_intern: string | undefined;
            rootpath_intern = vscode.workspace.rootPath;
            if (!workspace_path_override_dev_container){
                rootpath_intern = rootpath_extern;
            }
            const src_intern = path.join(path.normalize(vscode.workspace.rootPath), img);
            const src_extern = path.join(path.normalize(rootpath_extern), img);

            if(fs.existsSync(src_intern)) {
                let s = activeEditor.document.positionAt(match.index);
                let e = activeEditor.document.positionAt(match.index + match[0].length);

                let decoration = { range: new vscode.Range(s, e), hoverMessage: `![](file:///${src_extern})` };
                cimgs.push(decoration);
            }
        }
        activeEditor.setDecorations(decor, cimgs);
    }
}

// this method is called when the extension is deactivated
export function deactivate() {
}
