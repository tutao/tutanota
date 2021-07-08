// @flow

import {lang} from "../../misc/LanguageViewModel"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Dialog} from "../base/Dialog"
import {Keys} from "../../api/common/TutanotaConstants"
import {TextFieldN} from "../base/TextFieldN"
import type {Shortcut} from "../../misc/KeyManager"
import {ButtonType} from "../base/ButtonN"

let isOpen = false

function makeShortcutName(shortcut: Shortcut): string {
	return ((shortcut.meta) ? Keys.META.name + " + " : "")
		+ ((shortcut.ctrl) ? Keys.CTRL.name + " + " : "")
		+ ((shortcut.shift) ? Keys.SHIFT.name + " + " : "")
		+ ((shortcut.alt) ? Keys.ALT.name + " + " : "")
		+ shortcut.key.name
}

export function showShortcutDialog(attrs: ShortcutDialogAttrs) {
	if (isOpen) return
	let dialog

	const close = () => {
		isOpen = false
		dialog.close()
	}

	const headerAttrs = {
		left: [{label: 'close_alt', click: close, type: ButtonType.Secondary}],
		middle: () => lang.get("keyboardShortcuts_title")
	}

	isOpen = true
	dialog = Dialog.largeDialogN(headerAttrs, ShortcutDialog, attrs)
	               .addShortcut({key: Keys.ESC, exec: close, help: "close_alt"})
	               .show()
}

export type ShortcutDialogAttrs = {
	shortcuts: Stream<Array<Shortcut>>
}

/**
 * The Dialog that shows the currently active Keyboard shortcuts when you press F1
 *
 *
 */
class ShortcutDialog implements MComponent<ShortcutDialogAttrs> {
	view(vnode: Vnode<ShortcutDialogAttrs>) {
		vnode.attrs.shortcuts.map(m.redraw)
		const shortcuts = vnode.attrs.shortcuts()

		const textFieldAttrs = shortcuts
			.filter(shortcut => shortcut.enabled == null || shortcut.enabled())
			.map(shortcut => ({
					label: () => makeShortcutName(shortcut),
					value: stream(lang.get(shortcut.help)),
					disabled: true
				})
			)

		return m("div.pb", textFieldAttrs.map(t => m(TextFieldN, t)))
	}
}