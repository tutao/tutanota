import m, { Children, Component, Vnode } from "mithril"
import { Autocomplete, BorderTextField, BorderTextFieldType } from "../gui/base/BorderTextField.js"
import { CompletenessIndicator } from "../gui/CompletenessIndicator.js"
import { getPasswordStrength, isSecurePassword, scaleToVisualPasswordStrength } from "../misc/passwords/PasswordUtils"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import type { Status } from "../gui/base/StatusField"
import { StatusField } from "../gui/base/StatusField"
import { LoginController } from "../api/main/LoginController"
import { assertMainOrNode } from "../api/common/Env"
import { getEnabledMailAddressesForGroupInfo } from "../api/common/utils/GroupUtils.js"
import { showPasswordGeneratorDialog } from "../misc/passwords/PasswordGeneratorDialog"
import { theme } from "../gui/theme"
import { Icons } from "../gui/base/icons/Icons"
import { px, size } from "../gui/size.js"
import { UsageTest, UsageTestController } from "@tutao/tutanota-usagetests"
import Stream from "mithril/stream"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { ToggleButton } from "../gui/base/buttons/ToggleButton.js"
import { IconButton } from "../gui/base/IconButton.js"
import { ButtonColor } from "../gui/base/Button.js"

assertMainOrNode()

export interface PasswordFormAttrs {
	model: PasswordModel
	labelBgColorOverwrite?: string
	// overwrites the bg color of label, only in use to fix login in dark mode
}

export interface PasswordModelConfig {
	readonly checkOldPassword: boolean
	readonly enforceStrength: boolean
	/** if set to true the second password field won't be rendered. If not set at all or false the second password field is rendered */
	readonly hideConfirmation?: boolean
	readonly reservedStrings?: () => string[]
}

const enum PasswordFieldType {
	Old,
	New,
	Confirm,
}

export class PasswordModel {
	private newPassword = ""
	private oldPassword = ""
	private repeatedPassword = ""
	private passwordStrength: number
	private revealOldPassword: boolean = false
	private revealNewPassword: boolean = false
	private revealConfirmPassword: boolean = false
	private readonly __mailValid?: Stream<boolean>
	private __signupFreeTest?: UsageTest
	private __signupPaidTest?: UsageTest

	constructor(
		private readonly usageTestController: UsageTestController,
		private readonly logins: LoginController,
		readonly config: PasswordModelConfig,
		mailValid?: Stream<boolean>,
	) {
		this.passwordStrength = this.calculatePasswordStrength()

		this.__mailValid = mailValid
		this.__signupFreeTest = this.usageTestController.getTest("signup.free")
		this.__signupPaidTest = this.usageTestController.getTest("signup.paid")
	}

	_checkBothValidAndSendPing() {
		if (this.getNewPasswordStatus().type === "valid" && this.getRepeatedPasswordStatus().type === "valid") {
			// Password entry (both passwords entered and valid)
			// Only the started test's (either free or paid clicked) stage is completed here
			this.__signupFreeTest?.getStage(3).complete()
			this.__signupPaidTest?.getStage(2).complete()
		}
	}

	getNewPassword(): string {
		return this.newPassword
	}

	setNewPassword(newPassword: string) {
		if (this.__mailValid && this.__mailValid()) {
			// Email address selection finished (email address is available and clicked in password field)
			// Only the started test's (either free or paid clicked) stage is completed here
			this.__signupFreeTest?.getStage(2).complete()
			this.__signupPaidTest?.getStage(1).complete()
		}

		this.newPassword = newPassword
		this.recalculatePasswordStrength()
	}

	/**
	 * Might be needed when reserved strings change in the config
	 */
	recalculatePasswordStrength() {
		this.passwordStrength = this.calculatePasswordStrength()
		this._checkBothValidAndSendPing()
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

		this._checkBothValidAndSendPing()
	}

	clear() {
		this.newPassword = ""
		this.oldPassword = ""
		this.repeatedPassword = ""
		this.passwordStrength = this.calculatePasswordStrength()
	}

