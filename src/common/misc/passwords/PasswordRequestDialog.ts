/**
 * Requests a password from the user. Stays open until the caller sets the error message to "".
 * @param props.action will be executed as an attempt to apply new password. Error message is the return value.
 */
import { PasswordField, PasswordFieldAttrs } from "./PasswordField.js"
import { TranslationKey, MaybeTranslation } from "../LanguageViewModel.js"
import { Dialog, INPUT } from "../../gui/base/Dialog.js"
import m from "mithril"
import { Autocomplete } from "../../gui/base/TextField.js"
import { isKeyPressed, KeyPress } from "../KeyManager.js"
import { Keys } from "../../api/common/TutanotaConstants.js"
import { Icon } from "../../gui/base/Icon.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"

export function showRequestPasswordDialog(props: {
	title?: MaybeTranslation
	messageText?: string
	action: (pw: string) => Promise<string>
	cancel: {
		textId: TranslationKey
		action: () => void
	} | null
}): Dialog {
	const title = props.title ? props.title : "password_label"
	let value = ""
	let state: { type: "progress" } | { type: "idle"; message: string } = { type: "idle", message: "" }

	const doAction = async () => {
		state = { type: "progress" }
		m.redraw()
		const errorMessage = await props.action(value)
		state = { type: "idle", message: errorMessage }
		m.redraw()
	}

	const child = {
		view: () => {
			const savedState = state
			return savedState.type === "idle"
				? m("", [
						props.messageText ? m(".pt-16", props.messageText) : null,
						m(PasswordField, {
							label: title,
							helpLabel: () => savedState.message,
							value: value,
							oninput: (newValue) => (value = newValue),
							autocompleteAs: Autocomplete.off,
							onReturnKeyPressed: () => doAction(),
						} satisfies PasswordFieldAttrs),
					])
				: m(Icon, {
						icon: BootIcons.Progress,
						class: "icon-32 icon-progress block mt-16 mb-16",
						style: {
							marginLeft: "auto",
							marginRight: "auto",
						},
					})
		},
	}
	const dialog = Dialog.showActionDialog({
		title,
		child: child,
		allowOkWithReturn: true,
		okAction: () => doAction(),
		cancelActionTextId: props.cancel?.textId,
		allowCancel: props.cancel != null,
		cancelAction: () => {
			props?.cancel?.action?.()
			dialog.close()
		},
	})

	// the password form contains some dummy inputs that would be focused by
	// the default focusOnLoad
	dialog.setFocusOnLoadFunction((dom: HTMLElement) => {
		const inputs = Array.from(dom.querySelectorAll(INPUT)) as Array<HTMLElement>
		inputs[inputs.length - 1].focus()
	})
	return dialog
}
