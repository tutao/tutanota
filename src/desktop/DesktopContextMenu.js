// @flow

import type {ContextMenuParams, Menu, WebContents} from "electron"
import {lang} from "../misc/LanguageViewModel"
import type {IPC} from "./IPC"
import type {ResolvedObjectUrl} from "../native/main/NativeWrapperCommands"
import type {DesktopDownloadManager} from "./DesktopDownloadManager"
import {WindowManager} from "./DesktopWindowManager"

type Electron = $Exports<"electron">

export class DesktopContextMenu {
	_ipc: IPC;
	_electron: Electron;
	_wm: WindowManager
	_dl: DesktopDownloadManager

	constructor(electron: Electron, ipc: IPC, wm: WindowManager, dl: DesktopDownloadManager) {
		this._electron = electron
		this._ipc = ipc
		this._wm = wm
		this._dl = dl
	}

	open(params: ContextMenuParams) {
		const {linkURL, editFlags, misspelledWord, dictionarySuggestions} = params
		const menu = new this._electron.Menu()
		const pasteItem = new this._electron.MenuItem({
			label: lang.get("paste_action"),
			accelerator: "CmdOrCtrl+V",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.paste(),
			enabled: editFlags.canPaste
		})
		const copyItem = new this._electron.MenuItem({
			label: lang.get("copy_action"),
			accelerator: "CmdOrCtrl+C",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.copy(),
			enabled: editFlags.canCopy
		})
		const cutItem = new this._electron.MenuItem({
			label: lang.get("cut_action"),
			accelerator: "CmdOrCtrl+X",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.cut(),
			enabled: editFlags.canCut
		})
		const copyLinkItem = new this._electron.MenuItem({
			label: lang.get("copyLink_action"),
			click: () => !!linkURL && this._electron.clipboard.writeText(linkURL),
			enabled: !!linkURL
		})
		const undoItem = new this._electron.MenuItem({
			label: lang.get("undo_action"),
			accelerator: "CmdOrCtrl+Z",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.undo(),
			enabled: editFlags.canUndo
		})
		const redoItem = new this._electron.MenuItem({
			label: lang.get("redo_action"),
			accelerator: "CmdOrCtrl+Shift+Z",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.redo(),
			enabled: editFlags.canRedo
		})
		const spellingItem = new this._electron.MenuItem({
			label: lang.get("spelling_label"),
			submenu: this._spellingSubmenu(misspelledWord, dictionarySuggestions)
		})
		const downloadImage = new this._electron.MenuItem({
			label: lang.get("save_action"),
			click: (mi, bw) => {
				const window = this._wm.get(bw.id)
				window && this._wm.ipc.sendRequest(window.id, 'resolveUrl', [params.srcURL])
				              .then((resolved: ResolvedObjectUrl) => {
					              this._dl.saveBlob(resolved.name || "file", resolved.data, window)
				              })
			},
			visible: params.hasImageContents && params.mediaType === "image"
		})

		menu.append(copyItem)
		menu.append(cutItem)
		menu.append(copyLinkItem)
		menu.append(pasteItem)
		menu.append(downloadImage)
		menu.append(new this._electron.MenuItem({type: 'separator'}))
		menu.append(undoItem)
		menu.append(redoItem)
		menu.append(new this._electron.MenuItem({type: 'separator'}))
		// it would be possible to open the menu with a spellcheck dummy
		// like "searching dictionary..." and then append suggestions
		// and then re-popup the context menu, but alas, the suggestions
		// are already searched before the context-menu handler is even
		// invoked, leading to a delay between right-click and menu popup.
		menu.append(spellingItem)
		menu.popup()
	}

	_spellingSubmenu(misspelledWord: string, dictionarySuggestions: Array<string>): Menu {
		const submenu = new this._electron.Menu()
		if (misspelledWord !== '') {
			dictionarySuggestions
				.map(s => new this._electron.MenuItem({
					label: s,
					click: (mi, bw) => bw && bw.webContents && bw.webContents.replaceMisspelling(s)
				})).forEach(mi => submenu.append(mi))
			submenu.append(new this._electron.MenuItem({type: "separator"}))
			submenu.append(new this._electron.MenuItem({
				label: lang.get("addToDict_action", {"{word}": misspelledWord}),
				click: (mi, bw) => bw && bw.webContents && bw.webContents.session.addWordToSpellCheckerDictionary(misspelledWord)
			}))
		}
		// the spellcheck API uses the OS spell checker on MacOs, the language is set in the OS settings.
		if (process.platform !== 'darwin') {
			submenu.append(new this._electron.MenuItem({
				label: lang.get("changeSpellCheckLang_action"),
				click: (mi, bw) => bw && bw.webContents && this._changeSpellcheckLanguage(bw.webContents)
			}))
		}
		return submenu
	}

	_changeSpellcheckLanguage(wc: WebContents) {
		const id = this._electron.BrowserWindow.fromWebContents(wc).id
		const args = [
			wc.session.getSpellCheckerLanguages()[0], // currently active
			wc.session.availableSpellCheckerLanguages
		]
		this._ipc.sendRequest(id, 'showSpellcheckDropdown', args)
		    .then(newLang => wc.session.setSpellCheckerLanguages([newLang]))
	}
}