import { CommonNativeFacade } from "../common/generatedipc/CommonNativeFacade.js"
import { IMainLocator } from "../../api/main/MainLocator.js"
import { TranslationKey } from "../../misc/LanguageViewModel.js"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { UserError } from "../../api/main/UserError.js"
import { themeController } from "../../gui/theme.js"
import m from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"

export class WebCommonNativeFacade implements CommonNativeFacade {
	/**
	 * create a mail editor as requested from the native side, ie because a
	 * mailto-link was clicked or the "Send as mail" option
	 * in LibreOffice/Windows Explorer was used.
	 *
	 * if a mailtoUrl is given:
	 *  * the other arguments will be ignored.
	 *  * confidential will be set to false
	 *
	 */
	async createMailEditor(
		filesUris: ReadonlyArray<string>,
		text: string,
		addresses: ReadonlyArray<string>,
		subject: string,
		mailToUrlString: string,
	): Promise<void> {
		const { fileApp, mailModel, logins } = await WebCommonNativeFacade.getInitializedLocator()
		const { newMailEditorFromTemplate, newMailtoUrlMailEditor } = await import("../../mail/editor/MailEditor.js")
		const signatureModule = await import("../../mail/signature/Signature")
		await logins.waitForPartialLogin()
		const mailboxDetails = await mailModel.getUserMailboxDetails()
		let editor

		try {
			if (mailToUrlString) {
				editor = await newMailtoUrlMailEditor(mailToUrlString, false, mailboxDetails).catch(ofClass(CancelledError, noOp))
				if (!editor) return
			} else {
				const files = await fileApp.getFilesMetaData(filesUris)
				const address = (addresses && addresses[0]) || ""
				const recipients = address
					? {
							to: [
								{
									name: "",
									address: address,
								},
							],
					  }
					: {}
				editor = await newMailEditorFromTemplate(
					mailboxDetails,
					recipients,
					subject || (files.length > 0 ? files[0].name : ""),
					signatureModule.appendEmailSignature(text || "", logins.getUserController().props),
					files,
					undefined,
					undefined,
					true, // we want emails created in this method to always default to saving changes
				)
			}

			editor.show()
		} catch (e) {
			if (e instanceof UserError) {
				// noinspection ES6MissingAwait
				Dialog.message(() => e.message)
			}
			throw e
		}
	}

	async invalidateAlarms(): Promise<void> {
		const locator = await WebCommonNativeFacade.getInitializedLocator()
		await locator.pushService.reRegister()
	}

	async openCalendar(userId: string): Promise<void> {
		const { openCalendar } = await import("./OpenMailboxHandler.js")
		return openCalendar(userId)
	}

	async openMailBox(userId: string, address: string, requestedPath: string | null): Promise<void> {
		const { openMailbox } = await import("./OpenMailboxHandler.js")
		return openMailbox(userId, address, requestedPath)
	}

	async showAlertDialog(translationKey: string): Promise<void> {
		const { Dialog } = await import("../../gui/base/Dialog.js")
		return Dialog.message(translationKey as TranslationKey)
	}

	async updateTheme(): Promise<void> {
		await themeController.reloadTheme()
	}

	/**
	 * largely modeled after ChangePasswordOkAction, except that we're never changing the password with it and
	 * don't support bcrypt for this one.
	 */
	async promptForNewPassword(title: string, oldPassword: string | null): Promise<string> {
		const [{ Dialog }, { PasswordForm, PasswordModel }] = await Promise.all([import("../../gui/base/Dialog.js"), import("../../settings/PasswordForm.js")])
		const locator = await WebCommonNativeFacade.getInitializedLocator()
		const model = new PasswordModel(locator.usageTestController, locator.logins, { checkOldPassword: false, enforceStrength: false })

		return new Promise((resolve, reject) => {
			const changePasswordOkAction = async (dialog: Dialog) => {
				const error = model.getErrorMessageId()

				if (error) {
					Dialog.message(error)
				} else {
					resolve(model.getNewPassword())
					dialog.close()
				}
			}

			Dialog.showActionDialog({
				title: () => title,
				child: () => m(PasswordForm, { model }),
				validator: () => model.getErrorMessageId(),
				okAction: changePasswordOkAction,
				cancelAction: () => reject(new CancelledError("user cancelled operation")),
				allowCancel: true,
			})
		})
	}

	async promptForPassword(title: string): Promise<string> {
		const { Dialog } = await import("../../gui/base/Dialog.js")

		return new Promise((resolve, reject) => {
			const dialog = Dialog.showRequestPasswordDialog({
				title,
				action: async (pw) => {
					resolve(pw)
					dialog.close()
					return ""
				},
				cancel: {
					textId: "cancel_action",
					action: () => reject(new CancelledError("user cancelled operation")),
				},
			})
		})
	}

	private static async getInitializedLocator(): Promise<IMainLocator> {
		const { locator } = await import("../../api/main/MainLocator")
		await locator.initialized
		return locator
	}
}
