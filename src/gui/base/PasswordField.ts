import m, { Children, Component, Vnode } from "mithril"
import { ToggleButton } from "./buttons/ToggleButton.js"
import { Icons } from "./icons/Icons.js"
import { ButtonSize } from "./ButtonSize.js"
import { Autocomplete, TextField, TextFieldAttrs, TextFieldType } from "./TextField.js"
import { CompletenessIndicator } from "../CompletenessIndicator.js"
import { isSecurePassword, scaleToVisualPasswordStrength } from "../../misc/passwords/PasswordUtils.js"
import { Status, StatusField } from "./StatusField.js"
import type { lazy } from "@tutao/tutanota-utils"

type StatusSetting = Status | "auto"

export interface PasswordFieldAttrs extends Omit<TextFieldAttrs, "type"> {
	passwordStrength?: number
	status?: StatusSetting
	isPasswordRevealed?: boolean
	onRevealToggled?: (value: boolean) => unknown
}

type handledPasswordFieldAttrs = PasswordFieldAttrs & {
	isPasswordRevealed: boolean
	onRevealToggled: (value: boolean) => unknown
}

export class PasswordField implements Component<PasswordFieldAttrs> {
	private isPasswordRevealed: boolean = false

	view(vnode: Vnode<PasswordFieldAttrs>) {
		// If the user has not provided a value for `isPasswordRevealed`, then handle the state internally
		const attrs = this.provideDefaults(vnode.attrs)
		const { isPasswordRevealed, onRevealToggled, ...textFieldAttrs } = attrs
		return m(TextField, {
			...textFieldAttrs,
			autocompleteAs: attrs.autocompleteAs ? attrs.autocompleteAs : Autocomplete.currentPassword,
			type: isPasswordRevealed ? TextFieldType.Text : TextFieldType.Password,
			helpLabel: () => PasswordField.renderHelpLabel(textFieldAttrs.value, attrs.passwordStrength, attrs.status, textFieldAttrs.helpLabel ?? null),
			injectionsRight: () => {
				return [
					PasswordField.renderRevealIcon(isPasswordRevealed, onRevealToggled),
					textFieldAttrs.injectionsRight ? textFieldAttrs.injectionsRight() : null,
				]
			},
		})
	}

	// Replaces `isPasswordRevealed` and `onRevealToggled` with internal handlers if they are `undefined`
	private provideDefaults(attrs: PasswordFieldAttrs): handledPasswordFieldAttrs {
		const defaultToggle = (newValue: boolean) => {
			this.isPasswordRevealed = newValue
		}
		return {
			...attrs,
			isPasswordRevealed: attrs.isPasswordRevealed ?? this.isPasswordRevealed,
			onRevealToggled: attrs.onRevealToggled ?? defaultToggle,
		}
	}

	private static renderRevealIcon(isPasswordRevealed: boolean, onRevealToggled?: (value: boolean) => unknown): Children {
		return m(ToggleButton, {
			title: isPasswordRevealed ? "concealPassword_action" : "revealPassword_action",
			toggled: isPasswordRevealed,
			onToggled: (value, e) => {
				if (onRevealToggled) onRevealToggled(value)
				e.stopPropagation()
			},
			icon: isPasswordRevealed ? Icons.NoEye : Icons.Eye,
			size: ButtonSize.Compact,
		})
	}

	private static renderHelpLabel(value: string, strength: number | undefined, status: StatusSetting | undefined, helpLabel: lazy<Children> | null): Children {
		const displayedStatus = PasswordField.parseStatusSetting(status, value, strength)
		return m(".mt-xs", [
			m(".flex.items-center", [
				strength != undefined
					? m(CompletenessIndicator, {
							class: "mr-s",
							percentageCompleted: scaleToVisualPasswordStrength(strength),
					  })
					: null,
				displayedStatus ? m(StatusField, { status: displayedStatus }) : null,
			]),
			helpLabel ? helpLabel() : null,
		])
	}

	private static parseStatusSetting(status: StatusSetting | undefined, password: string, strength: number | undefined): Status | null {
		if (status === "auto" && strength != undefined) {
			return PasswordField.getPasswordStatus(password, strength!)
		} else if (status && typeof status !== "string") {
			return status
		} else {
			return null
		}
	}

	private static getPasswordStatus(password: string, strength: number): Status {
		if (password === "") {
			return {
				type: "neutral",
				text: "password1Neutral_msg",
			}
		} else if (isSecurePassword(strength)) {
			return {
				type: "valid",
				text: "passwordValid_msg",
			}
		} else {
			return {
				type: "invalid",
				text: "password1InvalidUnsecure_msg",
			}
		}
	}
}
