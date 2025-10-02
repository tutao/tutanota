import o from "@tutao/otest"
import { OpenDraftFunctions, OpenLocallySavedDraftAction } from "../../../../src/mail-app/mail/editor/OpenLocallySavedDraftAction"
import { matchers, object, verify, when } from "testdouble"
import { MailboxModel } from "../../../../src/common/mailFunctionality/MailboxModel"
import { EntityClient } from "../../../../src/common/api/common/EntityClient"
import { MailViewerViewModel } from "../../../../src/mail-app/mail/view/MailViewerViewModel"
import { Mail, MailTypeRef } from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { CreateMailViewerOptions } from "../../../../src/mail-app/mail/view/MailViewer"
import type { Dialog } from "../../../../src/common/gui/base/Dialog"
import { AutosaveFacade, LocalAutosavedDraftData } from "../../../../src/common/api/worker/facades/lazy/AutosaveFacade"

o.spec("OpenLocallySavedDraftAction", () => {
	let action: OpenLocallySavedDraftAction

	let mail: Mail
	let db: AutosaveFacade
	let mailboxModel: MailboxModel
	let entityClient: EntityClient
	let openDraftFunctions: OpenDraftFunctions
	let mailViewerViewModel: MailViewerViewModel

	o.beforeEach(() => {
		db = object()
		mail = object()
		mailboxModel = object()
		openDraftFunctions = object()
		entityClient = object()
		mailViewerViewModel = object()

		when(openDraftFunctions.mailViewerViewModelFactory()).thenResolve((options: CreateMailViewerOptions) => {
			o.check(options.showFolder).equals(false)
			o.check(options.loadLatestMail).equals(false)
			o.check(options.mail).equals(mail)
			return mailViewerViewModel
		})

		action = new OpenLocallySavedDraftAction(db, mailboxModel, entityClient, openDraftFunctions)
	})

	o.test("no draft saved", async () => {
		when(db.getAutosavedDraftData()).thenResolve(null)
		await action._loadAutosavedDraft()

		verify(openDraftFunctions.newMailEditorFromLocalDraftData(matchers.anything(), matchers.anything()), { times: 0 })
		verify(openDraftFunctions.createEditDraftDialog(matchers.anything(), matchers.anything()), { times: 0 })
		verify(openDraftFunctions.mailViewerViewModelFactory(), { times: 0 })
	})

	o.test("draft with unset mail id", async () => {
		const draftData: LocalAutosavedDraftData = {
			locallySavedTime: 1,

			mailId: null,
			mailGroupId: "some mail group id",

			subject: "my email",
			body: "hey",
			confidential: true,

			editedTime: 0,
			lastUpdatedTime: 0,

			senderAddress: "sender@tuta.com",
			to: [],
			cc: [],
			bcc: [],
		} satisfies LocalAutosavedDraftData

		when(db.getAutosavedDraftData()).thenResolve(draftData)
		await action._loadAutosavedDraft()

		verify(openDraftFunctions.newMailEditorFromLocalDraftData(mailboxModel, draftData))

		// no further interactions
		verify(openDraftFunctions.createEditDraftDialog(matchers.anything(), matchers.anything()), { times: 0 })
		verify(openDraftFunctions.mailViewerViewModelFactory(), { times: 0 })
	})

	o.test("draft with set mail id but no draft is opened", async () => {
		const draftData: LocalAutosavedDraftData = {
			locallySavedTime: 1,

			mailId: ["mail list", "mail id"],
			mailGroupId: "some mail group id",

			subject: "my email",
			body: "hey",
			confidential: true,

			editedTime: 0,
			lastUpdatedTime: 0,

			senderAddress: "sender@tuta.com",
			to: [],
			cc: [],
			bcc: [],
		} satisfies LocalAutosavedDraftData

		when(openDraftFunctions.createEditDraftDialog(mailViewerViewModel, draftData)).thenResolve(null)
		when(entityClient.load(MailTypeRef, draftData.mailId!)).thenResolve(mail)
		when(db.getAutosavedDraftData()).thenResolve(draftData)
		await action._loadAutosavedDraft()

		verify(openDraftFunctions.mailViewerViewModelFactory())
		verify(openDraftFunctions.createEditDraftDialog(mailViewerViewModel, draftData))

		// no further interactions
		verify(openDraftFunctions.newMailEditorFromLocalDraftData(matchers.anything(), matchers.anything()), { times: 0 })
	})

	o.test("draft with set mail id and draft is opened", async () => {
		const draftData: LocalAutosavedDraftData = {
			locallySavedTime: 1,

			mailId: ["mail list", "mail id"],
			mailGroupId: "some mail group id",

			subject: "my email",
			body: "hey",
			confidential: true,

			editedTime: 0,
			lastUpdatedTime: 0,

			senderAddress: "sender@tuta.com",
			to: [],
			cc: [],
			bcc: [],
		} satisfies LocalAutosavedDraftData

		const dialog: Dialog = object()
		when(openDraftFunctions.createEditDraftDialog(mailViewerViewModel, draftData)).thenResolve(dialog)
		when(entityClient.load(MailTypeRef, draftData.mailId!)).thenResolve(mail)
		when(db.getAutosavedDraftData()).thenResolve(draftData)
		await action._loadAutosavedDraft()

		verify(openDraftFunctions.mailViewerViewModelFactory())
		verify(openDraftFunctions.createEditDraftDialog(mailViewerViewModel, draftData))

		// no further interactions
		verify(openDraftFunctions.newMailEditorFromLocalDraftData(matchers.anything(), matchers.anything()), { times: 0 })
	})
})
