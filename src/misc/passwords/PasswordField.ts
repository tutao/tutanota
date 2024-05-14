import m, { Children, Component, Vnode } from "mithril"
import { ToggleButton } from "../../gui/base/buttons/ToggleButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { Autocomplete, TextField, TextFieldAttrs, TextFieldType } from "../../gui/base/TextField.js"
import { CompletenessIndicator } from "../../gui/CompletenessIndicator.js"
import { isSecurePassword, scaleToVisualPasswordStrength } from "./PasswordUtils.js"
import { Status, StatusField } from "../../gui/base/StatusField.js"
import type { lazy } from "@tutao/tutanota-utils"
import type { TranslationKey } from "../LanguageViewModel.js"

type StatusSetting = Status | "auto"

export interface PasswordFieldAttrs extends Omit<TextFieldAttrs, "label" | "type"> {
	label?: TranslationKey | lazy<string>
	passwordStrength?: number
	status?: StatusSetting
}

export class PasswordField implements Component<PasswordFieldAttrs> {
	private isPasswordRevealed: boolean = false

	view(vnode: Vnode<PasswordFieldAttrs>) {
		const attrs = vnode.attrs
		// Separate and pass the generic `TextFieldAttrs` attributes so the user can still use all of `TextFields` properties
		const { passwordStrength, status, label, ...textFieldAttrs } = attrs
		return m(TextField, {
			...textFieldAttrs,
			label: label === undefined ? "password_label" : label,
			autocompleteAs: attrs.autocompleteAs ? attrs.autocompleteAs : Autocomplete.currentPassword,
			type: this.isPasswordRevealed ? TextFieldType.Text : TextFieldType.Password,
			helpLabel: () => PasswordField.renderHelpLabel(textFieldAttrs.value, passwordStrength, status, textFieldAttrs.helpLabel ?? null),
			injectionsRight: () => {
				return [
					PasswordField.renderRevealIcon(this.isPasswordRevealed, (newValue) => (this.isPasswordRevealed = newValue)),
					textFieldAttrs.injectionsRight ? textFieldAttrs.injectionsRight() : null,
				]
			},
		})
	}

	private static renderRevealIcon(isPasswordRevealed: boolean, onRevealToggled: (value: boolean) => unknown): Children {
		return m(ToggleButton, {
			title: isPasswordRevealed ? "concealPassword_action" : "revealPassword_action",
			toggled: isPasswordRevealed,
			onToggled: (value, e) => {
				onRevealToggled(value)
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
