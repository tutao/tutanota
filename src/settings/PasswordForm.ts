import m, {Children, Component, Vnode} from "mithril"
import {TextFieldN, TextFieldType} from "../gui/base/TextFieldN"
import {PasswordIndicator} from "../gui/PasswordIndicator"
import {getPasswordStrength, isSecurePassword} from "../misc/PasswordUtils"
import {Dialog} from "../gui/base/Dialog"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {Status} from "../gui/base/StatusField"
import {StatusField} from "../gui/base/StatusField"
import {LoginController, logins} from "../api/main/LoginController"
import {NotAuthenticatedError} from "../api/common/error/RestError"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {User} from "../api/entities/sys/TypeRefs.js"
import {ofClass} from "@tutao/tutanota-utils"
import {getEtId} from "../api/common/utils/EntityUtils"
import {locator} from "../api/main/MainLocator"
import {assertMainOrNode} from "../api/common/Env"
import stream from "mithril/stream"
import {getEnabledMailAddressesForGroupInfo} from "../api/common/utils/GroupUtils.js"

assertMainOrNode()

export interface PasswordInput {
	value: string
	onChanged: (password: string) => void
}

export interface PasswordFormAttrs {
	model: PasswordModel
	passwordInfoKey?: TranslationKey
}

export class PasswordModel {
	public readonly newPassword = stream("")
	public readonly oldPassword = stream("")
	public readonly repeatedPassword = stream("")

	constructor(
		readonly checkOldPassword: boolean,
		readonly enforceStrength: boolean,
		readonly repeatInput: boolean,
		private readonly logins: LoginController,
	) {
	}

	clear() {
		this.newPassword("")
		this.oldPassword("")
		this.repeatedPassword("")
	}

	getErrorMessageId(): TranslationKey | null {
		return (
			this.getErrorFromStatus(this.getOldPasswordStatus()) ||
			this.getErrorFromStatus(this.getNewPasswordStatus()) ||
			this.getErrorFromStatus(this.getRepeatedPasswordStatus())
		)
	}

	private getErrorFromStatus(status: Status): TranslationKey | null {
		if (!status) return null
		return status.type !== "valid" ? status.text : null
	}

	getOldPasswordStatus(): Status {
		if (this.checkOldPassword && this.oldPassword() === "") {
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
		if (this.newPassword() === "") {
			return {
				type: "neutral",
				text: "password1Neutral_msg",
			}
		} else if (this.checkOldPassword && this.oldPassword() === this.newPassword()) {
			return {
				type: "invalid",
				text: "password1InvalidSame_msg",
			}
		} else if (this.isPasswordInsecure()) {
			if (this.enforceStrength) {
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
		const repeatedPassword = this.repeatedPassword()
		const newPassword = this.newPassword()

		if (this.repeatInput && repeatedPassword === "") {
			return {
				type: "neutral",
				text: "password2Neutral_msg",
			}
		} else if (this.repeatInput && repeatedPassword !== newPassword) {
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

	getPasswordStrength() {
		let reserved: string[] = []

		if (this.logins.isUserLoggedIn()) {
			reserved = getEnabledMailAddressesForGroupInfo(this.logins.getUserController().userGroupInfo)
				.concat(this.logins.getUserController().userGroupInfo.name)
		}

		// 80% strength is minimum. we expand it to 100%, so the password indicator if completely filled when the password is strong enough
		return getPasswordStrength(this.newPassword(), reserved)
	}
}

/**
 * A form for entering a new password. Optionally it allows to enter the old password for validation and/or to repeat the new password.
 * showChangeOwnPasswordDialog() and showChangeUserPasswordAsAdminDialog() show this form as dialog.
 */
export class PasswordForm implements Component<PasswordFormAttrs> {

	view({attrs}: Vnode<PasswordFormAttrs>): Children {

		return m("",
			{
				onremove: () => attrs.model.clear(),
			},
			[
				attrs.model.checkOldPassword ? m(TextFieldN, {
					label: "oldPassword_label",
					value: attrs.model.oldPassword(),
					helpLabel: () => m(StatusField, {status: attrs.model.getOldPasswordStatus()}),
					oninput: attrs.model.oldPassword,
					preventAutofill: true,
					type: TextFieldType.Password,
				}) : null,
				m(TextFieldN, {
					label: "newPassword_label",
					value: attrs.model.newPassword(),
					helpLabel: () => m(StatusField, {
						status: attrs.model.getNewPasswordStatus(),
					}),
					oninput: attrs.model.newPassword,
					type: TextFieldType.Password,
					preventAutofill: true,
					injectionsRight: () => m(".mb-s.mlr", m(PasswordIndicator, {strength: attrs.model.getPasswordStrength()})),
				}),
				attrs.passwordInfoKey ? m(".small.mt-s", lang.get(attrs.passwordInfoKey)) : null,
				attrs.model.repeatInput
					? m(TextFieldN, {
						label: "repeatedPassword_label",
						value: attrs.model.repeatedPassword(),
						helpLabel: () =>
							m(StatusField, {
								status: attrs.model.getRepeatedPasswordStatus(),
							}),
						oninput: attrs.model.repeatedPassword,
						type: TextFieldType.Password,
					})
					: null,
			],
		)

	}
}

/**
 *The admin does not have to enter the old password in addition to the new password (twice). The password strength is not enforced.
 */
export async function showChangeUserPasswordAsAdminDialog(user: User) {
	const {logins} = await import("../api/main/LoginController.js")
	const model = new PasswordModel(false, false, true, logins)

	const changeUserPasswordAsAdminOkAction = (dialog: Dialog) => {
		let p = locator.userManagementFacade
					   .changeUserPassword(user, model.newPassword())
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
		child: () => m(PasswordForm, {model}),
		validator: () => model.getErrorMessageId(),
		okAction: changeUserPasswordAsAdminOkAction,
	})
}


/**
 * The user must enter the old password in addition to the new password (twice). The password strength is enforced.
 */
export async function showChangeOwnPasswordDialog(allowCancel: boolean = true) {
	const {logins} = await import("../api/main/LoginController.js")

	const model = new PasswordModel(true, true, true, logins)

	const changeOwnPasswordOkAction = (dialog: Dialog) => {
		const error = model.getErrorMessageId()

		if (error) {
			Dialog.message(error)
		} else {
			showProgressDialog("pleaseWait_msg", locator.loginFacade.changePassword(model.oldPassword(), model.newPassword()))
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
		child: () => m(PasswordForm, {model}),
		validator: () => model.getErrorMessageId(),
		okAction: changeOwnPasswordOkAction,
		allowCancel: allowCancel,
	})
}