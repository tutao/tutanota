//@flow
import {client} from "./ClientDetector"
import type {TranslationKey} from "./LanguageViewModel"
import {BrowserType} from "./ClientConstants"
import {mod} from "./MathUtils"
import type {KeysEnum} from "../api/common/TutanotaConstants"
import {Keys} from "../api/common/TutanotaConstants"
import type {lazy} from "@tutao/tutanota-utils"
import {assertMainOrNodeBoot} from "../api/common/Env"

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

function createKeyIdentifier(keycode: number, ctrl: ?boolean, alt: ?boolean, shift: ?boolean, meta: ?boolean): string {
	return keycode + (ctrl ? "C" : "") + (alt ? "A" : "") + (shift ? "S" : "") + (meta ? "M" : "")
}

/**
 * KeyManager offers the API for (un)registration of all keyboard shortcuts and routes
 * key presses to the correct handler.
 *
 * Shortcuts that are registered by a modal always take precedence.
 */
class KeyManager {
	_keyToShortcut: Map<string, Shortcut>;
	// override for _shortcuts: If a modal is visible, only modal-shortcuts should be active
	_keyToModalShortcut: Map<string, Shortcut>;
	_desktopShortcuts: Shortcut[];
	_isHelpOpen: boolean = false;

	constructor() {
		const helpShortcut = {
			key: Keys.F1,
			exec: () => this.openF1Help(),
			help: "showHelp_action"
		}
		const helpId = createKeyIdentifier(helpShortcut.key.code)
		this._keyToShortcut = new Map([[helpId, helpShortcut]])
		// override for _shortcuts: If a modal is visible, only modal-shortcuts should be active
		this._keyToModalShortcut = new Map([[helpId, helpShortcut]])
		this._desktopShortcuts = []

		if (!window.document.addEventListener) return
		window.document.addEventListener("keydown", e => this._handleKeydown(e), false);
	}

	_handleKeydown(e: KeyboardEvent): void {
		let keyCode = e.which
		let keysToShortcuts = (this._keyToModalShortcut.size > 1)
			? this._keyToModalShortcut
			: this._keyToShortcut
		let shortcut = keysToShortcuts.get(createKeyIdentifier(keyCode, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey))
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
	}

	/**
	 * open a dialog listing all currently active shortcuts
	 * @param forceBaseShortcuts set to true for the special case where the dialog is opened
	 * from the support dropdown (which registers its own shortcuts as modal shortcuts)
	 */
	openF1Help(forceBaseShortcuts: boolean = false): void {
		if (this._isHelpOpen) return
		this._isHelpOpen = true

		// we decide which shortcuts to show right now.
		//
		// the help dialog will register its own shortcuts which would override the
		// standard shortcuts if we did this later
		//
		// we can't do this in the register/unregister method because the modal
		// unregisters the old dialog shortcuts and then registers the new ones
		// when the top dialog changes, leading to a situation where
		// modalshortcuts is empty.
		const shortcutsToShow = this._keyToModalShortcut.size > 1 && !forceBaseShortcuts
			? Array.from(this._keyToModalShortcut.values()) // copy values, they will change
			: [...this._keyToShortcut.values(), ...this._desktopShortcuts]
		import("../gui/dialogs/ShortcutDialog.js")
			.then(({showShortcutDialog}) => showShortcutDialog(shortcutsToShow))
			.then(() => this._isHelpOpen = false)
	}

	registerShortcuts(shortcuts: Array<Shortcut>) {
		Keys.META.code = (client.browser === BrowserType.FIREFOX ? 224 : 91)
		this._applyOperation(shortcuts, (id, s) => this._keyToShortcut.set(id, s))
	}

	unregisterShortcuts(shortcuts: Array<Shortcut>) {
		this._applyOperation(shortcuts, (id, s) => this._keyToShortcut.delete(id))
	}

	registerDesktopShortcuts(shortcuts: Array<Shortcut>) {
		this._applyOperation(shortcuts, (id, s) => this._desktopShortcuts.push(s))
	}

	registerModalShortcuts(shortcuts: Array<Shortcut>) {
		this._applyOperation(shortcuts, (id, s) => {
			this._keyToModalShortcut.set(id, s)
		})
	}

	unregisterModalShortcuts(shortcuts: Array<Shortcut>) {
		this._applyOperation(shortcuts, (id, s) => {
			this._keyToModalShortcut.delete(id)
		})
	}

	/**
	 *
	 * @param shortcuts list of shortcuts to operate on
	 * @param operation operation to execute for every shortcut and its ID
	 * @private
	 */
	_applyOperation(shortcuts: Array<Shortcut>, operation: (id: string, s: Shortcut) => mixed) {
		shortcuts.forEach(s => operation(createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta), s))
	}
}

export function isKeyPressed(keyCode: number, ...keys: Array<KeysEnum>): boolean {
	return keys.some((key) => key.code === keyCode)
}

export const keyManager: KeyManager = new KeyManager()

