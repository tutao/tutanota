import o from "@tutao/otest"
import { ConversationItem, ConversationPrefProvider, ConversationViewModel } from "../../../../src/mail-app/mail/view/ConversationViewModel.js"
import { ClientModelInfo, entityUpdateUtils, isSameId, tutanotaTypeRefs } from "@tutao/typerefs"
import { CreateMailViewerOptions } from "../../../../src/mail-app/mail/view/MailViewer.js"
import { MailViewerViewModel } from "../../../../src/mail-app/mail/view/MailViewerViewModel.js"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { EntityRestClientMock } from "../../api/worker/rest/EntityRestClientMock.js"
import { EventController } from "../../../../src/common/api/main/EventController.js"
import { defer, DeferredObject, delay, isSameTypeRef, noOp } from "@tutao/utils"
import { matchers, object, when } from "testdouble"
import { createTestEntity } from "../../TestUtils.js"
import { MailboxDetail, MailboxModel } from "../../../../src/common/mailFunctionality/MailboxModel.js"
import { MailModel } from "../../../../src/mail-app/mail/model/MailModel.js"

import { noPatchesAndInstance } from "../../api/worker/EventBusClientTest"
import { MailSetKind, MailState, OperationType } from "../../../../src/app-env"

o.spec("ConversationViewModel", function () {
	let conversation: tutanotaTypeRefs.ConversationEntry[]

	let primaryMail: tutanotaTypeRefs.Mail
	let anotherMail: tutanotaTypeRefs.Mail

	let viewModel: ConversationViewModel
	let mailModel: MailModel
	let mailboxModel: MailboxModel
	let mailboxDetail: MailboxDetail
	let entityRestClientMock: EntityRestClientMock
	let prefProvider: ConversationPrefProvider
	let redraw: () => unknown
	let loadingDefer: DeferredObject<void>
	let eventCallback: entityUpdateUtils.EntityEventsListener
	let canUseConversationView: boolean

	const listId = "listId"

	const viewModelFactory = async (): Promise<
		(options: CreateMailViewerOptions, mailboxDetails: MailboxDetail, mailboxProperties: tutanotaTypeRefs.MailboxProperties) => MailViewerViewModel
	> => {
		return ({ mail, showFolder }) => {
			const viewModelObject = object<MailViewerViewModel>()
			// @ts-ignore
			viewModelObject.mail = mail
			return viewModelObject
		}
	}

	async function makeViewModel(pMail: tutanotaTypeRefs.Mail): Promise<void> {
		const factory = await viewModelFactory()
		const mailboxProperties = createTestEntity(tutanotaTypeRefs.MailboxPropertiesTypeRef)
		const entityClient = new EntityClient(entityRestClientMock, ClientModelInfo.getNewInstanceForTestsOnly())

		const eventController: EventController = {
			addEntityListener: (listener) => {
				eventCallback = listener
			},
			removeEntityListener: noOp,
		} as Partial<EventController> as EventController

		const viewModelParams = {
			mail: pMail,
			showFolder: false,
			loadLatestMail: false,
			delayBodyRenderingUntil: Promise.resolve(),
		}

		viewModel = new ConversationViewModel(
			viewModelParams,
			(options) => factory(options, mailboxDetail, mailboxProperties),
			entityClient,
			eventController,
			prefProvider,
			mailModel,
			redraw,
		)
	}

	const addMail = (mailId: string): tutanotaTypeRefs.Mail => {
		const conversationId = "conversation" + mailId
		const newMail = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
			_id: [listId, mailId],
			conversationEntry: [listId, conversationId],
			state: MailState.RECEIVED,
		})
		const mailConversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
			_id: [listId, conversationId],
			mail: newMail._id,
			previous: primaryMail?._id,
		})

		entityRestClientMock.addListInstances(newMail)
		entityRestClientMock.addListInstances(mailConversationEntry)
		conversation.push(mailConversationEntry)

		return newMail
	}

	const sameAsConversation = (mailsDisplayed: ConversationItem[]) => {
		for (let i = 0; i < mailsDisplayed.length; i++) {
			if (!isSameId(mailsDisplayed[i].entryId, conversation[i]._id)) {
				return false
			}
		}
		return true
	}

	o.beforeEach(async function () {
		conversation = []

		mailboxDetail = object()
		mailModel = object()

		// by default this should be true, as having it false is an exceptional case (secure external recipients)
		canUseConversationView = true
		when(mailModel.canUseConversationView()).thenDo(() => {
			return canUseConversationView
		})

		entityRestClientMock = new EntityRestClientMock()

		prefProvider = object()

		loadingDefer = defer()
		redraw = async () => {
			// defer to the end of the event loop so that viewModel has correct loading state
			await delay(1)
			if (viewModel.isFinished()) {
				loadingDefer.resolve()
			}
		}

		primaryMail = addMail("mailId")
		anotherMail = addMail("anotherMail")

		await makeViewModel(primaryMail)
	})

	o.spec("Correct amount of mails are shown", function () {
		o.test("shows all mails in conversation by default", async function () {
			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef)).length
			o.check(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})

		o.test("when option is on but conversation view is not allowed only show selected mail", async function () {
			canUseConversationView = false
			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef)).length
			o.check(numMailsDisplayed).equals(1)(`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be 1`)
		})

		o.test("when the option is off it only shows selected mail", async function () {
			when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(true)

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef)).length
			o.check(numMailsDisplayed).equals(1)(`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be 1`)
		})
	})

	o.spec("Drafts in Conversation View", function () {
		o.test("Should be in conversation", async function () {
			const draftMail = addMail("draftMail")
			draftMail.state = MailState.DRAFT

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef)).length
			o.check(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})

		o.test("when draft is in trash folder, it should not be included in the conversation", async function () {
			// add draft mail
			const trashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT
			trashDraftMail.mailDetailsDraft = ["listId", "elementId"]

			const trash = createTestEntity(tutanotaTypeRefs.MailSetTypeRef, {
				_id: [listId, "trashFolder"],
				folderType: MailSetKind.TRASH,
			})
			entityRestClientMock.addListInstances(trash)

			when(mailModel.getMailboxDetailsForMail(matchers.anything())).thenResolve(mailboxDetail)
			when(mailModel.getMailFolderForMail(trashDraftMail)).thenReturn(trash)

			conversation.pop() // since this mail shouldn't actually be a part of the conversation

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const mailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef))
			o.check(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => ci.entryId)}, should be ${conversation.map((ce) => ce._id)}`,
			)
		})

		o.test("when draft is in trash folder but is the primary mail, it should be included in the conversation", async function () {
			// add draft mail
			const trashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT
			trashDraftMail.mailDetailsDraft = ["listId", "elementId"]

			const trash = createTestEntity(tutanotaTypeRefs.MailSetTypeRef, {
				_id: [listId, "trashFolder"],
				folderType: MailSetKind.TRASH,
			})
			entityRestClientMock.addListInstances(trash)

			when(mailModel.getMailboxDetailsForMail(trashDraftMail)).thenResolve(mailboxDetail)
			when(mailModel.getMailFolderForMail(trashDraftMail)).thenReturn(trash)

			await makeViewModel(trashDraftMail)

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const mailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef))
			o.check(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => ci.entryId)}, should be ${conversation.map((ce) => ce._id)}`,
			)
		})
	})

	o.spec("Entity Updates", function () {
		o.test("when a new mail comes in, it is added to conversation", async function () {
			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const yetAnotherMail = addMail("yetAnotherMailId")

			await eventCallback.onEntityUpdatesReceived(
				[
					{
						typeRef: tutanotaTypeRefs.ConversationEntryTypeRef,
						operation: OperationType.CREATE,
						instanceListId: listId,
						instanceId: yetAnotherMail.conversationEntry[1],
						...noPatchesAndInstance,
					},
				],
				"mailGroupId",
				true,
			)

			const mailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef))
			o.check(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => `[${ci.entryId[0]}, ${ci.entryId[1]}]`).join(", ")}, should be ${conversation
					.map((ce) => `[${ce._id[0]}, ${ce._id[1]}]`)
					.join(", ")}`,
			)
		})

		o.test("when a mail gets deleted, it is removed from conversation", async function () {
			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			conversation.pop() // "deleting" the mail
			const mailConversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
				_id: anotherMail.conversationEntry,
				mail: anotherMail._id,
				previous: primaryMail?._id,
			})
			await entityRestClientMock.erase(mailConversationEntry)
			const deletedmailConversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
				_id: anotherMail.conversationEntry,
				previous: primaryMail?._id,
			})
			entityRestClientMock.addListInstances(deletedmailConversationEntry)

			await eventCallback.onEntityUpdatesReceived(
				[
					{
						typeRef: tutanotaTypeRefs.ConversationEntryTypeRef,
						operation: OperationType.UPDATE,
						instanceListId: listId,
						instanceId: anotherMail.conversationEntry[1],
						...noPatchesAndInstance,
					},
				],
				"mailGroupId",
				true,
			)

			const mailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef))
			o.check(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => ci.entryId)}, should be ${conversation.map((ce) => ce._id)}`,
			)
		})

		o.test("when conversation mode is turned off and a new mail comes in, nothing added to conversation", async function () {
			when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(true)

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const yetAnotherMail = addMail("yetAnotherMailId")

			await eventCallback.onEntityUpdatesReceived(
				[
					{
						typeRef: tutanotaTypeRefs.ConversationEntryTypeRef,
						operation: OperationType.CREATE,
						instanceListId: listId,
						instanceId: yetAnotherMail.conversationEntry[1],
						...noPatchesAndInstance,
					},
				],
				"mailGroupId",
				true,
			)

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef)).length
			o.check(numMailsDisplayed).equals(1)(`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be 1`)
		})

		o.test("when conversation mode is disabled and a new mail comes in, nothing added to conversation", async function () {
			canUseConversationView = false

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const yetAnotherMail = addMail("yetAnotherMailId")

			await eventCallback.onEntityUpdatesReceived(
				[
					{
						typeRef: tutanotaTypeRefs.ConversationEntryTypeRef,
						operation: OperationType.CREATE,
						instanceListId: listId,
						instanceId: yetAnotherMail.conversationEntry[1],
						...noPatchesAndInstance,
					},
				],
				"mailGroupId",
				true,
			)

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef)).length
			o.check(numMailsDisplayed).equals(1)(`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be 1`)
		})

		o.test("when a draft in trash, it is removed from the conversation on update", async function () {
			// add draft mail
			const trashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT
			trashDraftMail.mailDetailsDraft = ["listId", "elementId"]

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			conversation.pop()
			const trash = createTestEntity(tutanotaTypeRefs.MailSetTypeRef, {
				_id: ["folderListId", "trashFolder"],
				folderType: MailSetKind.TRASH,
			})
			entityRestClientMock.addListInstances(trash)
			// adding new mail (is the same mail, just moved to trash)
			const newTrashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT
			newTrashDraftMail.mailDetailsDraft = ["listId", "elementId"]
			newTrashDraftMail._id = ["newListId", trashDraftMail._id[1]]
			conversation.pop()

			when(mailModel.getMailboxDetailsForMail(matchers.anything())).thenResolve(mailboxDetail)
			when(mailModel.getMailFolderForMail(newTrashDraftMail)).thenReturn(trash)

			await eventCallback.onEntityUpdatesReceived(
				[
					{
						typeRef: tutanotaTypeRefs.ConversationEntryTypeRef,
						operation: OperationType.UPDATE,
						instanceListId: listId,
						instanceId: trashDraftMail.conversationEntry[1],
						...noPatchesAndInstance,
					},
				],
				"mailGroupId",
				true,
			)

			const mailsDisplayed = viewModel.conversationItems().filter((i) => isSameTypeRef(i.type_ref, tutanotaTypeRefs.MailTypeRef))
			o.check(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => ci.entryId)}, should be ${conversation.map((ce) => ce._id)}`,
			)
		})
	})
})
