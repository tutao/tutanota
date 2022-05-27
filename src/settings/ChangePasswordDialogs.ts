import {User} from "../api/entities/sys/TypeRefs.js";
import {Dialog} from "../gui/base/Dialog.js";
import {locator} from "../api/main/MainLocator.js";
import {showProgressDialog} from "../gui/dialogs/ProgressDialog.js";
import {lang} from "../misc/LanguageViewModel.js";
import m from "mithril";
import {getEtId} from "../api/common/utils/EntityUtils.js";
import {NotAuthenticatedError} from "../api/common/error/RestError.js";
import {PasswordForm, PasswordModel} from "./PasswordForm.js";
import {ofClass} from "@tutao/tutanota-utils"

/**
 *The admin does not have to enter the old password in addition to the new password (twice). The password strength is not enforced.
 */
export async function showChangeUserPasswordAsAdminDialog(user: User) {
	const {logins} = await import("../api/main/LoginController.js")
	const model = new PasswordModel(logins, {checkOldPassword: false, enforceStrength: false, repeatInput: true})

	const changeUserPasswordAsAdminOkAction = (dialog: Dialog) => {
		showProgressDialog("pleaseWait_msg", locator.userManagementFacade.changeUserPassword(user, model.newPassword))
			.then(
				() => {
					Dialog.message("pwChangeValid_msg")
					dialog.close()
				},
				(e) => {
					console.error(e)
					Dialog.message("passwordResetFailed_msg")
				}
			)
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

	const model = new PasswordModel(logins, {checkOldPassword: true, enforceStrength: true, repeatInput: true})

	const changeOwnPasswordOkAction = (dialog: Dialog) => {
		const error = model.getErrorMessageId()

		if (error) {
			Dialog.message(error)
		} else {
			showProgressDialog("pleaseWait_msg", locator.loginFacade.changePassword(model.oldPassword, model.newPassword))
				.then(() => {
					locator.credentialsProvider.deleteByUserId(getEtId(logins.getUserController().user))
					Dialog.message("pwChangeValid_msg")
					dialog.close()
				})
				.catch(ofClass(NotAuthenticatedError, e => {
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