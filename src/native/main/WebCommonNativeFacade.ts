import { CommonNativeFacade } from "../common/generatedipc/CommonNativeFacade.js"
import { IMainLocator } from "../../api/main/MainLocator.js"
import { TranslationKey } from "../../misc/LanguageViewModel.js"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { CancelledError } from "../../api/common/error/CancelledError.js"
import { Dialog } from "../../gui/base/Dialog.js"
import { UserError } from "../../api/main/UserError.js"

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
		await locator.pushService.invalidateAlarms()
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

	private static async getInitializedLocator(): Promise<IMainLocator> {
		const { locator } = await import("../../api/main/MainLocator")
		await locator.initialized
		return locator
	}
}
