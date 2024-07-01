import { User } from "../../../common/api/entities/sys/TypeRefs.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
<<<<<<<< HEAD:src/common/settings/login/ChangePasswordDialogs.ts
import { locator } from "../../../common/api/main/CommonLocator.js"
========
import { locator } from "../../../common/api/main/MainLocator.js"
>>>>>>>> 3349a964d (Move files to new folder structure):src/mail-app/settings/login/ChangePasswordDialogs.ts
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import m from "mithril"
import { NotAuthenticatedError } from "../../../common/api/common/error/RestError.js"
import { PasswordForm, PasswordModel } from "../PasswordForm.js"
import { assertNotNull, ofClass } from "@tutao/tutanota-utils"
import { asKdfType, DEFAULT_KDF_TYPE } from "../../../common/api/common/TutanotaConstants.js"

/**
 *The admin does not have to enter the old password in addition to the new password (twice). The password strength is not enforced.
 */
export async function showChangeUserPasswordAsAdminDialog(user: User) {
	const model = new PasswordModel(locator.usageTestController, locator.logins, { checkOldPassword: false, enforceStrength: false, hideConfirmation: true })

	const changeUserPasswordAsAdminOkAction = async (dialog: Dialog) => {
		showProgressDialog("pleaseWait_msg", locator.userManagementFacade.changeUserPassword(user, model.getNewPassword())).then(
			() => {
				Dialog.message("pwChangeValid_msg")
				dialog.close()
			},
			(e) => {
				console.error(e)
				Dialog.message("passwordResetFailed_msg")
			},
		)
	}

	Dialog.showActionDialog({
		title: lang.get("changePassword_label"),
		child: () => m(PasswordForm, { model }),
		validator: () => model.getErrorMessageId(),
		okAction: changeUserPasswordAsAdminOkAction,
	})
}

async function storeNewPassword(currentUser: User, encryptedPassword: string | null) {
	const credentialsProvider = locator.credentialsProvider
	const storedCredentials = await credentialsProvider.getCredentialsInfoByUserId(currentUser._id)
	if (storedCredentials != null) {
		const password = assertNotNull(encryptedPassword, "encrypted password not provided")
		await credentialsProvider.replacePassword(storedCredentials, password)
	}
}

/**
 * The user must enter the old password in addition to the new password (twice). The password strength is enforced.
 */
export async function showChangeOwnPasswordDialog(allowCancel: boolean = true) {
	const model = new PasswordModel(locator.usageTestController, locator.logins, { checkOldPassword: true, enforceStrength: true })

	const changeOwnPasswordOkAction = async (dialog: Dialog) => {
		const error = model.getErrorMessageId()

		if (error) {
			Dialog.message(error)
		} else {
			const currentUser = locator.logins.getUserController().user
			const currentKdfType = asKdfType(currentUser.kdfVersion)
			const currentPasswordKeyData = {
				kdfType: currentKdfType,
				salt: assertNotNull(currentUser.salt),
				passphrase: model.getOldPassword(),
			}

			const newPasswordKeyData = {
				kdfType: DEFAULT_KDF_TYPE,
				passphrase: model.getNewPassword(),
			}

			showProgressDialog("pleaseWait_msg", locator.loginFacade.changePassword(currentPasswordKeyData, newPasswordKeyData))
				.then(async (encryptedPassword) => {
					Dialog.message("pwChangeValid_msg")
					dialog.close()
					// do not wait for it or catch the errors, we do not want to confuse the user with the password change if anything goes wrong
					storeNewPassword(currentUser, encryptedPassword)
				})
				.catch(
					ofClass(NotAuthenticatedError, (e) => {
						Dialog.message("oldPasswordInvalid_msg")
					}),
				)
				.catch((e) => {
					console.error(e)
					Dialog.message("passwordResetFailed_msg")
				})
		}
	}

	Dialog.showActionDialog({
		title: lang.get("changePassword_label"),
		child: () => m(PasswordForm, { model }),
		validator: () => model.getErrorMessageId(),
		okAction: changeOwnPasswordOkAction,
		allowCancel: allowCancel,
	})
}
