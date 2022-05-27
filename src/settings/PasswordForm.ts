import m, {Component} from "mithril"
import {TextFieldAttrs, TextFieldN, TextFieldType} from "../gui/base/TextFieldN"
import {PasswordIndicator} from "../gui/PasswordIndicator"
import {getPasswordStrength, isSecurePassword} from "../misc/PasswordUtils"
import {Dialog} from "../gui/base/Dialog"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {Status} from "../gui/base/StatusField"
import {StatusField} from "../gui/base/StatusField"
import {logins} from "../api/main/LoginController"
import {NotAuthenticatedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {User} from "../api/entities/sys/TypeRefs.js"
import {getEnabledMailAddressesForGroupInfo} from "../api/common/utils/GroupUtils"
import {ofClass} from "@tutao/tutanota-utils"
import {getEtId} from "../api/common/utils/EntityUtils"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"

assertMainOrNode()

/**
 * A form for entering a new password. Optionally it allows to enter the old password for validation and/or to repeat the new password.
 * showChangeOwnPasswordDialog() and showChangeUserPasswordAsAdminDialog() show this form as dialog.
 */
export class PasswordForm implements Component {
	readonly view: Component["view"]
	private _oldPassword!: string
	private _oldPasswordStatus!: Status
	private _newPassword!: string
	private _newPasswordStatus!: Status
	private _repeatedPassword!: string
	private _repeatedPasswordStatus!: Status
	private readonly _validateOldPassword: boolean
	private readonly _enforcePasswordStrength: boolean
	private readonly _repeatPassword: boolean

	constructor(
		validateOldPassword: boolean,
		enforcePasswordStrength: boolean,
		repeatPassword: boolean,
		passwordInfoTextId?: TranslationKey,
	) {
		this._validateOldPassword = validateOldPassword
		this._enforcePasswordStrength = enforcePasswordStrength
		this._repeatPassword = repeatPassword

		// make sure both the input values and status fields are initialized correctly
		this._onOldPasswordInput("")

		this._onNewPasswordInput("")

		this._onRepeatedPasswordInput("")

		const passwordIndicator = new PasswordIndicator(() => this._getPasswordStrength())
		this.view = () => {
			return m(
				"",
				{
					onremove: () => {
						this._oldPassword = ""
						this._newPassword = ""
						this._repeatedPassword = ""
					},
				},
				[
					validateOldPassword ? m(TextFieldN, {
						label: "oldPassword_label",
						value: this._oldPassword,
						helpLabel: () =>
							m(StatusField, {
								status: this._oldPasswordStatus,
							}),
						oninput: (value: string) => this._onOldPasswordInput(value),
						preventAutofill: true,
						type: TextFieldType.Password,
					}) : null,
					m(TextFieldN, {
						label: "newPassword_label",
						value: this._newPassword,
						helpLabel: () =>
							m(StatusField, {
								status: this._newPasswordStatus,
							}),
						oninput: (value: string) => this._onNewPasswordInput(value),
						type: TextFieldType.Password,
						preventAutofill: true,
						injectionsRight: () => m(".mb-s.mlr", m(passwordIndicator)),
					}),
					passwordInfoTextId ? m(".small.mt-s", lang.get(passwordInfoTextId)) : null,
					repeatPassword ? m(TextFieldN, {
						label: "repeatedPassword_label",
						value: this._repeatedPassword,
						helpLabel: () =>
							m(StatusField, {
								status: this._repeatedPasswordStatus,
							}),
						oninput: (value: string) => this._onRepeatedPasswordInput(value),
						type: TextFieldType.Password,
					}) : null,
				],
			)
		}
	}

	_getPasswordStrength(): number {
		let reserved: string[] = []

		if (logins.isUserLoggedIn()) {
			reserved = getEnabledMailAddressesForGroupInfo(logins.getUserController().userGroupInfo).concat(logins.getUserController().userGroupInfo.name)
		}

		// 80% strength is minimum. we expand it to 100%, so the password indicator if completely filled when the password is strong enough
		return getPasswordStrength(this._newPassword, reserved)
	}

	_getErrorFromStatus(status: Status): TranslationKey | null {
		if (!status) return null
		return status.type !== "valid" ? status.text : null
	}

	getErrorMessageId(): TranslationKey | null {
		return (
			this._getErrorFromStatus(this._oldPasswordStatus) ||
			this._getErrorFromStatus(this._newPasswordStatus) ||
			this._getErrorFromStatus(this._repeatedPasswordStatus)
		)
	}

	getOldPassword(): string {
		return this._oldPassword
	}

	getNewPassword(): string {
		return this._newPassword
	}

	isPasswordUnsecure(): boolean {
		return !isSecurePassword(this._getPasswordStrength())
	}

	/**
	 * The user must enter the old password in addition to the new password (twice). The password strength is enforced.
	 */
	static showChangeOwnPasswordDialog(allowCancel: boolean = true): void {
		let form = new PasswordForm(true, true, true)

		let changeOwnPasswordOkAction = (dialog: Dialog) => {
			let error = form.getErrorMessageId()

			if (error) {
				Dialog.message(error)
			} else {
				showProgressDialog("pleaseWait_msg", locator.loginFacade.changePassword(form.getOldPassword(), form.getNewPassword()))
					.then(() => {
						locator.credentialsProvider.deleteByUserId(getEtId(logins.getUserController().user))
						Dialog.message("pwChangeValid_msg")
						dialog.close()
					})
					.catch(
						ofClass(NotAuthenticatedError, e => {
							Dialog.message("oldPasswordInvalid_msg")
						}),
					)
					.catch(e => {
						Dialog.message("passwordResetFailed_msg")
					})
			}
		}

		Dialog.showActionDialog({
			title: lang.get("changePassword_label"),
			child: form,
			validator: () => form.getErrorMessageId(),
			okAction: changeOwnPasswordOkAction,
			allowCancel: allowCancel,
		})
	}

	/**
	 *The admin does not have to enter the old password in addition to the new password (twice). The password strength is not enforced.
	 */
	static showChangeUserPasswordAsAdminDialog(user: User): void {
		let form = new PasswordForm(false, false, true)

		let changeUserPasswordAsAdminOkAction = (dialog: Dialog) => {
			let p = locator.userManagementFacade
						   .changeUserPassword(user, form.getNewPassword())
						   .then(() => {
							   Dialog.message("pwChangeValid_msg")
							   dialog.close()
						   })
						   .catch(e => {
							   Dialog.message("passwordResetFailed_msg")
						   })
			showProgressDialog("pleaseWait_msg", p)
		}

		Dialog.showActionDialog({
			title: lang.get("changePassword_label"),
			child: form,
			validator: () => form.getErrorMessageId(),
			okAction: changeUserPasswordAsAdminOkAction,
		})
	}

	_onOldPasswordInput(oldPassword: string): void {
		this._oldPassword = oldPassword

		if (this._validateOldPassword && oldPassword === "") {
			this._oldPasswordStatus = {
				type: "neutral",
				text: "oldPasswordNeutral_msg",
			}
		} else {
			this._oldPasswordStatus = {
				type: "valid",
				text: "emptyString_msg",
			}
		}
	}

	_onNewPasswordInput(newPassword: string): void {
		this._newPassword = newPassword

		if (this._newPassword === "") {
			this._newPasswordStatus = {
				type: "neutral",
				text: "password1Neutral_msg",
			}
		} else if (this._validateOldPassword && this._oldPassword === this._newPassword) {
			this._newPasswordStatus = {
				type: "invalid",
				text: "password1InvalidSame_msg",
			}
		} else if (this.isPasswordUnsecure()) {
			if (this._enforcePasswordStrength) {
				this._newPasswordStatus = {
					type: "invalid",
					text: "password1InvalidUnsecure_msg",
				}
			} else {
				this._newPasswordStatus = {
					type: "valid",
					text: "password1InvalidUnsecure_msg",
				}
			}
		} else {
			this._newPasswordStatus = {
				type: "valid",
				text: "passwordValid_msg",
			}
		}
	}

	_onRepeatedPasswordInput(repeatedPassword: string): void {
		this._repeatedPassword = repeatedPassword

		if (this._repeatPassword && this._repeatedPassword === "") {
			this._repeatedPasswordStatus = {
				type: "neutral",
				text: "password2Neutral_msg",
			}
		} else if (this._repeatPassword && this._repeatedPassword !== this._newPassword) {
			this._repeatedPasswordStatus = {
				type: "invalid",
				text: "password2Invalid_msg",
			}
		} else {
			this._repeatedPasswordStatus = {
				type: "valid",
				text: "passwordValid_msg",
			}
		}
	}
}