//@flow
import m from "mithril"
import {assertMainOrNodeBoot} from "../api/common/Env"
import {neverNull, typedValues} from "../api/common/utils/Utils"
import {addAll, findAllAndRemove, removeAll} from "../api/common/utils/ArrayUtils"
import {client} from "./ClientDetector"
import type {TranslationKey} from "./LanguageViewModel"
import {lang} from "./LanguageViewModel"
import {BrowserType} from "./ClientConstants"
import {mod} from "./MathUtils"
import type {KeysEnum} from "../api/common/TutanotaConstants"
import {Keys} from "../api/common/TutanotaConstants"
import stream from "mithril/stream/stream.js"

assertMainOrNodeBoot()


export const TABBABLE = "button, input, textarea, div[contenteditable='true']"

export type KeyPress = {keyCode: number, key: string, ctrl: boolean, shift: boolean};
export type Key = {code: number, name: string};

/**
 * @return false, if the default action should be aborted
 */
export type keyHandler = (key: KeyPress) => boolean;

export interface Shortcut {
	key: Key;
	ctrl?: boolean; // undefined == false
	alt?: boolean; // undefined == false
	shift?: boolean; // undefined == false
	meta?: boolean; // undefined == false
	enabled?: lazy<boolean>;

	exec(key: KeyPress, e?: Event): ?boolean; // must return true, if preventDefault should not be invoked
	help: TranslationKey;
}

export function focusPrevious(dom: HTMLElement): boolean {
	let tabbable = Array.from(dom.querySelectorAll(TABBABLE)).filter(e => e.style.display !== 'none' && e.tabIndex !== -1) // also filter for tabIndex here to restrict tabbing to invisible inputs
	let selected = tabbable.find(e => document.activeElement === e)
	if (selected) {
		//work around for squire so tabulator actions are executed properly
		//squire makes a list which can be indented and manages this with tab and shift tab
		const selection = window.getSelection()
		if (selection && selection.focusNode
			&& (selection.focusNode.nodeName === "LI"
				|| (selection.focusNode.parentNode && selection.focusNode.parentNode.nodeName === "LI"))) {
			return true
			//dont change selection if selection is in list
		} else {
			tabbable[mod(tabbable.indexOf(selected) - 1, tabbable.length)].focus()
			return false
		}
	} else if (tabbable.length > 0) {
		tabbable[tabbable.length - 1].focus()
		return false
	}
	return true
}

export function focusNext(dom: HTMLElement): boolean {
	let tabbable = Array.from(dom.querySelectorAll(TABBABLE)).filter(e => e.style.display !== 'none' && e.tabIndex !== -1) // also filter for tabIndex here to restrict tabbing to invisible inputs
	let selected = tabbable.find(e => document.activeElement === e)
	if (selected) {
		//work around for squire so tabulator actions are executed properly
		//squire makes a list which can be indented and manages this with tab and shift tab
		const selection = window.getSelection()
		if (selection && selection.focusNode
			&& (selection.focusNode.nodeName === "LI"
				|| (selection.focusNode.parentNode && selection.focusNode.parentNode.nodeName === "LI"))) {
			return true
			//dont change selection
		} else {
			tabbable[mod(tabbable.indexOf(selected) + 1, tabbable.length)].focus()
			return false
		}
	} else if (tabbable.length > 0) {
		tabbable[0].focus()
		return false
	}
	return true
}

class KeyManager {
		_keyToShortcut: Map<string, Shortcut>;
	_modalShortcuts: Shortcut[]; // override for _shortcuts: If a modal is visible, only modal-shortcuts should be active
	_keyToModalShortcut: Map<string, Shortcut>;
	_desktopShortcuts: Shortcut[]
	_helpDialog: ?any;

