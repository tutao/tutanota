import {lang} from "../../misc/LanguageViewModel"
import m, {Component, Vnode} from "mithril"
import stream from "mithril/stream"
import {Dialog} from "../base/Dialog"
import {Keys} from "../../api/common/TutanotaConstants"
import {TextFieldN} from "../base/TextFieldN"
import type {Shortcut} from "../../misc/KeyManager"
import {ButtonType} from "../base/ButtonN"
import {DialogHeaderBarAttrs} from "../base/DialogHeaderBar";

function makeShortcutName(shortcut: Shortcut): string {
	return (
		(shortcut.meta ? Keys.META.name + " + " : "") +
		(shortcut.ctrl ? Keys.CTRL.name + " + " : "") +
		(shortcut.shift ? Keys.SHIFT.name + " + " : "") +
		(shortcut.alt ? Keys.ALT.name + " + " : "") +
		shortcut.key.name
	)
}

/**
 * return a promise that resolves when the dialog is closed
 */
export function showShortcutDialog(shortcuts: Array<Shortcut>): Promise<void> {
	return new Promise(resolve => {
		let dialog: Dialog

		const close = () => {
			dialog.close()
			resolve()
		}

		const headerAttrs = {
			left: [
				{
					label: "close_alt",
					click: close,
					type: ButtonType.Secondary,
				},
			],
			middle: () => lang.get("keyboardShortcuts_title"),
		} as DialogHeaderBarAttrs
		dialog = Dialog.largeDialogN(headerAttrs, ShortcutDialog, {
			shortcuts,
		})
					   .addShortcut({
						   key: Keys.ESC,
						   exec: close,
						   help: "close_alt",
					   })
					   .show()
	})
}

type ShortcutDialogAttrs = {
	shortcuts: Array<Shortcut>
}

/**
 * The Dialog that shows the currently active Keyboard shortcuts when you press F1
 *
 *
 */

class ShortcutDialog implements Component<ShortcutDialogAttrs> {
	view(vnode: Vnode<ShortcutDialogAttrs>) {
		const {shortcuts} = vnode.attrs
		const textFieldAttrs = shortcuts
			.filter(shortcut => shortcut.enabled == null || shortcut.enabled())
			.map(shortcut => ({
				label: () => makeShortcutName(shortcut),
				value: lang.get(shortcut.help),
				disabled: true,
			}))
		return m(
			"div.pb",
			textFieldAttrs.map(t => m(TextFieldN, t)),
		)
	}
}