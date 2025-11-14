import type { LoggedInEvent, PostLoginAction } from "../../../common/api/main/LoginController"
import type { AutosaveFacade, LocalAutosavedDraftData } from "../../../common/api/worker/facades/lazy/AutosaveFacade"
import type { MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import type { Dialog } from "../../../common/gui/base/Dialog"
import type { MailViewerViewModel } from "../view/MailViewerViewModel"
import type { EntityClient } from "../../../common/api/common/EntityClient"
import { MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { isOfflineError } from "../../../common/api/common/utils/ErrorUtils"
import type { CreateMailViewerOptions } from "../view/MailViewer"
import m from "mithril"
import { SessionType } from "../../../common/api/common/SessionType"

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