	constructor() {
		let helpShortcut = {
			key: Keys.F1,
			exec: () => this.openF1Help(),
			help: "showHelp_action"
		}
		let helpId = this._createKeyIdentifier(helpShortcut.key.code)
		this._modalShortcuts = [helpShortcut]
		this._keyToShortcut = new Map([[helpId, helpShortcut]])
		this._keyToModalShortcut = new Map([[helpId, helpShortcut]]) // override for _shortcuts: If a modal is visible, only modal-shortcuts should be active
		this._desktopShortcuts = []

		if (!window.document.addEventListener) {
			return
		}

		window.document.addEventListener("keydown", e => {
			let keyCode = e.which
			let keysToShortcuts = (this._modalShortcuts.length > 1)
				? this._keyToModalShortcut
				: this._keyToShortcut
			let shortcut = keysToShortcuts.get(this._createKeyIdentifier(keyCode, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey))
			if (shortcut != null && (shortcut.enabled == null || shortcut.enabled())) {
				if (shortcut.exec({
					keyCode,
					key: e.key,
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
		return ((shortcut.meta) ? Keys.META.name + " + " : "")
			+ ((shortcut.ctrl) ? Keys.CTRL.name + " + " : "")
			+ ((shortcut.shift) ? Keys.SHIFT.name + " + " : "")
			+ ((shortcut.alt) ? Keys.ALT.name + " + " : "")
			+ shortcut.key.name
	}

	_createKeyIdentifier(keycode: number, ctrl: ?boolean, alt: ?boolean, shift: ?boolean, meta: ?boolean): string {
		return keycode + (ctrl ? "C" : "") + (alt ? "A" : "") + (shift ? "S" : "") + (meta ? "M" : "")
	}

	openF1Help() {
		Promise.all([import("../gui/base/Dialog.js"), import("../gui/base/ButtonN"), import("../gui/base/TextFieldN")])
		       .then(([{Dialog}, {ButtonType}, {TextFieldN}]) => {
			       if (this._helpDialog && this._helpDialog.visible) {
				       return
			       }
			       let shortcuts = ((this._modalShortcuts.length > 1)
				       ? this._modalShortcuts
				       : Array.from(this._keyToShortcut.values()).concat(this._desktopShortcuts)) // we do not want to show a dialog with the shortcuts of the help dialog
			       let textFieldAttrs = shortcuts.filter(shortcut => shortcut.enabled == null || shortcut.enabled())
			                                     .map(shortcut => {
				                                     return {
					                                     label: () => this._getShortcutName(shortcut),
					                                     value: stream(lang.get(shortcut.help)),
					                                     disabled: true
				                                     }
			                                     })
			       this._helpDialog = Dialog.largeDialog({
				       left: [{label: 'close_alt', click: () => neverNull(this._helpDialog).close(), type: ButtonType.Secondary}],
				       middle: () => lang.get("keyboardShortcuts_title")
			       }, {
				       view: () => {
					       return m("div.pb", textFieldAttrs.map(t => m(TextFieldN, t)))
				       }
			       }).addShortcut({
				       key: Keys.ESC,
				       exec: () => neverNull(this._helpDialog).close(),
				       help: "close_alt"
			       }).show()
		       })
	}

	registerShortcuts(shortcuts: Shortcut[]) {
		Keys.META.code = (client.browser === BrowserType.FIREFOX ? 224 : 91)
		for (let s of shortcuts) {
			let id = this._createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta)
			this._keyToShortcut.set(id, s)
		}
	}

	unregisterShortcuts(shortcuts: Shortcut[]) {
		for (let s of shortcuts) {
			let id = this._createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta)
			this._keyToShortcut.delete(id)
		}
	}

	registerModalShortcuts(shortcuts: Shortcut[]) {
		addAll(this._modalShortcuts, shortcuts)
		for (let s of shortcuts) {
			let id = this._createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta)
			this._keyToModalShortcut.set(id, s)
		}
	}

	registerDesktopShortcuts(shortcuts: Shortcut[]) {
		addAll(this._desktopShortcuts, shortcuts)
	}

	unregisterModalShortcuts(shortcuts: Shortcut[]) {
		removeAll(this._modalShortcuts, shortcuts)
		for (let s of shortcuts) {
			let id = this._createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta)
			this._keyToModalShortcut.delete(id)
		}
	}

}

export function isKeyPressed(keyCode: number, ...keys: Array<KeysEnum>): boolean {
	return keys.some((key) => key.code === keyCode)
}

export const keyManager: KeyManager = new KeyManager()

