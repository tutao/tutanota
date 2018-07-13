//@flow
import m from "mithril"
import {assertMainOrNodeBoot} from "../api/Env"
import {Button, ButtonType} from "../gui/base/Button"
import {neverNull, asyncImport} from "../api/common/utils/Utils"
import {addAll, removeAll} from "../api/common/utils/ArrayUtils"
import {TextField} from "../gui/base/TextField"
import {client, BrowserType} from "./ClientDetector"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {lang} from "./LanguageViewModel"

assertMainOrNodeBoot()

export const Keys = {
	NONE: {code: -1, name: ""},
	RETURN: {code: 13, name: "⏎"},
	TAB: {code: 9, name: "↹"},
	SHIFT: {code: 16, name: "⇧"},
	CTRL: {code: 17, name: "CTRL"},
	META: {code: 91, name: '\u2318'}, // command key (left) (OSX)
	ESC: {code: 27, name: "ESC"},
	UP: {code: 38, name: "↑"},
	DOWN: {code: 40, name: "↓"},
	PAGE_UP: {code: 33, name: "Page ↑"},
	PAGE_DOWN: {code: 34, name: "Page ↓"},
	HOME: {code: 36, name: "Home"},
	END: {code: 35, name: "End"},
	DELETE: {code: 46, name: "DEL"},
	ONE: {code: 49, name: "1"},
	TWO: {code: 50, name: "2"},
	THREE: {code: 51, name: "3"},
	FOUR: {code: 52, name: "4"},
	FIVE: {code: 53, name: "5"},
	SIX: {code: 54, name: "6"},
	C: {code: 67, name: "C"},
	E: {code: 69, name: "E"},
	F: {code: 70, name: "F"},
	H: {code: 72, name: "H"},
	L: {code: 76, name: "L"},
	M: {code: 77, name: "M"},
	N: {code: 78, name: "N"},
	R: {code: 82, name: "R"},
	S: {code: 83, name: "S"},
	F1: {code: 112, name: "F1"},
}

class KeyManager {
	_shortcuts: Shortcut[];
	_keyToShortcut: {[id:string]:Shortcut};
	_modalShortcuts: Shortcut[]; // override for _shortcuts: If a modal is visible, only modal-shortcuts should be active
	_keyToModalShortcut: {[id:string]:Shortcut};
	_helpDialog: ?any;

	constructor() {
		let helpShortcut = {
			key: Keys.F1,
			exec: () => {
				asyncImport(typeof module != "undefined" ? module.id : __moduleName, `${env.rootPathPrefix}src/gui/base/Dialog.js`).then(module => {
					if (this._helpDialog && this._helpDialog.visible) {
						return
					}
					let shortcuts = ((this._modalShortcuts.length > 1) ? this._modalShortcuts : this._shortcuts).slice() // we do not want to show a dialog with the shortcuts of the help dialog
					let textFields = shortcuts.filter(shortcut => shortcut.enabled == null || shortcut.enabled())
						.map(shortcut => {
							return new TextField(() => this._getShortcutName(shortcut))
								.setValue(lang.get(shortcut.help))
								.setDisabled()
						})
					this._helpDialog = module.Dialog.largeDialog(new DialogHeaderBar()
						.addRight(new Button('close_alt', () => neverNull(this._helpDialog).close()).setType(ButtonType.Secondary))
						.setMiddle(() => lang.get("keyboardShortcuts_title")), {
						view: () => {
							return m("div.pb", textFields.map(t => m(t)))
						}
					}).addShortcut({
						key: Keys.ESC,
						exec: () => neverNull(this._helpDialog).close(),
						help: "close_alt"
					})
					this._helpDialog.show()
				})
			},
			help: "showHelp_action"
		}
		let helpId = this._createKeyIdentifier(helpShortcut.key.code)
		this._shortcuts = [helpShortcut]
		this._modalShortcuts = [helpShortcut]
		this._keyToShortcut = {}
		this._keyToModalShortcut = {}
		this._keyToShortcut[helpId] = helpShortcut
		this._keyToModalShortcut[helpId] = helpShortcut // override for _shortcuts: If a modal is visible, only modal-shortcuts should be active

		if (!window.document.addEventListener) {
			return
		}

		window.document.addEventListener("keydown", e => {
			let keyCode = e.which
			let keysToShortcuts = (this._modalShortcuts.length > 1) ? this._keyToModalShortcut : this._keyToShortcut
			let shortcut = keysToShortcuts[this._createKeyIdentifier(keyCode, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey)]
			if (shortcut != null && (shortcut.enabled == null || shortcut.enabled())) {
				if (shortcut.exec({
						keyCode,
						ctrl: e.ctrlKey,
						alt: e.altKey,
						shift: e.shiftKey,
						meta: e.metaKey
					}) !== true) {
					e.preventDefault()
				}
			}
		}, false);

	}

	_getShortcutName(shortcut: Shortcut): string {
		return ((shortcut.meta) ? Keys.META.name + " + " : "") + ((shortcut.ctrl) ? Keys.CTRL.name + " + " : "") + ((shortcut.shift) ? Keys.SHIFT.name + " + " : "") + shortcut.key.name
	}

	_createKeyIdentifier(keycode: number, ctrl: ?boolean, alt: ?boolean, shift: ?boolean, meta: ?boolean): string {
		return keycode + (ctrl ? "C" : "") + (alt ? "A" : "") + (shift ? "S" : "") + (meta ? "M" : "")
	}

	registerShortcuts(shortcuts: Shortcut[]) {
		Keys.META.code = (client.browser == BrowserType.FIREFOX ? 224 : 91)
		addAll(this._shortcuts, shortcuts)
		for (let s of shortcuts) {
			let id = this._createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta)
			this._keyToShortcut[id] = s
		}
	}

	unregisterShortcuts(shortcuts: Shortcut[]) {
		removeAll(this._shortcuts, shortcuts)
		for (let s of shortcuts) {
			let id = this._createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta)
			delete this._keyToShortcut[id]
		}
	}

	registerModalShortcuts(shortcuts: Shortcut[]) {
		addAll(this._modalShortcuts, shortcuts)
		for (let s of shortcuts) {
			let id = this._createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta)
			this._keyToModalShortcut[id] = s
		}
	}

	unregisterModalShortcuts(shortcuts: Shortcut[]) {
		removeAll(this._modalShortcuts, shortcuts)
		for (let s of shortcuts) {
			let id = this._createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta)
			delete this._keyToModalShortcut[id]
		}
	}

}

export const keyManager: KeyManager = new KeyManager()

