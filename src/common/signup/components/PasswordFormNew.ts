import m, { Children, Component, Vnode } from "mithril"
import { PasswordFieldAttrs, PasswordFieldNew } from "./PasswordFieldNew"
import { font_size, px } from "../../gui/size"
import { assertMainOrNode } from "../../api/common/Env"
import { lang, TranslationKey } from "../../misc/LanguageViewModel"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { LoginController } from "../../api/main/LoginController"
import { Status } from "../../gui/base/StatusField"
import { getPasswordStrength, isSecurePassword } from "../../misc/passwords/PasswordUtils"
import { getEnabledMailAddressesForGroupInfo } from "../../api/common/utils/GroupUtils"
import { Autocomplete } from "../../gui/base/TextField"
import { theme } from "../../gui/theme"
import { PasswordGenerator } from "../../misc/passwords/PasswordGenerator"
import { locator } from "../../api/main/CommonLocator"
import { copyToClipboard } from "../../misc/ClipboardUtils"
import { delay } from "@tutao/tutanota-utils"
import { showSnackBar } from "../../gui/base/SnackBar"
import { Icons } from "../../gui/base/icons/Icons"
import { styles } from "../../gui/styles"

assertMainOrNode()

export interface PasswordFormAttrs {
	model: PasswordModel
	passwordInfoKey?: TranslationKey
}

export interface PasswordModelConfig {
	readonly checkOldPassword: boolean
	readonly enforceStrength: boolean
	/** if set to true the second password field won't be rendered. If not set at all or false the second password field is rendered */
	readonly hideConfirmation?: boolean
	readonly reservedStrings?: () => string[]
}

export class PasswordModel {
	private newPassword = ""
	private oldPassword = ""
	private repeatedPassword = ""
	private passwordStrength: number
	private readonly __mailValid: Stream<boolean>

	constructor(
		private readonly usageTestController: UsageTestController,
		private readonly logins: LoginController,
		readonly config: PasswordModelConfig,
		mailValid?: Stream<boolean>,
	) {
		this.passwordStrength = this.calculatePasswordStrength()

		this.__mailValid = mailValid ?? stream(false)
	}

	_checkBothValidAndSendPing() {
		if (this.getNewPasswordStatus().type === "valid" && this.getRepeatedPasswordStatus().type === "valid") {
			// Password entry (both passwords entered and valid)
			// Only the started test's (either free or paid clicked) stage is completed here
		}
	}

	getNewPassword(): string {
		return this.newPassword
	}

	setNewPassword(newPassword: string) {
		if (this.__mailValid && this.__mailValid()) {
			// Email address selection finished (email address is available and clicked in password field)
			// Only the started test's (either free or paid clicked) stage is completed here
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
}

/**
 * A form for entering a new password. Optionally it allows to enter the old password for validation and/or to repeat the new password.
 * showChangeOwnPasswordDialog() and showChangeUserPasswordAsAdminDialog() show this form as dialog.
 */
export class PasswordFormNew implements Component<PasswordFormAttrs> {
	private dictionary: string[] = []
	private pwGenerator: PasswordGenerator | undefined
	private hasGeneratedPassword = false

	async oncreate() {
		const appState = window.tutao.appState
		const baseUrl = location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "") + appState.prefixWithoutFile
		this.dictionary = await fetch(baseUrl + "/wordlibrary.json").then((response) => response.json())
		this.pwGenerator = new PasswordGenerator(locator.random, this.dictionary)
	}
	view({ attrs }: Vnode<PasswordFormAttrs>): Children {
		return m(
			`.flex.flex-column.${styles.isMobileLayout() ? ".gap-8" : ".gap-24"}`,
			{
				onremove: () => attrs.model.clear(),
			},
			[
				attrs.model.config.checkOldPassword
					? m(PasswordFieldNew, {
							label: "oldPassword_label",
							value: attrs.model.getOldPassword(),
							status: attrs.model.getOldPasswordStatus(),
							oninput: (input) => attrs.model.setOldPassword(input),
							autocompleteAs: Autocomplete.currentPassword,
							fontSize: px(font_size.smaller),
						} satisfies PasswordFieldAttrs)
					: null,
				m(PasswordFieldNew, {
					label: "newPassword_label",
					value: attrs.model.getNewPassword(),
					passwordStrength: attrs.model.getPasswordStrength(),
					helpLabel: () => this.renderPasswordGeneratorHelp(attrs),
					status: "auto",
					oninput: (input) => attrs.model.setNewPassword(input),
					autocompleteAs: Autocomplete.newPassword,
					fontSize: px(font_size.smaller),
				}),
				attrs.model.config.hideConfirmation
					? null
					: m(PasswordFieldNew, {
							label: "repeatedPassword_label",
							value: attrs.model.getRepeatedPassword(),
							autocompleteAs: Autocomplete.newPassword,
							status: attrs.model.getRepeatedPasswordStatus(),
							oninput: (input) => attrs.model.setRepeatedPassword(input),
							fontSize: px(font_size.smaller),
						}),
				attrs.passwordInfoKey ? m(".small.mt-8", lang.get(attrs.passwordInfoKey)) : null,
			],
		)
	}

	private renderPasswordGeneratorHelp(attrs: PasswordFormAttrs): Children {
		return m(".flex.gap-8", [
			m(
				"button.hover.click",
				{
					style: { display: "inline-block", color: theme.on_surface_variant },
					onclick: async () => {
						const newPassword = await this.pwGenerator!.generateRandomPassphrase()
						let currentPassword = attrs.model.getNewPassword()
						while (currentPassword.length > 0) {
							currentPassword = currentPassword.slice(0, currentPassword.length - 1)
							attrs.model.setNewPassword(currentPassword)
							m.redraw()
							await delay(1)
						}
						for (const char of newPassword) {
							currentPassword += char
							attrs.model.setNewPassword(currentPassword)
							m.redraw()
							await delay(1)
						}
						this.hasGeneratedPassword = true
						m.redraw()
					},
				},
				!this.hasGeneratedPassword ? lang.get("generatePassword_action") : lang.get("regeneratePassword_action"),
			),
			this.hasGeneratedPassword &&
				m.fragment({}, [
					m("div", {
						style: {
							height: "auto",
							width: px(1),
							background: theme.outline_variant,
						},
					}),
					m(
						"button.mr-4.hover.click",
						{
							onclick: () => {
								copyToClipboard(attrs.model.getNewPassword())
								void showSnackBar({
									message: "copied_msg",
									showingTime: 3000,
									leadingIcon: Icons.Clipboard,
								})
							},
						},
						lang.getTranslationText("copy_action"),
					),
				]),
		])
	}
}
