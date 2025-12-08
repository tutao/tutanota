import m, { Children, Component, Vnode } from "mithril"
import { ToggleButton } from "../../gui/base/buttons/ToggleButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"
import { Autocomplete, TextFieldType } from "../../gui/base/TextField.js"
import { Status, StatusField } from "../../gui/base/StatusField.js"
import type { lazy } from "@tutao/tutanota-utils"
import { LoginTextField, LoginTextFieldAttrs } from "../../gui/base/LoginTextField"
import { MaybeTranslation } from "../../misc/LanguageViewModel"
import { isMediumInsecurePassword, isSecurePassword, passwordStrengthToColor } from "../../misc/passwords/PasswordUtils"
import { theme } from "../../gui/theme"

type StatusSetting = Status | "auto"

export interface PasswordFieldAttrs extends Omit<LoginTextFieldAttrs, "label" | "type"> {
	label?: MaybeTranslation
	passwordStrength?: number
	status?: StatusSetting
}

export class PasswordFieldNew implements Component<PasswordFieldAttrs> {
	private isPasswordRevealed: boolean = false

	view(vnode: Vnode<PasswordFieldAttrs>) {
		const attrs = vnode.attrs
		// Separate and pass the generic `TextFieldAttrs` attributes so the user can still use all of `TextFields` properties
		const { passwordStrength, status, label, ...textFieldAttrs } = attrs
		return m(LoginTextField, {
			...textFieldAttrs,
			leadingIcon: {
				icon: Icons.Lock,
				color: theme.on_surface_variant,
			},
			label: label === undefined ? "password_label" : label,
			autocompleteAs: attrs.autocompleteAs ? attrs.autocompleteAs : Autocomplete.currentPassword,
			type: this.isPasswordRevealed ? TextFieldType.Text : TextFieldType.Password,
			helpLabel: textFieldAttrs.helpLabel
				? () => PasswordFieldNew.renderHelpLabel(textFieldAttrs.value, passwordStrength, status, textFieldAttrs.helpLabel)
				: null,
			injectionsRight: () => {
				return [
					PasswordFieldNew.renderRevealIcon(this.isPasswordRevealed, (newValue) => (this.isPasswordRevealed = newValue)),
					textFieldAttrs.injectionsRight ? textFieldAttrs.injectionsRight() : null,
				]
			},
			borderColor: passwordStrengthToColor(passwordStrength),
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

	private static renderHelpLabel(
		value: string,
		strength: number | undefined,
		status: StatusSetting | undefined,
		helpLabel: lazy<Children> | null | undefined,
	): Children {
		const displayedStatus = PasswordFieldNew.parseStatusSetting(status, value, strength)
		return m(".mt-8", [
			// m(".flex.items-center", [
			// 	strength != null
			// 		? m(PasswordStrengthIndicator, {
			// 				percentageCompleted: scaleToVisualPasswordStrength(strength),
			// 			})
			// 		: null,
			// ]),
			m(
				".flex.items-center.justify-between.mt-8",
				{
					style: {
						color: passwordStrengthToColor(strength),
					},
				},
				[displayedStatus ? m(StatusField, { status: displayedStatus }) : null, helpLabel ? helpLabel() : null],
			),
		])
	}

	private static parseStatusSetting(status: StatusSetting | undefined, password: string, strength: number | undefined): Status | null {
		if (status === "auto" && strength != null) {
			return PasswordFieldNew.getPasswordStatus(password, strength!)
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
		} else if (isMediumInsecurePassword(strength)) {
			return {
				type: "invalid",
				text: "password1InvalidUnsecure_msg",
			}
		} else {
			return {
				type: "invalid",
				text: "password1InvalidMediumUnsecure_msg",
			}
		}
	}
}