	getErrorMessageId(): TranslationKey | null {
		return (
			this.getErrorFromStatus(this.getOldPasswordStatus()) ??
			this.getErrorFromStatus(this.getNewPasswordStatus()) ??
			this.getErrorFromStatus(this.getRepeatedPasswordStatus())
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
		if (this.config.hideConfirmation) {
			return {
				type: "valid",
				text: "passwordValid_msg",
			}
		}
		const repeatedPassword = this.repeatedPassword
		const newPassword = this.newPassword

		if (repeatedPassword === "") {
			return {
				type: "neutral",
				text: "password2Neutral_msg",
			}
		} else if (repeatedPassword !== newPassword) {
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
		let reserved: string[] = this.config.reservedStrings ? this.config.reservedStrings() : []

		if (this.logins.isUserLoggedIn()) {
			reserved = reserved
				.concat(getEnabledMailAddressesForGroupInfo(this.logins.getUserController().userGroupInfo))
				.concat(this.logins.getUserController().userGroupInfo.name)
		}

		// 80% strength is minimum. we expand it to 100%, so the password indicator if completely filled when the password is strong enough
		return getPasswordStrength(this.newPassword, reserved)
	}

	toggleRevealPassword(type: PasswordFieldType): void {
		switch (type) {
			case PasswordFieldType.Old:
				this.revealOldPassword = !this.revealOldPassword
				break
			case PasswordFieldType.New:
				this.revealNewPassword = !this.revealNewPassword
				break
			case PasswordFieldType.Confirm:
				this.revealConfirmPassword = !this.revealConfirmPassword
				break
		}
	}

	isPasswordRevealed(type: PasswordFieldType): boolean {
		switch (type) {
			case PasswordFieldType.Old:
				return this.revealOldPassword
			case PasswordFieldType.New:
				return this.revealNewPassword
			case PasswordFieldType.Confirm:
				return this.revealConfirmPassword
		}
	}
}

/**
 * A form for entering a new password. Optionally it allows to enter the old password for validation and/or to repeat the new password.
 * showChangeOwnPasswordDialog() and showChangeUserPasswordAsAdminDialog() show this form as dialog.
 */
export class PasswordForm implements Component<PasswordFormAttrs> {
	view({ attrs }: Vnode<PasswordFormAttrs>): Children {
		return m(
			"",
			{
				onremove: () => attrs.model.clear(),
			},
			[
				attrs.model.config.checkOldPassword
					? m(BorderTextField, {
							label: "oldPassword_label",
							value: attrs.model.getOldPassword(),
							helpLabel: () => m(StatusField, { status: attrs.model.getOldPasswordStatus() }),
							oninput: (input) => attrs.model.setOldPassword(input),
							autocompleteAs: Autocomplete.currentPassword,
							fontSize: px(size.font_size_smaller),
							type: attrs.model.isPasswordRevealed(PasswordFieldType.Old) ? BorderTextFieldType.Text : BorderTextFieldType.Password,
							injectionsRight: () => this.renderRevealIcon(attrs, PasswordFieldType.Old),
							labelBgColorOverwrite: attrs.labelBgColorOverwrite,
					  })
					: null,
				m(BorderTextField, {
					label: "newPassword_label",
					value: attrs.model.getNewPassword(),
					helpLabel: () =>
						m(".flex.col.mt-xs", [
							m(CompletenessIndicator, {
								width: "100%",
								passwordColorScale: true,
								percentageCompleted: scaleToVisualPasswordStrength(attrs.model.getPasswordStrength()),
							}),
						]),
					oninput: (input) => attrs.model.setNewPassword(input),
					autocompleteAs: Autocomplete.newPassword,
					fontSize: px(size.font_size_smaller),
					type: attrs.model.isPasswordRevealed(PasswordFieldType.New) ? BorderTextFieldType.Text : BorderTextFieldType.Password,
					injectionsRight: () => [
						m(IconButton, {
							icon: Icons.More,
							title: "generatePassphrase_action",
							click: async () => {
								attrs.model.setNewPassword(await showPasswordGeneratorDialog())
								m.redraw()
							},
							size: ButtonSize.Compact,
						}),
						this.renderRevealIcon(attrs, PasswordFieldType.New),
					],
					labelBgColorOverwrite: attrs.labelBgColorOverwrite,
				}),
				attrs.model.config.hideConfirmation
					? null
					: m(BorderTextField, {
							label: "repeatedPassword_label",
							value: attrs.model.getRepeatedPassword(),
							autocompleteAs: Autocomplete.newPassword,
							oninput: (input) => attrs.model.setRepeatedPassword(input),
							fontSize: px(size.font_size_smaller),
							type: attrs.model.isPasswordRevealed(PasswordFieldType.Confirm) ? BorderTextFieldType.Text : BorderTextFieldType.Password,
							injectionsRight: () => [
								m(IconButton, {
									icon: attrs.model.getRepeatedPasswordStatus().type == "valid" ? Icons.Checkmark : Icons.CircleReject,
									title: attrs.model.getRepeatedPasswordStatus().text,
									click: () => {},
									colors: attrs.model.getRepeatedPasswordStatus().type == "valid" ? ButtonColor.Success : ButtonColor.Error,
									size: ButtonSize.Compact,
								}),
								this.renderRevealIcon(attrs, PasswordFieldType.Confirm),
							],
							labelBgColorOverwrite: attrs.labelBgColorOverwrite,
					  }),
			],
		)
	}

	private renderRevealIcon(attrs: PasswordFormAttrs, passwordType: PasswordFieldType): Children {
		return m(ToggleButton, {
			title: "revealPassword_action",
			toggled: attrs.model.isPasswordRevealed(passwordType),
			onToggled: (_, e) => {
				attrs.model.toggleRevealPassword(passwordType)
				e.stopPropagation()
			},
			icon: attrs.model.isPasswordRevealed(passwordType) ? Icons.NoEye : Icons.Eye,
			size: ButtonSize.Compact,
		})
	}
}
