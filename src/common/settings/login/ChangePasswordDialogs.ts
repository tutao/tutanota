import { User } from "../../api/entities/sys/TypeRefs.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { locator } from "../../api/main/CommonLocator.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import m from "mithril"
import { NotAuthenticatedError } from "../../api/common/error/RestError.js"
import { PasswordForm, PasswordModel } from "../PasswordForm.js"
import { assertNonNull, assertNotNull, Base64, newPromise, ofClass } from "@tutao/tutanota-utils"
import { asKdfType, DEFAULT_KDF_TYPE } from "../../api/common/TutanotaConstants.js"

/**
 *The admin does not have to enter the old password in addition to the new password (twice). The password strength is not enforced.
 */
export async function showChangeUserPasswordAsAdminDialog(user: User) {
	const model = new PasswordModel(locator.usageTestController, locator.logins, {
		checkOldPassword: false,
		enforceStrength: false,
		hideConfirmation: true,
	})

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
		title: "changePassword_label",
		child: () => m(PasswordForm, { model }),
		validator: () => model.getErrorMessageId(),
		okAction: changeUserPasswordAsAdminOkAction,
	})
}

async function storeNewPassword(
	currentUser: User,
	newPasswordData: {
		newEncryptedPassphrase: Base64
		newEncryptedPassphraseKey: Uint8Array
	} | null,
) {
	const credentialsProvider = locator.credentialsProvider
	const storedCredentials = await credentialsProvider.getCredentialsInfoByUserId(currentUser._id)
	if (storedCredentials != null) {
		assertNonNull(newPasswordData, "encrypted password data is not provided")
		await credentialsProvider.replacePassword(storedCredentials, newPasswordData.newEncryptedPassphrase, newPasswordData.newEncryptedPassphraseKey)
	}
}

/**
 * The user must enter the old password in addition to the new password (twice). The password strength is enforced.
 */
export async function showChangeOwnPasswordDialog(allowCancel: boolean = true) {
	const model = new PasswordModel(locator.usageTestController, locator.logins, {
		checkOldPassword: true,
		enforceStrength: true,
	})

	const changeOwnPasswordOkAction = async (dialog: Dialog) => {
		const error = model.getErrorMessageId()

		if (error) {
			await Dialog.message(error)
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

			return showProgressDialog("pleaseWait_msg", locator.loginFacade.changePassword(currentPasswordKeyData, newPasswordKeyData))
				.then(async (newPasswordData) => {
					dialog.close()

					// do not wait for it or catch the errors, we do not want to confuse the user with the password change if anything goes wrong
					storeNewPassword(currentUser, newPasswordData)

					await Dialog.message("pwChangeValid_msg")
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

	return newPromise<void>((resolve, reject) => {
		Dialog.showActionDialog({
			title: "changePassword_label",
			child: () => m(PasswordForm, { model }),
			validator: () => model.getErrorMessageId(),
			okAction: async (dialog) => {
				try {
					await changeOwnPasswordOkAction(dialog)
					resolve()
				} catch (e) {
					reject(e)
				}
			},
			allowCancel: allowCancel,
		})
	})
}
