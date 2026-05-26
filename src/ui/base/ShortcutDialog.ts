import { lang, Translation } from "../utils/LanguageViewModel"
import m, { Component, Vnode } from "mithril"
import { Dialog } from "./Dialog"
import { isAppleDevice, Keys } from "../../platform-kits/app-env"
import { LegacyTextField } from "./LegacyTextField.js"
import type { Shortcut } from "../utils/KeyManager"

function makeShortcutName(shortcut: Shortcut): Translation {
	const mainModifier = isAppleDevice() ? Keys.META.name : Keys.CTRL.name

	return lang.makeTranslation(
		shortcut.help,
		(shortcut.meta ? Keys.META.name + " + " : "") +
			(shortcut.ctrlOrCmd ? mainModifier + " + " : "") +
			(shortcut.ctrl ? Keys.CTRL.name + " + " : "") +
			(shortcut.shift ? Keys.SHIFT.name + " + " : "") +
			(shortcut.alt ? Keys.ALT.name + " + " : "") +
			shortcut.key.name,
	)
}

/**
 * return a promise that resolves when the dialog is closed
 */
export function showShortcutDialog(shortcuts: Array<Shortcut>): Promise<void> {
	return Dialog.viewerDialog("keyboardShortcuts_title", ShortcutDialog, {
		shortcuts,
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
		const { shortcuts } = vnode.attrs
		const textFieldAttrs = shortcuts
			.filter((shortcut) => shortcut.enabled == null || shortcut.enabled())
			.map((shortcut) => ({
				label: makeShortcutName(shortcut),
				value: lang.get(shortcut.help),
				isReadOnly: true,
			}))
		return m(
			"div.pb-16",
			textFieldAttrs.map((t) => m(LegacyTextField, t)),
		)
	}
}
