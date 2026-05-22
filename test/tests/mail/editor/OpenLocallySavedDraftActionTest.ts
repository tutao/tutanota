import o from "@tutao/otest"
import { OpenDraftFunctions, OpenLocallySavedDraftAction } from "../../../../src/applications/mail-app/mail/editor/OpenLocallySavedDraftAction"
import { matchers, object, verify, when } from "testdouble"
import { MailboxModel } from "../../../../src/applications/common/mailFunctionality/MailboxModel"
import { EntityClient } from "../../../../src/platform-kits/network/EntityClient"
import { MailViewerViewModel } from "../../../../src/applications/mail-app/mail/view/MailViewerViewModel"

import { CreateMailViewerOptions } from "../../../../src/applications/mail-app/mail/view/MailViewer"
import type { Dialog } from "../../../../src/ui/base/Dialog"
import { AutosaveFacade, LocalAutosavedDraftData } from "../../../../src/applications/common/api/worker/facades/lazy/AutosaveFacade"
import { Mail, MailTypeRef } from "@tutao/entities/tutanota"
import { createTestEntity } from "../../TestUtils.js"
import { MailState } from "../../../../src/entities/tutanota/Utils"

o.spec("OpenLocallySavedDraftAction", () => {
	let action: OpenLocallySavedDraftAction

	let mail: Mail
	let autosaveFacade: AutosaveFacade
	let mailboxModel: MailboxModel
	let entityClient: EntityClient
	let openDraftFunctions: OpenDraftFunctions
	let mailViewerViewModel: MailViewerViewModel

	o.beforeEach(() => {
		autosaveFacade = object()
		mail = createTestEntity(MailTypeRef, {
			_id: ["mail list", "mail id"],
			state: MailState.DRAFT,
			mailDetailsDraft: ["listId", "elementId"],
		})
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

		action = new OpenLocallySavedDraftAction(autosaveFacade, mailboxModel, entityClient, openDraftFunctions)
	})

	o.test("no draft saved", async () => {
		when(autosaveFacade.getAutosavedDraftData()).thenResolve(null)
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

		when(autosaveFacade.getAutosavedDraftData()).thenResolve(draftData)
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
		when(autosaveFacade.getAutosavedDraftData()).thenResolve(draftData)
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
		when(autosaveFacade.getAutosavedDraftData()).thenResolve(draftData)
		await action._loadAutosavedDraft()

		verify(openDraftFunctions.mailViewerViewModelFactory())
		verify(openDraftFunctions.createEditDraftDialog(mailViewerViewModel, draftData))

		// no further interactions
		verify(openDraftFunctions.newMailEditorFromLocalDraftData(matchers.anything(), matchers.anything()), { times: 0 })
	})

	o.spec("locally saved draft with set mail id but mail is no longer editable draft", () => {
		o.test("draft is already sent", async () => {
			const draftQueuedForSend = createTestEntity(MailTypeRef, {
				_id: ["mail list", "mail id"],
				state: MailState.SENDING,
				mailDetails: ["listId", "elementId"],
			})
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

			when(autosaveFacade.getAutosavedDraftData()).thenResolve(draftData)
			when(entityClient.load(MailTypeRef, draftData.mailId!)).thenResolve(draftQueuedForSend)
			await action._loadAutosavedDraft()

			verify(autosaveFacade.clearAutosavedDraftData())
			// no further interactions
			verify(openDraftFunctions.newMailEditorFromLocalDraftData(matchers.anything(), matchers.anything()), { times: 0 })
			verify(openDraftFunctions.mailViewerViewModelFactory(), { times: 0 })
			verify(openDraftFunctions.createEditDraftDialog(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("draft is queued to be sent", async () => {
			const draftQueuedForSend = createTestEntity(MailTypeRef, {
				_id: ["mail list", "mail id"],
				state: MailState.SENDING,
				mailDetailsDraft: ["listId", "elementId"],
			})
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

			when(autosaveFacade.getAutosavedDraftData()).thenResolve(draftData)
			when(entityClient.load(MailTypeRef, draftData.mailId!)).thenResolve(draftQueuedForSend)
			await action._loadAutosavedDraft()

			verify(autosaveFacade.clearAutosavedDraftData())
			// no further interactions
			verify(openDraftFunctions.newMailEditorFromLocalDraftData(matchers.anything(), matchers.anything()), { times: 0 })
			verify(openDraftFunctions.mailViewerViewModelFactory(), { times: 0 })
			verify(openDraftFunctions.createEditDraftDialog(matchers.anything(), matchers.anything()), { times: 0 })
		})

		o.test("draft is scheduled to be sent later", async () => {
			const draftQueuedForSend = createTestEntity(MailTypeRef, {
				_id: ["mail list", "mail id"],
				state: MailState.DRAFT,
				mailDetailsDraft: ["listId", "elementId"],
				sendAt: new Date(2026, 1, 1),
			})
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

			when(autosaveFacade.getAutosavedDraftData()).thenResolve(draftData)
			when(entityClient.load(MailTypeRef, draftData.mailId!)).thenResolve(draftQueuedForSend)
			await action._loadAutosavedDraft()

			verify(autosaveFacade.clearAutosavedDraftData())
			// no further interactions
			verify(openDraftFunctions.newMailEditorFromLocalDraftData(matchers.anything(), matchers.anything()), { times: 0 })
			verify(openDraftFunctions.mailViewerViewModelFactory(), { times: 0 })
			verify(openDraftFunctions.createEditDraftDialog(matchers.anything(), matchers.anything()), { times: 0 })
		})
	})
})
