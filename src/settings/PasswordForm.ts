import m, {Children, Component, Vnode} from "mithril"
import {TextField, TextFieldType} from "../gui/base/TextField.js"
import {CompletenessIndicator} from "../gui/CompletenessIndicator.js"
import {getPasswordStrength, isSecurePassword} from "../misc/passwords/PasswordUtils"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {Status} from "../gui/base/StatusField"
import {StatusField} from "../gui/base/StatusField"
import {LoginController} from "../api/main/LoginController"
import {assertMainOrNode} from "../api/common/Env"
import {getEnabledMailAddressesForGroupInfo} from "../api/common/utils/GroupUtils.js"
import {showPasswordGeneratorDialog} from "../misc/passwords/PasswordGeneratorDialog"
import {theme} from "../gui/theme"
import {Icons} from "../gui/base/icons/Icons"
import {ButtonAttrs, ButtonN} from "../gui/base/ButtonN.js"

assertMainOrNode()

export interface PasswordFormAttrs {
	model: PasswordModel
	passwordInfoKey?: TranslationKey
}

export interface PasswordModelConfig {
	readonly checkOldPassword: boolean,
	readonly enforceStrength: boolean,
	readonly repeatInput: boolean,
}

export class PasswordModel {
	private newPassword = ""
	private oldPassword = ""
	private repeatedPassword = ""
	private passwordStrength: number
	private revealPassword: boolean = false

	constructor(
		private readonly logins: LoginController,
		readonly config: PasswordModelConfig,
	) {
		this.passwordStrength = this.calculatePasswordStrength()
	}

	getNewPassword(): string {
		return this.newPassword
	}

	setNewPassword(newPassword: string) {
		this.newPassword = newPassword
		this.passwordStrength = this.calculatePasswordStrength()
	}

	getOldPassword(): string {
		return this.oldPassword
	}

	setOldPassword(oldPassword: string) {
		this.oldPassword = oldPassword
		this.passwordStrength = this.calculatePasswordStrength()
	}

	getRepeatedPassword(): string {
		return this.repeatedPassword
	}

	setRepeatedPassword(repeatedPassword: string) {
		this.repeatedPassword = repeatedPassword
		this.passwordStrength = this.calculatePasswordStrength()
	}

	clear() {
		this.newPassword = ""
		this.oldPassword = ""
		this.repeatedPassword = ""
		this.passwordStrength = this.calculatePasswordStrength()
	}

	getErrorMessageId(): TranslationKey | null {
		return (
			this.getErrorFromStatus(this.getOldPasswordStatus())
			?? this.getErrorFromStatus(this.getNewPasswordStatus())
			?? this.getErrorFromStatus(this.getRepeatedPasswordStatus())
		)
	}

	getOldPasswordStatus(): Status {
		if (this.config.checkOldPassword && this.oldPassword === "") {
			return {
				type: "neutral",
				text: "oldPasswordNeutral_msg",
			}
		} else {
			return {
				type: "valid",
				text: "emptyString_msg",
			}
		}
	}

	getNewPasswordStatus(): Status {
		if (this.newPassword === "") {
			return {
				type: "neutral",
				text: "password1Neutral_msg",
			}
		} else if (this.config.checkOldPassword && this.oldPassword === this.newPassword) {
			return {
				type: "invalid",
				text: "password1InvalidSame_msg",
			}
		} else if (this.isPasswordInsecure()) {
			if (this.config.enforceStrength) {
				return {
					type: "invalid",
					text: "password1InvalidUnsecure_msg",
				}
			} else {
				return {
					type: "valid",
					text: "password1InvalidUnsecure_msg",
				}
			}
		} else {
			return {
				type: "valid",
				text: "passwordValid_msg",
			}
		}
	}

	getRepeatedPasswordStatus(): Status {
		const repeatedPassword = this.repeatedPassword
		const newPassword = this.newPassword

		if (this.config.repeatInput && repeatedPassword === "") {
			return {
				type: "neutral",
				text: "password2Neutral_msg",
			}
		} else if (this.config.repeatInput && repeatedPassword !== newPassword) {
			return {
				type: "invalid",
				text: "password2Invalid_msg",
			}
		} else {
			return {
				type: "valid",
				text: "passwordValid_msg",
			}
		}
	}

