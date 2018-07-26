// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField, Type} from "../gui/base/TextField"
import {PasswordIndicator} from "../gui/base/PasswordIndicator"
import {getPasswordStrength} from "../misc/PasswordUtils"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {StatusField} from "../gui/base/StatusField"
import Stream from "mithril/stream/stream.js"
import {logins} from "../api/main/LoginController"
import {worker} from "../api/main/WorkerClient"
import {getEnabledMailAddressesForGroupInfo} from "../api/common/utils/Utils"
import {NotAuthenticatedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {deviceConfig} from "../misc/DeviceConfig"

assertMainOrNode()

/**
 * A form for entering a new password. Optionally it allows to enter the old password for validation and/or to repeat the new password.
 * showChangeOwnPasswordDialog() and showChangeUserPasswordAsAdminDialog() show this form as dialog.
 */
export class PasswordForm {
	view: Function;
	_oldPasswordField: TextField;
	_oldPasswordFieldStatus: StatusField;
	_newPasswordField: TextField;
	_newPasswordFieldStatus: StatusField;
	_repeatedPasswordField: TextField;
	_repeatedPasswordFieldStatus: StatusField;

	constructor(validateOldPassword: boolean, enforcePasswordStrength: boolean, repeatPassword: boolean, passwordInfoTextId: ?string) {
		this._oldPasswordField = new TextField("oldPassword_label", () => m(this._oldPasswordFieldStatus)).setType(Type.Password)
		this._oldPasswordFieldStatus = new StatusField(this._oldPasswordField.value.map(pw => {
				if (validateOldPassword && pw === "") {
					return {type: "neutral", text: "oldPasswordNeutral_msg"}
				} else {
					return {type: "valid", text: "emptyString_msg"}
				}
			})
		)

		let passwordIndicator = new PasswordIndicator(() => this._getPasswordStrength())
		this._newPasswordField = new TextField("newPassword_label", () => m(this._newPasswordFieldStatus)).setType(Type.Password)
		this._newPasswordField._injectionsRight = () => m(".mb-s.mlr", [m(passwordIndicator)])
		this._newPasswordFieldStatus = new StatusField(Stream.combine(() => {
			if (this._newPasswordField.value() === "") {
				return {type: "neutral", text: "password1Neutral_msg"}
			} else if (validateOldPassword && this._oldPasswordField.value() === this._newPasswordField.value()) {
				return {type: "invalid", text: "password1InvalidSame_msg"}
			} else if (this.isPasswordUnsecure()) {
				if (enforcePasswordStrength) {
					return {type: "invalid", text: "password1InvalidUnsecure_msg"}
				} else {
					return {type: "valid", text: "password1InvalidUnsecure_msg"}
				}
			} else {
				return {type: "valid", text: "passwordValid_msg"}
			}
		}, [this._newPasswordField.value, this._oldPasswordField.value]))
		this._repeatedPasswordField = new TextField("repeatedPassword_label", () => m(this._repeatedPasswordFieldStatus)).setType(Type.Password)
		this._repeatedPasswordFieldStatus = new StatusField(Stream.combine(() => {
			if (repeatPassword && this._repeatedPasswordField.value() === "") {
				return {type: "neutral", text: "password2Neutral_msg"}
			} else if (repeatPassword && this._repeatedPasswordField.value() !== this._newPasswordField.value()) {
				return {type: "invalid", text: "password2Invalid_msg"}
			} else {
				return {type: "valid", text: "passwordValid_msg"}
			}
		}, [this._newPasswordField.value, this._repeatedPasswordField.value]))

		this.view = () => {
			return [
				(validateOldPassword) ? m(this._oldPasswordField) : null,
				m(this._newPasswordField),
				(passwordInfoTextId) ? m(".small.mt-s", lang.get(passwordInfoTextId)) : null,
				(repeatPassword) ? m(this._repeatedPasswordField) : null
			]
		}
	}

	_getPasswordStrength() {
		let reserved = []
		if (logins.isUserLoggedIn()) {
			reserved = getEnabledMailAddressesForGroupInfo(logins.getUserController().userGroupInfo).concat(logins.getUserController().userGroupInfo.name)
		}
		// 80% strength is minimum. we expand it to 100%, so the password indicator if completely filled when the password is strong enough
		return Math.min(100, (getPasswordStrength(this._newPasswordField.value(), reserved) / 0.8 * 1))
	}

	getErrorMessageId(): ?string {
		return this._oldPasswordFieldStatus.getErrorMessageId() || this._newPasswordFieldStatus.getErrorMessageId() || this._repeatedPasswordFieldStatus.getErrorMessageId()
	}

	getOldPassword(): string {
		return this._oldPasswordField.value()
	}

	getNewPassword(): string {
		return this._newPasswordField.value()
	}

	isPasswordUnsecure(): boolean {
		return this._getPasswordStrength() < 100
	}

	/**
	 * The user must enter the old password in addition to the new password (twice). The password strength is enforced.
	 */
	static showChangeOwnPasswordDialog(allowCancel: boolean = true): void {
		let form = new PasswordForm(true, true, true)
		let dialog = Dialog.smallActionDialog(lang.get("changePassword_label"), form, () => {
			let error = form.getErrorMessageId();
			if (error) {
				Dialog.error(error)
			} else {
				showProgressDialog("pleaseWait_msg", worker.changePassword(form.getOldPassword(), form.getNewPassword())).then(() => {
					deviceConfig.deleteByAccessToken(logins.getUserController().accessToken)
					Dialog.error("pwChangeValid_msg")
					dialog.close()
				}).catch(NotAuthenticatedError, e => {
					Dialog.error("oldPasswordInvalid_msg")
				}).catch(e => {
					Dialog.error("passwordResetFailed_msg")
				})
			}
		}, allowCancel)
	}

	/**
	 *The admin does not have to enter the old password in addition to the new password (twice). The password strength is not enforced.
	 */
	static showChangeUserPasswordAsAdminDialog(user: User): void {
		let form = new PasswordForm(false, false, true)
		Dialog.smallDialog(lang.get("changePassword_label"), form, () => form.getErrorMessageId()).then(okClicked => {
			if (okClicked) {
				let p = worker.changeUserPassword(user, form.getNewPassword()).then(() => {
					Dialog.error("pwChangeValid_msg")
				}).catch(e => {
					Dialog.error("passwordResetFailed_msg")
				})
				showProgressDialog("pleaseWait_msg", p)
			}
		})
	}
}
