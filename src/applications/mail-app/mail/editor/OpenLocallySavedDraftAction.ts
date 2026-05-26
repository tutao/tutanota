import type { AutosaveFacade, LocalAutosavedDraftData } from "../../../common/api/worker/facades/lazy/AutosaveFacade"
import type { MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import type { Dialog } from "../../../../ui/base/Dialog"
import type { MailViewerViewModel } from "../view/MailViewerViewModel"
import type { EntityClient } from "../../../../platform-kits/network/EntityClient"
import type { CreateMailViewerOptions } from "../view/MailViewer"
import m from "mithril"
import { SessionType } from "../../../../platform-kits/app-env"
import { LoggedInEvent, PostLoginAction } from "../../../../app-kits/native-bridge/common/PostLoginAction.js"

import { isEditableDraft } from "../model/MailChecks"
import { isOfflineError } from "../../../../platform-kits/rest-client/error"
import { MailTypeRef } from "@tutao/entities/tutanota"

export interface OpenDraftFunctions {
	newMailEditorFromLocalDraftData(mailboxModel: MailboxModel, draft: LocalAutosavedDraftData): Promise<Dialog | null>

	createEditDraftDialog(mailViewerViewModel: MailViewerViewModel, draft: LocalAutosavedDraftData): Promise<Dialog | null>

	mailViewerViewModelFactory(): Promise<(options: CreateMailViewerOptions) => MailViewerViewModel>
}

/**
 * Opens the locally saved draft as a minimized draft on login.
 */
export class OpenLocallySavedDraftAction implements PostLoginAction {
	constructor(
		private readonly autosaveFacade: AutosaveFacade,
		private readonly mailboxModel: MailboxModel,
		private readonly entityClient: EntityClient,
		private readonly openDraftFunctions: OpenDraftFunctions,
	) {}

	async onFullLoginSuccess(_: LoggedInEvent): Promise<void> {}

	async onPartialLoginSuccess({ sessionType }: LoggedInEvent): Promise<void> {
		if (sessionType === SessionType.Persistent) {
			// fire and forget; this might take some time
			this._loadAutosavedDraft()
		}
	}

	/**
	 * visible for testing
	 */
	async _loadAutosavedDraft(): Promise<void> {
		const draft = await this.autosaveFacade.getAutosavedDraftData()
		if (draft == null) {
			return
		}

		let dialog: Dialog | null
		if (draft.mailId == null) {
			// mail has never been saved before
			dialog = await this.openDraftFunctions.newMailEditorFromLocalDraftData(this.mailboxModel, draft)
		} else {
			// mail has been saved, but we need to override it with our locally saved contents
			let mailViewerViewModel: MailViewerViewModel
			try {
				const mail = await this.entityClient.load(MailTypeRef, draft.mailId)
				if (!isEditableDraft(mail)) {
					// mail might have been already sent or scheduled from another client
					await this.autosaveFacade.clearAutosavedDraftData()
					return
				}
				const factory = await this.openDraftFunctions.mailViewerViewModelFactory()
				mailViewerViewModel = factory({
					mail,
					showFolder: false,
					loadLatestMail: false,
				})
				dialog = await this.openDraftFunctions.createEditDraftDialog(mailViewerViewModel, draft)
			} catch (e) {
				if (isOfflineError(e)) {
					return
				}
				throw e
			}
		}

		dialog?.show()
		m.redraw()
	}
}
