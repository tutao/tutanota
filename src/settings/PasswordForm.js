// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/common/Env"
import {Type} from "../gui/base/TextField"
import {PasswordIndicator} from "../gui/PasswordIndicator"
import {getPasswordStrength, isSecurePassword} from "../misc/PasswordUtils"
import {Dialog} from "../gui/base/Dialog"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {StatusField} from "../gui/base/StatusField"
import stream from "mithril/stream/stream.js"
import {logins} from "../api/main/LoginController"
import {worker} from "../api/main/WorkerClient"
import {NotAuthenticatedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/ProgressDialog"
import {deviceConfig} from "../misc/DeviceConfig"
import type {User} from "../api/entities/sys/User"
import {getEnabledMailAddressesForGroupInfo} from "../api/common/utils/GroupUtils";
import {TextFieldN} from "../gui/base/TextFieldN"

assertMainOrNode()

/**
 * A form for entering a new password. Optionally it allows to enter the old password for validation and/or to repeat the new password.
 * showChangeOwnPasswordDialog() and showChangeUserPasswordAsAdminDialog() show this form as dialog.
 */
export class PasswordForm {
	view: Function;
	_oldPassword: string
	_oldPasswordStatus: Status;
	_newPassword: string
	_newPasswordStatus: Status;
	_repeatedPassword: string
	_repeatedPasswordStatus: Status;

	_validateOldPassword: boolean
	_enforcePasswordStrength: boolean
	_repeatPassword: boolean

	constructor(validateOldPassword: boolean, enforcePasswordStrength: boolean, repeatPassword: boolean, passwordInfoTextId: ?TranslationKey) {
		this._validateOldPassword = validateOldPassword
		this._enforcePasswordStrength = enforcePasswordStrength
		this._repeatPassword = repeatPassword

		// make sure both the input values and status fields are initialized correctly
		this._onOldPasswordInput("")
		this._onNewPasswordInput("")
		this._onRepeatedPasswordInput("")

		const oldPasswordFieldAttrs = {
			label: "oldPassword_label",
			value: stream(this._oldPassword),
			helpLabel: () => m(StatusField, {status: this._oldPasswordStatus}),
			oninput: (value) => this._onOldPasswordInput(value),
			preventAutoFill: true,
			type: Type.Password,
		}

		const passwordIndicator = new PasswordIndicator(() => this._getPasswordStrength())
		const newPasswordFieldAttrs = {
			label: "newPassword_label",
			value: stream(this._newPassword),
			helpLabel: () => m(StatusField, {status: this._newPasswordStatus}),
			oninput: (value) => this._onNewPasswordInput(value),
			type: Type.Password,
			preventAutofill: true,
			injectionsRight: () => [m(passwordIndicator)],
		}

		const repeatedPasswordFieldAttrs = {
			label: "repeatedPassword_label",
			value: stream(this._repeatedPassword),
			helpLabel: () => m(StatusField, {status: this._repeatedPasswordStatus}),
			oninput: (value) => this._onRepeatedPasswordInput(value),
			type: Type.Password,
		}

		this.view = () => {
			return m("", {
				onremove: () => {
					this._oldPassword = ""
					this._newPassword = ""
					this._repeatedPassword = ""
				}
			}, [
				(validateOldPassword) ? m(TextFieldN, oldPasswordFieldAttrs) : null,
				m(TextFieldN, newPasswordFieldAttrs),
				(passwordInfoTextId) ? m(".small.mt-s", lang.get(passwordInfoTextId)) : null,
				(repeatPassword) ? m(TextFieldN, repeatedPasswordFieldAttrs) : null
			])
		}
	}

	_getPasswordStrength(): number {
		let reserved = []
		if (logins.isUserLoggedIn()) {
			reserved = getEnabledMailAddressesForGroupInfo(logins.getUserController().userGroupInfo)
				.concat(logins.getUserController().userGroupInfo.name)
		}
		// 80% strength is minimum. we expand it to 100%, so the password indicator if completely filled when the password is strong enough
		return getPasswordStrength(this._newPassword, reserved)
	}

	_getErrorFromStatus(status: Status): ?TranslationKey {
		if (!status) return null

		return (status.type !== "valid") ? status.text : null
	}

	getErrorMessageId(): ?TranslationKey {
		return this._getErrorFromStatus(this._oldPasswordStatus)
			|| this._getErrorFromStatus(this._newPasswordStatus)
			|| this._getErrorFromStatus(this._repeatedPasswordStatus)
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
		let changeOwnPasswordOkAction = (dialog) => {
			let error = form.getErrorMessageId();
			if (error) {
				Dialog.error(error)
			} else {
				showProgressDialog("pleaseWait_msg",
					worker.changePassword(form.getOldPassword(), form.getNewPassword()))
					.then(() => {
						deviceConfig.deleteByAccessToken(logins.getUserController().accessToken)
						Dialog.error("pwChangeValid_msg")
						dialog.close()
					})
					.catch(NotAuthenticatedError, e => {
						Dialog.error("oldPasswordInvalid_msg")
					})
					.catch(e => {
						Dialog.error("passwordResetFailed_msg")
					})
			}
		}
		Dialog.showActionDialog({
			title: lang.get("changePassword_label"),
			child: form,
			validator: () => form.getErrorMessageId(),
			okAction: changeOwnPasswordOkAction,
			allowCancel: allowCancel
		})
	}

	/**
	 *The admin does not have to enter the old password in addition to the new password (twice). The password strength is not enforced.
	 */
	static showChangeUserPasswordAsAdminDialog(user: User): void {
		let form = new PasswordForm(false, false, true)
		let changeUserPasswordAsAdminOkAction = (dialog) => {
			let p = worker.changeUserPassword(user, form.getNewPassword()).then(() => {
				Dialog.error("pwChangeValid_msg")
				dialog.close()
			}).catch(e => {
				Dialog.error("passwordResetFailed_msg")
			})
			showProgressDialog("pleaseWait_msg", p)
		}

		Dialog.showActionDialog({
			title: lang.get("changePassword_label"),
			child: form,
			validator: () => form.getErrorMessageId(),
			okAction: changeUserPasswordAsAdminOkAction
		})
	}

	_onOldPasswordInput(oldPassword: string): void {
		this._oldPassword = oldPassword

		if (this._validateOldPassword && oldPassword === "") {
			this._oldPasswordStatus = {type: "neutral", text: "oldPasswordNeutral_msg"}
		} else {
			this._oldPasswordStatus = {type: "valid", text: "emptyString_msg"}
		}
	}

	_onNewPasswordInput(newPassword: string): void {
		this._newPassword = newPassword

		if (this._newPassword === "") {
			this._newPasswordStatus = {type: "neutral", text: "password1Neutral_msg"}
		} else if (this._validateOldPassword && this._oldPassword === this._newPassword) {
			this._newPasswordStatus = {type: "invalid", text: "password1InvalidSame_msg"}
		} else if (this.isPasswordUnsecure()) {
			if (this._enforcePasswordStrength) {
				this._newPasswordStatus = {type: "invalid", text: "password1InvalidUnsecure_msg"}
			} else {
				this._newPasswordStatus = {type: "valid", text: "password1InvalidUnsecure_msg"}
			}
		} else {
			this._newPasswordStatus = {type: "valid", text: "passwordValid_msg"}
		}
	}

	_onRepeatedPasswordInput(repeatedPassword: string): void {
		this._repeatedPassword = repeatedPassword

		if (this._repeatPassword && this._repeatedPassword === "") {
			this._repeatedPasswordStatus = {type: "neutral", text: "password2Neutral_msg"}
		} else if (this._repeatPassword && this._repeatedPassword !== this._newPassword) {
			this._repeatedPasswordStatus = {type: "invalid", text: "password2Invalid_msg"}
		} else {
			this._repeatedPasswordStatus = {type: "valid", text: "passwordValid_msg"}
		}
	}
}
