import { CommonNativeFacade } from "../common/generatedipc/CommonNativeFacade.js"
import { TranslationKey, TranslationText } from "../../misc/LanguageViewModel.js"
import { decodeBase64, lazyAsync, noOp, ofClass } from "@tutao/tutanota-utils"
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
import { ContactTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { isDesktop } from "../../api/common/Env"
import { HighestTierPlans } from "../../api/common/TutanotaConstants.js"

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
		readonly openSettings: (path: string) => Promise<void>,
	) {}

	async openContactEditor(contactId: string): Promise<void> {
		await this.logins.waitForFullLogin()
		const { ContactEditor } = await import("../../../mail-app/contacts/ContactEditor.js")
		const decodedContactId = decodeBase64("utf-8", contactId)
		const idParts = decodedContactId.split("/")
		try {
			const contact = await locator.entityClient.load(ContactTypeRef, [idParts[0], idParts[1]])
			const editor = new ContactEditor(locator.entityClient, contact)

			return editor.show()
		} catch (err) {
			console.error(err)
			return Dialog.message("contactNotFound_msg")
		}
	}

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
				const allFilesAreMail = files.length > 0 && files.every((file) => getAttachmentType(file.mimeType) === AttachmentType.MAIL)

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
				} else if (isDesktop() && allFilesAreMail) {
					// importing mails is currently only allowed on plan LEGEND and UNLIMITED
					const currentPlanType = await locator.logins.getUserController().getPlanType()
					const isHighestTierPlan = HighestTierPlans.includes(currentPlanType)

					let importAction: { text: TranslationText; value: boolean } = {
						text: "import_action",
						value: true,
					}
					let attachFilesAction: { text: TranslationText; value: boolean } = {
						text: "attachFiles_action",
						value: false,
					}
					willImport = isHighestTierPlan && (await Dialog.choice("emlOrMboxInSharingFiles_msg", [importAction, attachFilesAction]))
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
		const model = new PasswordModel(this.usageTestController, this.logins, {
			checkOldPassword: false,
			enforceStrength: false,
		})

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
