import o from "@tutao/otest"
import { ConversationItem, ConversationPrefProvider, ConversationViewModel } from "../../../../src/mail-app/mail/view/ConversationViewModel.js"
import {
	ConversationEntry,
	ConversationEntryTypeRef,
	Mail,
	MailboxProperties,
	MailboxPropertiesTypeRef,
	MailFolderTypeRef,
	MailTypeRef,
} from "../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { CreateMailViewerOptions } from "../../../../src/mail-app/mail/view/MailViewer.js"
import { MailViewerViewModel } from "../../../../src/mail-app/mail/view/MailViewerViewModel.js"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { EntityRestClientMock } from "../../api/worker/rest/EntityRestClientMock.js"
import { EntityEventsListener, EventController } from "../../../../src/common/api/main/EventController.js"
import { defer, DeferredObject, delay, noOp } from "@tutao/tutanota-utils"
import { matchers, object, when } from "testdouble"
import { MailSetKind, MailState, OperationType } from "../../../../src/common/api/common/TutanotaConstants.js"
import { isSameId } from "../../../../src/common/api/common/utils/EntityUtils.js"
import { createTestEntity } from "../../TestUtils.js"
import { MailboxDetail, MailboxModel } from "../../../../src/common/mailFunctionality/MailboxModel.js"
import { MailModel } from "../../../../src/mail-app/mail/model/MailModel.js"

