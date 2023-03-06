import o from "ospec"
import { ConversationPrefProvider, ConversationViewModel } from "../../../../src/mail/view/ConversationViewModel.js"
import {
	ConversationEntry,
	createConversationEntry,
	createMail,
	createMailBox,
	createMailboxGroupRoot,
	createMailboxProperties,
	createMailFolder,
	Mail,
	MailboxProperties,
} from "../../../../src/api/entities/tutanota/TypeRefs.js"
import { userId } from "../../calendar/CalendarTestUtils.js"
import { CreateMailViewerOptions } from "../../../../src/mail/view/MailViewer.js"
import { MailboxDetail, MailModel } from "../../../../src/mail/model/MailModel.js"
import { MailViewerViewModel } from "../../../../src/mail/view/MailViewerViewModel.js"
import { EntityClient } from "../../../../src/api/common/EntityClient.js"
import { EntityRestClientMock } from "../../api/worker/rest/EntityRestClientMock.js"
import { EntityEventsListener, EventController } from "../../../../src/api/main/EventController.js"
import { defer, DeferredObject, delay, downcast, noOp } from "@tutao/tutanota-utils"
import { matchers, object, when } from "testdouble"
import { MailFolderType, MailState, OperationType } from "../../../../src/api/common/TutanotaConstants.js"
import { FolderSystem } from "../../../../src/api/common/mail/FolderSystem.js"
import { createGroup, createGroupInfo } from "../../../../src/api/entities/sys/TypeRefs.js"

o.spec("ConversationViewModel", function () {
	let conversation: ConversationEntry[]

	let primaryMail: Mail
	let anotherMail: Mail

	let viewModel: ConversationViewModel
	let mailModel: MailModel
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
		return ({ mail, showFolder, delayBodyRenderingUntil }, mailboxDetails, mailboxProperties) => {
			const viewModelObject = object<MailViewerViewModel>()
			// @ts-ignore
			viewModelObject.mail = mail
			//when(viewModelObject.isCollapsed()).thenReturn(false)
			return viewModelObject
		}
	}

	function makeMailModel(mailBoxDetail: MailboxDetail): MailModel {
		return downcast({
			getMailboxDetailsForMail: o.spy(() => Promise.resolve(mailBoxDetail)),
			getMailFolder: o.spy(() => null),
		})
	}

	function makeMailboxDetail(): MailboxDetail {
		return {
			mailbox: createMailBox(),
			folders: new FolderSystem([]),
			mailGroupInfo: createGroupInfo(),
			mailGroup: createGroup({
				user: userId,
			}),
			mailboxGroupRoot: createMailboxGroupRoot(),
		}
	}

	async function makeViewModel(pMail: Mail): Promise<void> {
		let factory = await viewModelFactory()
		const mailboxProperties = createMailboxProperties()
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
		const newMail = createMail({
			_id: [listId, mailId],
			conversationEntry: [listId, conversationId],
			state: MailState.RECEIVED,
		})
		const mailConversationEntry = createConversationEntry({
			_id: [listId, conversationId],
			mail: newMail._id,
			previous: primaryMail?._id,
		})

		entityRestClientMock.addListInstances(newMail)
		entityRestClientMock.addListInstances(mailConversationEntry)
		conversation.push(mailConversationEntry)

		return newMail
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
			console.log("redraw", "finished", viewModel.isFinished(), "offline", viewModel.isConnectionLost())
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
			viewModel.init()
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})

		o("only one mail is shown when conversation view option is turned off", async function () {
			when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(true)

			viewModel.init()
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(1)(`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be 1`)
		})
	})

	o.spec("Drafts in Conversation View", function () {
		o("Should be in conversation", async function () {
			const draftMail = addMail("draftMail")
			draftMail.state = MailState.DRAFT

			viewModel.init()
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})

		o("Should not be in conversation if in trash", async function () {
			// add draft mail
			const trashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT

			const trash = createMailFolder({ _id: [listId, "trashFolder"], folderType: MailFolderType.TRASH })
			entityRestClientMock.addListInstances(trash)

			when(
				mailModel.getMailboxDetailsForMail(
					matchers.argThat(function (mail) {
						return true
					}),
				),
			).thenResolve(mailboxDetail)
			when(mailModel.getMailFolder(listId)).thenReturn(trash)

			conversation.pop() // since this mail shouldn't actually be a part of the conversation

			viewModel.init()
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})

		o("Should be in conversation if it is in trash and is the primary mail", async function () {
			// add draft mail
			const trashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT

			const trash = createMailFolder({ _id: [listId, "trashFolder"], folderType: MailFolderType.TRASH })
			entityRestClientMock.addListInstances(trash)

			when(mailModel.getMailboxDetailsForMail(trashDraftMail)).thenResolve(mailboxDetail)
			when(mailModel.getMailFolder(listId)).thenReturn(trash)

			await makeViewModel(trashDraftMail)

			viewModel.init()
			await loadingDefer.promise

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})
	})

	o.spec("Entity Updates", function () {
		o("new mail comes in, is added to conversation", async function () {
			viewModel.init()
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
			o(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})

		o("mail gets deleted, is removed from conversation", async function () {
			viewModel.init()
			await loadingDefer.promise

			conversation.pop() // "deleting" the mail
			const mailConversationEntry = createConversationEntry({
				_id: anotherMail.conversationEntry,
				mail: anotherMail._id,
				previous: primaryMail?._id,
			})
			await entityRestClientMock.erase(mailConversationEntry)
			const deletedmailConversationEntry = createConversationEntry({
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

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(conversation.length)(
				`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be ${conversation.length}`,
			)
		})

		o("when conversation mode is turned off and a new mail comes in, nothing added to conversation", async function () {
			when(prefProvider.getConversationViewShowOnlySelectedMail()).thenReturn(true)

			viewModel.init()
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

		o("draft in trash, is not in the conversation on update", async function () {
			// add draft mail
			const trashDraftMail = addMail("trashDraftMail")
			trashDraftMail.state = MailState.DRAFT

			viewModel.init()
			await loadingDefer.promise

			const trash = createMailFolder({ _id: ["newListId", "trashFolder"], folderType: MailFolderType.TRASH })
			entityRestClientMock.addListInstances(trash)
			// adding new mail (is the same mail, just moved to trash)
			const newTrashDraftMail = addMail("trashDraftMail")
			newTrashDraftMail.state = MailState.DRAFT
			newTrashDraftMail._id = ["newListId", trashDraftMail._id[1]]

			when(
				mailModel.getMailboxDetailsForMail(
					matchers.argThat(function (mail) {
						return true
					}),
				),
			).thenResolve(mailboxDetail)
			when(mailModel.getMailFolder("newListId")).thenReturn(trash)

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

			const numMailsDisplayed = viewModel.conversationItems().filter((i) => i.type === "mail").length
			o(numMailsDisplayed).equals(2)(`Wrong number of mails in conversationItems, got ${numMailsDisplayed} should be 2`)
		})
	})
})
