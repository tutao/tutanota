// @flow

import type {ContextMenuParams} from "electron"
import {clipboard, Menu, MenuItem} from 'electron'
import {lang} from "../misc/LanguageViewModel"

export class DesktopContextMenu {
	_menu: Menu;
	_pasteItem: MenuItem;
	_copyItem: MenuItem;
	_cutItem: MenuItem;
	_copyLinkItem: MenuItem;
	_undoItem: MenuItem;
	_redoItem: MenuItem;
	_link: string;

	constructor() {
		this._menu = new Menu()
		this._link = ""
		this._pasteItem = new MenuItem({
			label: lang.get("paste_action"),
			accelerator: "CmdOrCtrl+V",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.paste()
		})
		this._copyItem = new MenuItem({
			label: lang.get("copy_action"),
			accelerator: "CmdOrCtrl+C",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.copy()
		})
		this._cutItem = new MenuItem({
			label: lang.get("cut_action"),
			accelerator: "CmdOrCtrl+X",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.cut()
		})
		this._copyLinkItem = new MenuItem({
			label: lang.get("copyLink_action"),
			click: () => !!this._link && clipboard.writeText(this._link)
		})
		this._undoItem = new MenuItem({
			label: lang.get("undo_action"),
			accelerator: "CmdOrCtrl+Z",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.undo()
		})
		this._redoItem = new MenuItem({
			label: lang.get("redo_action"),
			accelerator: "CmdOrCtrl+Shift+Z",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.redo()
		})

		this._menu.append(this._copyItem)
		this._menu.append(this._cutItem)
		this._menu.append(this._copyLinkItem)
		this._menu.append(this._pasteItem)
		this._menu.append(new MenuItem({type: 'separator'}))
		this._menu.append(this._undoItem)
		this._menu.append(this._redoItem)
	}

	open(params: ContextMenuParams) {
		this._link = params.linkURL
		this._copyLinkItem.enabled = !!params.linkURL
		this._cutItem.enabled = params.editFlags.canCut
		this._pasteItem.enabled = params.editFlags.canPaste
		this._copyItem.enabled = params.editFlags.canCopy
		this._undoItem.enabled = params.editFlags.canUndo
		this._redoItem.enabled = params.editFlags.canRedo
		this._menu.popup()
	}
}