	isPasswordInsecure(): boolean {
		return !isSecurePassword(this.getPasswordStrength())
	}

	getPasswordStrength(): number {
		return this.passwordStrength
	}

	private getErrorFromStatus(status: Status): TranslationKey | null {
		if (!status) return null
		return status.type !== "valid" ? status.text : null
	}

	private calculatePasswordStrength(): number {
		let reserved: string[] = []

		if (this.logins.isUserLoggedIn()) {
			reserved = getEnabledMailAddressesForGroupInfo(this.logins.getUserController().userGroupInfo)
				.concat(this.logins.getUserController().userGroupInfo.name)
		}

		// 80% strength is minimum. we expand it to 100%, so the password indicator if completely filled when the password is strong enough
		return getPasswordStrength(this.newPassword, reserved)
	}

	toggleRevealPassword(): void {
		this.revealPassword = !this.revealPassword
	}

	getRevealPassword(): boolean {
		return this.revealPassword
	}
}

/**
 * A form for entering a new password. Optionally it allows to enter the old password for validation and/or to repeat the new password.
 * showChangeOwnPasswordDialog() and showChangeUserPasswordAsAdminDialog() show this form as dialog.
 */
export class PasswordForm implements Component<PasswordFormAttrs> {

	view({attrs}: Vnode<PasswordFormAttrs>): Children {
		return m("", {
				onremove: () => attrs.model.clear(),
			},
			[
				attrs.model.config.checkOldPassword ?
					m(TextField, {
						label: "oldPassword_label",
						value: attrs.model.getOldPassword(),
						helpLabel: () => m(StatusField, {status: attrs.model.getOldPasswordStatus()}),
						oninput: (input) => attrs.model.setOldPassword(input),
						preventAutofill: true,
						type: TextFieldType.Password,
					})
					: null,
				m(TextField, {
					label: "newPassword_label",
					value: attrs.model.getNewPassword(),
					helpLabel: () => m("", [
						m(StatusField, {status: attrs.model.getNewPasswordStatus()}),
						this.renderPasswordGeneratorHelp(attrs)
					]),
					oninput: (input) => attrs.model.setNewPassword(input),
					type: attrs.model.getRevealPassword() ? TextFieldType.Text : TextFieldType.Password,
					preventAutofill: true,
					injectionsRight: () => m(".flex.items-center", [
						m(".mlr-s", m(CompletenessIndicator, {percentageCompleted: attrs.model.getPasswordStrength()})),
						this.renderRevealIcon(attrs),
					]),
				}),
				attrs.passwordInfoKey ? m(".small.mt-s", lang.get(attrs.passwordInfoKey)) : null,
				attrs.model.config.repeatInput
					? m(TextField, {
						label: "repeatedPassword_label",
						value: attrs.model.getRepeatedPassword(),
						helpLabel: () =>
							m(StatusField, {
								status: attrs.model.getRepeatedPasswordStatus(),
							}),
						oninput: (input) => attrs.model.setRepeatedPassword(input),
						type: TextFieldType.Password,
					})
					: null,
			],
		)

	}

	private renderPasswordGeneratorHelp(attrs: PasswordFormAttrs): Children {
		return m("", [
			m(".mr-xs", {style: {display: "inline-block"}}, "Having trouble creating a password?"),
			m(".b.mr-xs.hover.click.darkest-hover", {
				style: {display: "inline-block", color: theme.navigation_button_selected},
				onclick: async () => {
					attrs.model.setNewPassword(await showPasswordGeneratorDialog())
					m.redraw()
				}
			}, "Generate"), // FIXME: translate
			m("", {style: {display: "inline-block"}}, "a passphrase!")
		])
	}

	private renderRevealIcon(attrs: PasswordFormAttrs): Children {
		const buttonAttrs: ButtonAttrs = {
			// FIXME
			label: "emptyString_msg",
			click: () => {
				attrs.model.toggleRevealPassword()
			},
			icon: () => attrs.model.getRevealPassword() ? Icons.NoEye : Icons.Eye,
		}
		return m(ButtonN, buttonAttrs)
	}
}