o.spec("ConversationViewModel", function () {
	let conversation: ConversationEntry[]

	let primaryMail: Mail
	let anotherMail: Mail

	let viewModel: ConversationViewModel
	let mailModel: MailModel
	let mailboxModel: MailboxModel
	let mailboxDetail: MailboxDetail
	let entityRestClientMock: EntityRestClientMock
	let prefProvider: ConversationPrefProvider
	let redraw: () => unknown
	let loadingDefer: DeferredObject<void>
	let eventCallback: EntityEventsListener

	const listId = "listId"

	const viewModelFactory = async (): Promise<
		(options: CreateMailViewerOptions, mailboxDetails: MailboxDetail, mailboxProperties: MailboxProperties) => MailViewerViewModel
	> => {
		return ({ mail, showFolder }) => {
			const viewModelObject = object<MailViewerViewModel>()
			// @ts-ignore
			viewModelObject.mail = mail
			return viewModelObject
		}
	}

	async function makeViewModel(pMail: Mail): Promise<void> {
		const factory = await viewModelFactory()
		const mailboxProperties = createTestEntity(MailboxPropertiesTypeRef)
		const entityClient = new EntityClient(entityRestClientMock)

		const eventController: EventController = {
			addEntityListener: (listener) => {
				eventCallback = listener
			},
			removeEntityListener: noOp,
		} as Partial<EventController> as EventController

		const viewModelParams = {
			mail: pMail,
			showFolder: false,
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

	const addMail = (mailId: string): Mail => {
		const conversationId = "conversation" + mailId
		const newMail = createTestEntity(MailTypeRef, {
			_id: [listId, mailId],
			conversationEntry: [listId, conversationId],
			state: MailState.RECEIVED,
		})
		const mailConversationEntry = createTestEntity(ConversationEntryTypeRef, {
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
		o("shows all mails in conversation by default", async function () {
			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})

		o("when the option is off it only shows selected mail", async function () {
			when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(true)

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(1)(`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be 1`)
		})
	})

	o.spec("Drafts in Conversation View", function () {
		o("Should be in conversation", async function () {
			const draftMail = addMail("draftMail")
			draftMail.state = MailState.DRAFT

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})

		o("when draft is in trash folder, it should not be included in the conversation", async function () {
			// add draft mail
			const trashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT

			const trash = createTestEntity(MailFolderTypeRef, { _id: [listId, "trashFolder"], folderType: MailSetKind.TRASH })
			entityRestClientMock.addListInstances(trash)

			when(mailModel.getMailboxDetailsForMail(matchers.anything())).thenResolve(mailboxDetail)
			when(mailModel.getMailFolderForMail(trashDraftMail)).thenReturn(trash)

			conversation.pop() // since this mail shouldn't actually be a part of the conversation

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const mailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail")
			o(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => ci.entryId)}, should be ${conversation.map((ce) => ce._id)}`,
			)
		})

		o("when draft is in trash folder but is the primary mail, it should be included in the conversation", async function () {
			// add draft mail
			const trashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT

			const trash = createTestEntity(MailFolderTypeRef, { _id: [listId, "trashFolder"], folderType: MailSetKind.TRASH })
			entityRestClientMock.addListInstances(trash)

			when(mailModel.getMailboxDetailsForMail(trashDraftMail)).thenResolve(mailboxDetail)
			when(mailModel.getMailFolderForMail(trashDraftMail)).thenReturn(trash)

			await makeViewModel(trashDraftMail)

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const mailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail")
			o(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => ci.entryId)}, should be ${conversation.map((ce) => ce._id)}`,
			)
		})
	})

	o.spec("Entity Updates", function () {
		o("when a new mail comes in, it is added to conversation", async function () {
			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const yetAnotherMail = addMail("yetAnotherMailId")

			await eventCallback(
				[
					{
						application: "tutanota",
						type: "ConversationEntry",
						operation: OperationType.CREATE,
						instanceListId: listId,
						instanceId: yetAnotherMail.conversationEntry[1],
					},
				],
				"mailGroupId",
			)

			const mailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail")
			o(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => `[${ci.entryId[0]}, ${ci.entryId[1]}]`).join(", ")}, should be ${conversation
					.map((ce) => `[${ce._id[0]}, ${ce._id[1]}]`)
					.join(", ")}`,
			)
		})

		o("when a mail gets deleted, it is removed from conversation", async function () {
			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			conversation.pop() // "deleting" the mail
			const mailConversationEntry = createTestEntity(ConversationEntryTypeRef, {
				_id: anotherMail.conversationEntry,
				mail: anotherMail._id,
				previous: primaryMail?._id,
			})
			await entityRestClientMock.erase(mailConversationEntry)
			const deletedmailConversationEntry = createTestEntity(ConversationEntryTypeRef, {
				_id: anotherMail.conversationEntry,
				previous: primaryMail?._id,
			})
			entityRestClientMock.addListInstances(deletedmailConversationEntry)

			await eventCallback(
				[
					{
						application: "tutanota",
						type: "ConversationEntry",
						operation: OperationType.UPDATE,
						instanceListId: listId,
						instanceId: anotherMail.conversationEntry[1],
					},
				],
				"mailGroupId",
			)

			const mailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail")
			o(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => ci.entryId)}, should be ${conversation.map((ce) => ce._id)}`,
			)
		})

		o("when conversation mode is turned off and a new mail comes in, nothing added to conversation", async function () {
			when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(true)

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			const yetAnotherMail = addMail("yetAnotherMailId")

			await eventCallback(
				[
					{
						application: "tutanota",
						type: "ConversationEntry",
						operation: OperationType.CREATE,
						instanceListId: listId,
						instanceId: yetAnotherMail.conversationEntry[1],
					},
				],
				"mailGroupId",
			)

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(1)(`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be 1`)
		})

		o("when a draft in trash, it is removed from the conversation on update", async function () {
			// add draft mail
			const trashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT

			viewModel.init(Promise.resolve())
			await loadingDefer.promise

			conversation.pop()
			const trash = createTestEntity(MailFolderTypeRef, { _id: ["folderListId", "trashFolder"], folderType: MailSetKind.TRASH })
			entityRestClientMock.addListInstances(trash)
			// adding new mail (is the same mail, just moved to trash)
			const newTrashDraftMail = addMail("trashDraftMail")
			newTrashDraftMail.state = MailState.DRAFT
			newTrashDraftMail._id = ["newListId", trashDraftMail._id[1]]
			conversation.pop()

			when(mailModel.getMailboxDetailsForMail(matchers.anything())).thenResolve(mailboxDetail)
			when(mailModel.getMailFolderForMail(newTrashDraftMail)).thenReturn(trash)

			await eventCallback(
				[
					{
						application: "tutanota",
						type: "ConversationEntry",
						operation: OperationType.UPDATE,
						instanceListId: listId,
						instanceId: trashDraftMail.conversationEntry[1],
					},
				],
				"mailGroupId",
			)

			const mailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail")
			o(sameAsConversation(mailsDisplayed)).equals(true)(
				`Wrong mails in conversation, got ${mailsDisplayed.map((ci) => ci.entryId)}, should be ${conversation.map((ce) => ce._id)}`,
			)
		})
	})
})
