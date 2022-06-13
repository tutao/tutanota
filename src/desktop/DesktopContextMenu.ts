import type {ContextMenuParams, Menu, WebContents} from "electron"
import {lang} from "../misc/LanguageViewModel"
import {DesktopFacadeSendDispatcher} from "../native/common/generatedipc/DesktopFacadeSendDispatcher.js"
import {NativeInterfaceFactory} from "./DesktopWindowManager.js"

type Electron = typeof Electron.CrossProcessExports

export class DesktopContextMenu {

	constructor(
		private readonly electron: Electron,
		private readonly nativeInterfaceFactory: NativeInterfaceFactory,
	) {
	}

	open(params: ContextMenuParams) {
		const {linkURL, editFlags, misspelledWord, dictionarySuggestions} = params
		const menu = new this.electron.Menu()
		const pasteItem = new this.electron.MenuItem({
			label: lang.get("paste_action"),
			accelerator: "CmdOrCtrl+V",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.paste(),
			enabled: editFlags.canPaste,
		})
		const copyItem = new this.electron.MenuItem({
			label: lang.get("copy_action"),
			accelerator: "CmdOrCtrl+C",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.copy(),
			enabled: editFlags.canCopy,
		})
		const cutItem = new this.electron.MenuItem({
			label: lang.get("cut_action"),
			accelerator: "CmdOrCtrl+X",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.cut(),
			enabled: editFlags.canCut,
		})
		const copyLinkItem = new this.electron.MenuItem({
			label: lang.get("copyLink_action"),
			click: () => !!linkURL && this.electron.clipboard.writeText(linkURL),
			enabled: !!linkURL,
		})
		const undoItem = new this.electron.MenuItem({
			label: lang.get("undo_action"),
			accelerator: "CmdOrCtrl+Z",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.undo(),
			enabled: editFlags.canUndo,
		})
		const redoItem = new this.electron.MenuItem({
			label: lang.get("redo_action"),
			accelerator: "CmdOrCtrl+Shift+Z",
			click: (mi, bw) => bw && bw.webContents && bw.webContents.redo(),
			enabled: editFlags.canRedo,
		})
		const spellingItem = new this.electron.MenuItem({
			label: lang.get("spelling_label"),
			submenu: this._spellingSubmenu(misspelledWord, dictionarySuggestions),
		})
		menu.append(copyItem)
		menu.append(cutItem)
		menu.append(copyLinkItem)
		menu.append(pasteItem)
		menu.append(
			new this.electron.MenuItem({
				type: "separator",
			}),
		)
		menu.append(undoItem)
		menu.append(redoItem)
		menu.append(
			new this.electron.MenuItem({
				type: "separator",
			}),
		)
		// it would be possible to open the menu with a spellcheck dummy
		// like "searching dictionary..." and then append suggestions
		// and then re-popup the context menu, but alas, the suggestions
		// are already searched before the context-menu handler is even
		// invoked, leading to a delay between right-click and menu popup.
		menu.append(spellingItem)
		menu.popup()
	}

	_spellingSubmenu(misspelledWord: string, dictionarySuggestions: Array<string>): Menu {
		const submenu = new this.electron.Menu()

		if (misspelledWord !== "") {
			dictionarySuggestions
				.map(
					s =>
						new this.electron.MenuItem({
							label: s,
							click: (mi, bw) => bw && bw.webContents && bw.webContents.replaceMisspelling(s),
						}),
				)
				.forEach(mi => submenu.append(mi))
			submenu.append(
				new this.electron.MenuItem({
					type: "separator",
				}),
			)
			submenu.append(
				new this.electron.MenuItem({
					label: lang.get("addToDict_action", {
						"{word}": misspelledWord,
					}),
					click: (mi, bw) => bw && bw.webContents && bw.webContents.session.addWordToSpellCheckerDictionary(misspelledWord),
				}),
			)
		}

		// the spellcheck API uses the OS spell checker on MacOs, the language is set in the OS settings.
		if (process.platform !== "darwin") {
			submenu.append(
				new this.electron.MenuItem({
					label: lang.get("changeSpellCheckLang_action"),
					click: (mi, bw) => bw && bw.webContents && this._changeSpellcheckLanguage(bw.webContents),
				}),
			)
		}

		return submenu
	}

	async _changeSpellcheckLanguage(wc: WebContents) {
		const window = this.electron.BrowserWindow.fromWebContents(wc)

		if (window) {
			await new DesktopFacadeSendDispatcher(this.nativeInterfaceFactory(window.id)).showSpellcheckDropdown()
		}
	}
}