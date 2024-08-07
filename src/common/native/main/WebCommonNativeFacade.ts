import { CommonNativeFacade } from "../common/generatedipc/CommonNativeFacade.js"
import { TranslationKey } from "../../misc/LanguageViewModel.js"
import { lazyAsync, noOp, ofClass } from "@tutao/tutanota-utils"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { UserError } from "../../api/main/UserError.js"
import m from "mithril"
import { Dialog } from "../../gui/base/Dialog.js"
import { AttachmentType, getAttachmentType } from "../../gui/AttachmentBubble.js"
import { showRequestPasswordDialog } from "../../misc/passwords/PasswordRequestDialog.js"
import { LoginController } from "../../api/main/LoginController.js"
import { MailboxModel } from "../../mailFunctionality/MailboxModel.js"
import { UsageTestController } from "@tutao/tutanota-usagetests"
import { NativeFileApp } from "../common/FileApp.js"
import { NativePushServiceApp } from "./NativePushServiceApp.js"
import { locator } from "../../api/main/CommonLocator.js"
import { AppType } from "../../misc/ClientConstants.js"

export class WebCommonNativeFacade implements CommonNativeFacade {
	constructor(
		private readonly logins: LoginController,
		private readonly mailboxModel: MailboxModel,
		private readonly usageTestController: UsageTestController,
		private readonly fileApp: lazyAsync<NativeFileApp>,
		private readonly pushService: lazyAsync<NativePushServiceApp>,
		private readonly fileImportHandler: (filesUris: ReadonlyArray<string>) => unknown,
		readonly openMailBox: (userId: string, address: string, requestedPath: string | null) => Promise<void>,
		readonly openCalendar: (userId: string) => Promise<void>,
		private readonly appType: AppType,
	) {}

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
		const { newMailEditorFromTemplate, newMailtoUrlMailEditor } = await import("../../../mail-app/mail/editor/MailEditor.js")
		const signatureModule = await import("../../../mail-app/mail/signature/Signature")
		await this.logins.waitForPartialLogin()
		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails()
		let editor

		try {
			if (mailToUrlString) {
				editor = await newMailtoUrlMailEditor(mailToUrlString, false, mailboxDetails).catch(ofClass(CancelledError, noOp))
				if (!editor) return

				editor.show()
			} else {
				const fileApp = await this.fileApp()
				const files = await fileApp.getFilesMetaData(filesUris)
				const allFilesAreVCards = files.length > 0 && files.every((file) => getAttachmentType(file.mimeType) === AttachmentType.CONTACT)
				const allFilesAreICS = files.length > 0 && files.every((file) => getAttachmentType(file.mimeType) === AttachmentType.CALENDAR)

				if (this.appType === AppType.Calendar) {
					if (!allFilesAreICS) {
						return Dialog.message("invalidCalendarFile_msg")
					}

					return this.handleFileImport(filesUris)
				}

				let willImport = false
				if (allFilesAreVCards) {
					willImport = await Dialog.choice("vcardInSharingFiles_msg", [
						{
							text: "import_action",
							value: true,
						},
						{ text: "attachFiles_action", value: false },
					])
				} else if (allFilesAreICS) {
					willImport = await Dialog.choice("icsInSharingFiles_msg", [
						{
							text: "import_action",
							value: true,
						},
						{ text: "attachFiles_action", value: false },
					])
				}

				if (willImport) {
					await this.handleFileImport(filesUris)
				} else {
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
						signatureModule.appendEmailSignature(text || "", this.logins.getUserController().props),
						files,
						undefined,
						undefined,
						true, // we want emails created in this method to always default to saving changes
					)

					editor.show()
				}
			}
		} catch (e) {
			if (e instanceof UserError) {
				// noinspection ES6MissingAwait
				Dialog.message(() => e.message)
			}
			throw e
		}
	}

	async invalidateAlarms(): Promise<void> {
		const pushService = await this.pushService()
		await pushService.reRegister()
	}

	async showAlertDialog(translationKey: string): Promise<void> {
		const { Dialog } = await import("../../gui/base/Dialog.js")
		return Dialog.message(translationKey as TranslationKey)
	}

	async updateTheme(): Promise<void> {
		await locator.themeController.reloadTheme()
	}

	/**
	 * largely modeled after ChangePasswordOkAction, except that we're never changing the password with it and
	 * don't support bcrypt for this one.
	 */
	async promptForNewPassword(title: string, oldPassword: string | null): Promise<string> {
		const [{ Dialog }, { PasswordForm, PasswordModel }] = await Promise.all([import("../../gui/base/Dialog.js"), import("../../settings/PasswordForm.js")])
		const model = new PasswordModel(this.usageTestController, this.logins, { checkOldPassword: false, enforceStrength: false })

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
			const dialog = showRequestPasswordDialog({
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

	/**
	 * Parse and handle files given a list of files URI.
	 * @param filesUris List of files URI to be parsed
	 */
	async handleFileImport(filesUris: ReadonlyArray<string>): Promise<void> {
		// Since we might be handling calendar files, we must wait for full login
		await this.logins.waitForFullLogin()
		await this.fileImportHandler(filesUris)
	}
}
