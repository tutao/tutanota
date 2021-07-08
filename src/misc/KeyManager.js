//@flow
import stream from "mithril/stream/stream.js"
import {assertMainOrNodeBoot} from "../api/common/Env"
import {remove} from "../api/common/utils/ArrayUtils"
import {client} from "./ClientDetector"
import type {TranslationKey} from "./LanguageViewModel"
import {BrowserType} from "./ClientConstants"
import {mod} from "./MathUtils"
import type {KeysEnum} from "../api/common/TutanotaConstants"
import {Keys} from "../api/common/TutanotaConstants"
import type {ShortcutDialogAttrs} from "../gui/dialogs/ShortcutDialog"

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

type ShortcutOperation
	= "register"
	| "unregister"
	| "registerModal"
	| "unregisterModal"
	| "registerDesktop"

type ShortcutBatch = {
	operation: ShortcutOperation,
	shortcuts: Array<Shortcut>
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
	_modalShortcuts: Array<Shortcut>;
	_keyToModalShortcut: Map<string, Shortcut>;
	_desktopShortcuts: Shortcut[];
	_dialogAttrs: ShortcutDialogAttrs = {
		shortcuts: stream([]),
	};
	_showModalShortcuts: boolean = false;

	constructor() {
		let helpShortcut = {
			key: Keys.F1,
			exec: () => this.openF1Help(),
			help: "showHelp_action"
		}
		let helpId = this._createKeyIdentifier(helpShortcut.key.code)
		this._modalShortcuts = [helpShortcut]
		this._keyToShortcut = new Map([[helpId, helpShortcut]])
		// override for _shortcuts: If a modal is visible, only modal-shortcuts should be active
		this._keyToModalShortcut = new Map([[helpId, helpShortcut]])
		this._desktopShortcuts = []

		if (!window.document.addEventListener) return
		window.document.addEventListener("keydown", e => this._handleKeydown(e), false);
	}

	_handleKeydown(e: KeyboardEvent): void {
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
	}

	_createKeyIdentifier(keycode: number, ctrl: ?boolean, alt: ?boolean, shift: ?boolean, meta: ?boolean): string {
		return keycode + (ctrl ? "C" : "") + (alt ? "A" : "") + (shift ? "S" : "") + (meta ? "M" : "")
	}

	openF1Help() {
		// first, decide if we're showing the modal shortcuts or the standard shortcuts
		// the help dialog will register its own shortcuts which would override the
		// standard shortcuts if we did this lazily
		this._showModalShortcuts = this._modalShortcuts.length > 1

		import("../gui/dialogs/ShortcutDialog.js").then(({showShortcutDialog}) => showShortcutDialog(this._dialogAttrs))
	}

	registerShortcuts(shortcuts: Array<Shortcut>) {
		Keys.META.code = (client.browser === BrowserType.FIREFOX ? 224 : 91)
		this._handleBatch({operation: "register", shortcuts})
	}

	unregisterShortcuts(shortcuts: Array<Shortcut>) {
		this._handleBatch({operation: "unregister", shortcuts})
	}

	registerDesktopShortcuts(shortcuts: Array<Shortcut>) {
		this._handleBatch({operation: "registerDesktop", shortcuts})
	}

	registerModalShortcuts(shortcuts: Array<Shortcut>) {
		this._handleBatch({operation: "registerModal", shortcuts})
	}

	unregisterModalShortcuts(shortcuts: Array<Shortcut>) {
		this._handleBatch({operation: "unregisterModal", shortcuts})
	}

	/**
	 * some shortcuts depend on async information. this can lead to out-of-order
	 * execution of the batches if they're not buffered.
	 */
	_handleBatch(batch: ShortcutBatch) {
		for (let s of batch.shortcuts) {
			let id = this._createKeyIdentifier(s.key.code, s.ctrl, s.alt, s.shift, s.meta)

			switch (batch.operation) {
				case 'register':
					this._keyToShortcut.set(id, s)
					break
				case 'unregister':
					this._keyToShortcut.delete(id)
					break
				case 'registerModal':
					this._modalShortcuts.push(s)
					this._keyToModalShortcut.set(id, s)
					break
				case 'unregisterModal':
					remove(this._modalShortcuts, s)
					this._keyToModalShortcut.delete(id)
					break
				case "registerDesktop":
					this._desktopShortcuts.push(s)
					break
				default:
					console.error("invalid shortcut batch", batch)
			}
		}
		// conditionally update the dialog attrs since the shortcuts we show
		// in the help and the shortcuts that are actually active are almost
		// never the same
		this._dialogAttrs.shortcuts(this._showModalShortcuts
			? this._modalShortcuts
			: [...this._keyToShortcut.values(), ...this._desktopShortcuts]
		)
	}
}

export function isKeyPressed(keyCode: number, ...keys: Array<KeysEnum>): boolean {
	return keys.some((key) => key.code === keyCode)
}

export const keyManager: KeyManager = new KeyManager()

