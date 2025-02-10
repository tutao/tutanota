import o from "../../../../packages/otest/dist/otest"
import {
	createMailSetEntry,
	Mail,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailFolder,
	MailFolderTypeRef,
	MailSetEntry,
	MailSetEntryTypeRef,
	MailTypeRef,
} from "../../../../src/common/api/entities/tutanota/TypeRefs"
import { matchers, object, verify, when } from "testdouble"
import { ConversationPrefProvider } from "../../../../src/mail-app/mail/view/ConversationViewModel"
import { EntityClient } from "../../../../src/common/api/common/EntityClient"
import { MailModel } from "../../../../src/mail-app/mail/model/MailModel"
import { InboxRuleHandler } from "../../../../src/mail-app/mail/model/InboxRuleHandler"
import { ExposedCacheStorage } from "../../../../src/common/api/worker/rest/DefaultEntityRestCache"
import { MailSetKind, OperationType } from "../../../../src/common/api/common/TutanotaConstants"
import {
	constructMailSetEntryId,
	CUSTOM_MAX_ID,
	CUSTOM_MIN_ID,
	deconstructMailSetEntryId,
	elementIdPart,
	GENERATED_MAX_ID,
	getElementId,
	getListId,
	isSameId,
	listIdPart,
} from "../../../../src/common/api/common/utils/EntityUtils"
import { PageSize } from "../../../../src/common/gui/base/ListUtils"
import { createTestEntity } from "../../TestUtils"
import { tutaDunkel, tutaRed } from "../../../../src/common/gui/builtinThemes"
import { EntityUpdateData } from "../../../../src/common/api/common/utils/EntityUpdateUtils"
import { MailboxDetail } from "../../../../src/common/mailFunctionality/MailboxModel"
import { GroupInfoTypeRef, GroupTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs"
import { ConnectionError } from "../../../../src/common/api/common/error/RestError"
import { clamp, pad } from "@tutao/tutanota-utils"
import { LoadedMail } from "../../../../src/mail-app/mail/model/MailSetListModel"
import { ConversationListModel } from "../../../../src/mail-app/mail/model/ConversationListModel"

o.spec("ConversationListModelTest", () => {
	let model: ConversationListModel

	const mailboxDetail: MailboxDetail = {
		mailbox: createTestEntity(MailBoxTypeRef),
		mailGroupInfo: createTestEntity(GroupInfoTypeRef),
		mailGroup: createTestEntity(GroupTypeRef),
		mailboxGroupRoot: createTestEntity(MailboxGroupRootTypeRef),
	}

	const mailSetEntriesListId = "entries"
	const _ownerGroup = "me"

	const labels: MailFolder[] = [
		createTestEntity(MailFolderTypeRef, {
			_id: ["mailFolderList", "tutaRed"],
			color: tutaRed,
			folderType: MailSetKind.LABEL,
			name: "Tuta Red Label",
			parentFolder: null,
		}),
		createTestEntity(MailFolderTypeRef, {
			_id: ["mailFolderList", "tutaDunkel"],
			color: tutaDunkel,
			folderType: MailSetKind.LABEL,
			name: "Tuta Dunkel Label",
			parentFolder: null,
		}),
	]

	let mailSet: MailFolder
	let conversationPrefProvider: ConversationPrefProvider
	let entityClient: EntityClient
	let mailModel: MailModel
	let inboxRuleHandler: InboxRuleHandler
	let cacheStorage: ExposedCacheStorage

	o.beforeEach(() => {
		mailSet = createTestEntity(MailFolderTypeRef, {
			_id: ["mailFolderList", "mailFolderId"],
			folderType: MailSetKind.CUSTOM,
			name: "My Folder",
			entries: mailSetEntriesListId,
			parentFolder: null,
		})

		conversationPrefProvider = object()
		entityClient = object()
		mailModel = object()
		inboxRuleHandler = object()
		cacheStorage = object()
		model = new ConversationListModel(mailSet, conversationPrefProvider, entityClient, mailModel, inboxRuleHandler, cacheStorage)
		when(mailModel.getMailboxDetailsForMailFolder(mailSet)).thenResolve(mailboxDetail)
	})

	// Care has to be ensured for generating mail set entry IDs as we depend on real mail set ID decoding, thus we have
	// some helper methods for generating IDs for these tests.
	function makeMailId(index: number): IdTuple {
		const mailBag = index % 10
		return [`${mailBag}`, pad(index, GENERATED_MAX_ID.length)]
	}

	function makeMailSetElementId(index: number): Id {
		return constructMailSetEntryId(new Date(index * 100), elementIdPart(makeMailId(index)))
	}

	function mailSetElementIdToIndex(mailSetElementId: Id): number {
		return Number(deconstructMailSetEntryId(mailSetElementId).mailId)
	}

	async function setUpTestData(count: number, initialLabels: MailFolder[], offline: boolean, mailsPerConversation: number) {
		const mailSetEntries: MailSetEntry[] = []
		const mails: Mail[][] = [[], [], [], [], [], [], [], [], [], []]

		for (let i = 0; i < count; i++) {
			const mailBag = i % 10
			const mailId: IdTuple = makeMailId(i)
			const conversationId = "" + Math.floor(i / mailsPerConversation)

			const mail = createTestEntity(MailTypeRef, {
				_id: mailId,
				sets: [mailSet._id, ...initialLabels.map((l) => l._id)],
				conversationEntry: [conversationId, elementIdPart(mailId)],
			})

			mails[mailBag].push(mail)

			mailSetEntries.push(
				createMailSetEntry({
					_id: [mailSetEntriesListId, makeMailSetElementId(i)],
					_ownerGroup,
					_permissions: "1234",
					mail: mailId,
				}),
			)
		}

		when(mailModel.getLabelsForMail(matchers.anything())).thenDo((mail: Mail) => {
			const sets: MailFolder[] = []
			for (const set of mail.sets) {
				const setToAdd = labels.find((label) => isSameId(label._id, set))
				if (setToAdd) {
					sets.push(setToAdd)
				}
			}
			return sets
		})

		// Ensures elements are loaded from the array in reverse order
		async function getMailSetEntryMock(_mailSetEntry: any, _listId: Id, startingId: Id, count: number, _reverse: boolean): Promise<MailSetEntry[]> {
			let endingIndex: number
			if (startingId === CUSTOM_MAX_ID) {
				endingIndex = mailSetEntries.length
			} else {
				endingIndex = mailSetElementIdToIndex(startingId)
			}
			endingIndex = clamp(endingIndex, 0, mailSetEntries.length)

			const startingIndex = clamp(endingIndex - count, 0, endingIndex)
			return mailSetEntries.slice(startingIndex, endingIndex).reverse()
		}

		async function getMailsMock(_mailTypeRef: any, mailBag: string, elements: Id[]): Promise<Mail[]> {
			const mailsInMailBag = mails[Number(mailBag)] ?? []
			return mailsInMailBag.filter((mail) => elements.includes(getElementId(mail)))
		}

		when(cacheStorage.provideFromRange(MailSetEntryTypeRef, mailSetEntriesListId, matchers.anything(), matchers.anything(), true)).thenDo(
			getMailSetEntryMock,
		)
		when(cacheStorage.provideMultiple(MailTypeRef, matchers.anything(), matchers.anything())).thenDo(getMailsMock)

		if (offline) {
			when(entityClient.loadRange(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenReject(
				new ConnectionError("sorry we are offline"),
			)
			when(entityClient.loadMultiple(matchers.anything(), matchers.anything(), matchers.anything(), matchers.anything())).thenReject(
				new ConnectionError("sorry we are offline"),
			)
		} else {
			when(entityClient.loadRange(MailSetEntryTypeRef, mailSetEntriesListId, matchers.anything(), matchers.anything(), true)).thenDo(getMailSetEntryMock)
			when(entityClient.loadMultiple(MailTypeRef, matchers.anything(), matchers.anything())).thenDo(getMailsMock)
		}
	}

	o.test("loads PageSize items and sets labels correctly", async () => {
		await setUpTestData(PageSize, labels, false, 1)
		await model.loadInitial()
		o(model.mails.length).equals(PageSize)
		for (const mail of model.mails) {
			o(model.getLabelsForMail(mail)).deepEquals(labels)
		}
		verify(cacheStorage.provideFromRange(MailSetEntryTypeRef, mailSetEntriesListId, CUSTOM_MAX_ID, PageSize, true), {
			times: 0,
		})
		verify(mailModel.getMailboxDetailsForMailFolder(matchers.anything()), {
			times: 0,
		})
		verify(inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, matchers.anything(), true), {
			times: 0,
		})
	})

	o.test("loads PageSize items while offline and sets labels correctly", async () => {
		await setUpTestData(PageSize, labels, true, 1)
		await model.loadInitial()
		o(model.mails.length).equals(PageSize)
		for (const mail of model.mails) {
			o(model.getLabelsForMail(mail)).deepEquals(labels)
		}
		verify(cacheStorage.provideFromRange(MailSetEntryTypeRef, mailSetEntriesListId, CUSTOM_MAX_ID, PageSize, true), {
			times: 1,
		})
		verify(mailModel.getMailboxDetailsForMailFolder(matchers.anything()), {
			times: 0,
		})
		verify(inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, matchers.anything(), true), {
			times: 0,
		})
	})

	o.test("applies inbox rules if inbox", async () => {
		mailSet.folderType = MailSetKind.INBOX

		// make one item have a rule
		when(
			inboxRuleHandler.findAndApplyMatchingRule(
				mailboxDetail,
				matchers.argThat((mail: Mail) => isSameId(mail._id, makeMailId(25))),
				true,
			),
		).thenResolve({})

		await setUpTestData(PageSize, labels, false, 1)
		await model.loadInitial()
		o(model.mails.length).equals(PageSize - 1)
		for (const mail of model.mails) {
			o(model.getLabelsForMail(mail)).deepEquals(labels)
		}
		verify(cacheStorage.provideFromRange(MailSetEntryTypeRef, mailSetEntriesListId, CUSTOM_MAX_ID, PageSize, true), {
			times: 0,
		})
		verify(mailModel.getMailboxDetailsForMailFolder(matchers.anything()), {
			times: 1,
		})
		verify(inboxRuleHandler.findAndApplyMatchingRule(mailboxDetail, matchers.anything(), true), {
			times: 100,
		})
	})

	o.spec("loadMore eventually loads more mails", () => {
		o.test("ungrouped", async () => {
			const mailsPerConversation = 1
			const pages = 5
			await setUpTestData(PageSize * pages, labels, false, mailsPerConversation)
			await model.loadInitial() // will have the first page loaded
			const unloadedMail = elementIdPart(makeMailId(1)) // a mail that will be on the bottom of the list

			// This mail is not loaded until we load a few more pages.
			for (let loadedPageCount = 1; loadedPageCount < pages; loadedPageCount++) {
				o(model.mails.length).equals(PageSize * loadedPageCount)
				const mail = model.getMail(unloadedMail)
				o(mail).equals(null)
				await model.loadMore()
			}

			// Everything is loaded including that mail we wanted from before
			o(model.mails.length).equals(PageSize * pages)
			const mail = model.getMail(unloadedMail)
			o(mail).notEquals(null)
		})

		o.test("grouped by conversations", async () => {
			const mailsPerConversation = 2
			const pages = 4
			await setUpTestData(PageSize * pages * mailsPerConversation, labels, false, mailsPerConversation)
			await model.loadInitial() // will have the first page loaded
			const unloadedMail = elementIdPart(makeMailId(1)) // a mail that will be on the bottom of the list

			// This mail is not loaded until we load a few more pages.
			for (let loadedPageCount = 1; loadedPageCount < pages * mailsPerConversation; loadedPageCount++) {
				const mail = model.getMail(unloadedMail)
				o(mail).equals(null)
				await model.loadMore()
			}

			// Everything is now loaded, including that mail we wanted from before
			o(model.mails.length).equals(PageSize * pages * mailsPerConversation)

			// But we have fewer pages shown because half of them are hidden behind conversations where there are newer mails
			o(model.items.length).equals(PageSize * pages)
			const mail = model.getMail(unloadedMail)
			o(mail).notEquals(null)
		})

		o.test("everything is one conversation", async () => {
			const pages = 4
			const totalMails = PageSize * pages
			await setUpTestData(totalMails, labels, false, totalMails)
			await model.loadInitial() // will have the first page loaded
			await model.loadAll()

			o(model.mails.length).equals(totalMails)
			o(model.items.length).equals(1)
		})
	})

	o.test("loadAndSelect selects by mail id", async () => {
		await setUpTestData(PageSize * 5, labels, false, 1)
		await model.loadInitial() // will have the first page loaded

		// This mail is not loaded yet.
		const unloadedMail = elementIdPart(makeMailId(1)) // a mail that will be on the bottom of the list
		const mail = model.getMail(unloadedMail)
		o(mail).equals(null)

		// Should now be loaded
		const loadedMail = await model.loadAndSelect(unloadedMail, () => false)
		o(loadedMail).notEquals(null)
		o(loadedMail).equals(model.getMail(unloadedMail))
	})

	o.spec("handleEntityUpdate", () => {
		o.test("mailset update updates labels", async () => {
			await setUpTestData(PageSize, [labels[0]], false, 1)
			await model.loadInitial()

			// Overwrite one of the mails inside the list so it has both labels
			const someIndex = 50 // a random number
			const someMail: LoadedMail = {
				...model._getMailMap().get(elementIdPart(makeMailId(someIndex)))!,
				labels: [labels[0], labels[1]],
			}
			someMail.mail.sets.push(labels[1]._id)
			model._updateMails([someMail])
			o(model.getLabelsForMail(someMail.mail)[1]).deepEquals(labels[1])

			// Change one of the labels (but not inside the mail we just updated)
			labels[1] = {
				...labels[1],
				name: "Mint",
				color: "#00FFAA",
			}

			o(model.getLabelsForMail(someMail.mail)[1]).notDeepEquals(labels[1])

			const entityUpdateData = {
				application: MailFolderTypeRef.app,
				type: MailFolderTypeRef.type,
				instanceListId: getListId(labels[1]),
				instanceId: getElementId(labels[1]),
				operation: OperationType.DELETE,
			}

			entityUpdateData.operation = OperationType.UPDATE
			await model.handleEntityUpdate(entityUpdateData)
			o(model.getLabelsForMail(someMail.mail)[1]).deepEquals(labels[1])

			// verify getLabelsForMail call times (someMail was queried twice, but other mails only once)
			verify(mailModel.getLabelsForMail(someMail.mail), { times: 2 })
			verify(mailModel.getLabelsForMail(model.mails[someIndex + 1]), { times: 1 })
		})

		o.test("mailset delete does nothing", async () => {
			await setUpTestData(PageSize, [labels[0]], false, 1)
			await model.loadInitial()

			const entityUpdateData = {
				application: MailFolderTypeRef.app,
				type: MailFolderTypeRef.type,
				instanceListId: getListId(labels[1]),
				instanceId: getElementId(labels[1]),
				operation: OperationType.DELETE,
			}
			entityUpdateData.operation = OperationType.DELETE

			await model.handleEntityUpdate(entityUpdateData)
			o(model.mails.length).equals(PageSize)
		})

		o.test("deleting a mail set entry", async () => {
			await setUpTestData(PageSize, labels, false, 1)
			await model.loadInitial()
			const someIndex = 22 // a random number
			const someMail: LoadedMail = model._getMailMap().get(elementIdPart(makeMailId(someIndex)))!

			const entityUpdateData = {
				application: MailSetEntryTypeRef.app,
				type: MailSetEntryTypeRef.type,
				instanceListId: listIdPart(someMail.mailSetEntryId),
				instanceId: elementIdPart(someMail.mailSetEntryId),
				operation: OperationType.DELETE,
			}

			const oldItems = model.mails
			const newItems = [...oldItems]
			newItems.splice(PageSize - 1 - someIndex, 1)

			o(model.mails).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.mails).deepEquals(newItems)
			o(model.getMail(getElementId(someMail.mail))).equals(null)
		})

		function createInsertedMail(
			mailSetEntryId: IdTuple,
			conversationId: Id,
		): {
			mail: Mail
			mailSetEntry: MailSetEntry
			entityUpdateData: EntityUpdateData
			mailLabels: MailFolder[]
		} {
			const newMail = createTestEntity(MailTypeRef, {
				_id: ["new mail!!!", deconstructMailSetEntryId(elementIdPart(mailSetEntryId)).mailId],
				sets: [mailSet._id, labels[1]._id],
				conversationEntry: [conversationId, "yay!"],
			})

			const newEntry = createMailSetEntry({
				_id: mailSetEntryId,
				mail: newMail._id,
			})

			const entityUpdateData = {
				application: MailSetEntryTypeRef.app,
				type: MailSetEntryTypeRef.type,
				instanceListId: getListId(newEntry),
				instanceId: getElementId(newEntry),
				operation: OperationType.CREATE,
			}

			when(entityClient.load(MailSetEntryTypeRef, newEntry._id)).thenResolve(newEntry)
			when(entityClient.loadMultiple(MailTypeRef, getListId(newMail), [getElementId(newMail)])).thenResolve([newMail])

			return {
				mail: newMail,
				mailSetEntry: newEntry,
				entityUpdateData,
				mailLabels: [labels[1]],
			}
		}

		o.test("creating a mail set entry of the same set adds the element", async () => {
			await setUpTestData(3, labels, false, 1)
			await model.loadInitial()
			const { mail, entityUpdateData, mailLabels } = createInsertedMail([mailSet.entries, CUSTOM_MAX_ID], "1")

			const oldItems = model.mails
			// NOTE: mails is backed by a Map which maintains insertion order; MailSetListModel#mails is not required to
			// be ordered
			const newItems = [...oldItems, mail]

			o(model.mails).equals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.mails).deepEquals(newItems)
			o(model.getMail(getElementId(mail))).deepEquals(mail)
			o(model.getLabelsForMail(mail)).deepEquals(mailLabels)
		})

		o.test("creating an older mail in an existing conversation", async () => {
			await setUpTestData(1, labels, false, 1)
			await model.loadInitial()
			const { mail, entityUpdateData } = createInsertedMail([mailSetEntriesListId, CUSTOM_MIN_ID], "0")

			const oldMails = model.mails
			const newMails = [...oldMails, mail]

			const oldItems = model.items
			const newItems = [...oldItems]

			o(model.mails).deepEquals(oldMails)
			o(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.mails).deepEquals(newMails)
			o(model.items).deepEquals(newItems)
			o(model.getMail(getElementId(mail))).equals(mail)
		})

		o.test("creating a newer mail in an existing conversation", async () => {
			await setUpTestData(1, labels, false, 1)
			await model.loadInitial()
			const { mail, entityUpdateData } = createInsertedMail([mailSetEntriesListId, CUSTOM_MAX_ID], "0")

			const oldMails = model.mails
			const newMails = [...oldMails, mail]

			const oldItems = model.items
			const newItems = [mail]

			o(model.mails).deepEquals(oldMails)
			o(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.mails).deepEquals(newMails)
			o(model.items).deepEquals(newItems)
			o(model.getMail(getElementId(mail))).equals(mail)
		})

		o.test("deleting an older mail in an existing conversation", async () => {
			await setUpTestData(2, labels, false, 2)
			await model.loadInitial()

			const oldMails = model.mails
			const newMails = [oldMails[0]]

			const oldItems = model.items
			const newItems = [...oldItems]

			const entityUpdateData = {
				application: MailSetEntryTypeRef.app,
				type: MailSetEntryTypeRef.type,
				instanceListId: mailSetEntriesListId,
				instanceId: makeMailSetElementId(0),
				operation: OperationType.DELETE,
			}

			o(model.mails).deepEquals(oldMails)
			o(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.mails).deepEquals(newMails)
			o(model.items).deepEquals(newItems)
			o(model.getMail(entityUpdateData.instanceId)).equals(null)
		})

		o.test("deleting the newest mail in an existing conversation of 3 items selects the second newest", async () => {
			await setUpTestData(3, labels, false, 3)
			await model.loadInitial()

			const oldMails = model.mails
			const newMails = [oldMails[1], oldMails[2]]

			const oldItems = model.items
			const newItems = [oldMails[1]]

			const entityUpdateData = {
				application: MailSetEntryTypeRef.app,
				type: MailSetEntryTypeRef.type,
				instanceListId: mailSetEntriesListId,
				instanceId: makeMailSetElementId(2),
				operation: OperationType.DELETE,
			}

			o(model.mails).deepEquals(oldMails)
			o(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.mails).deepEquals(newMails)
			o(model.items).deepEquals(newItems)
			o(model.getMail(entityUpdateData.instanceId)).equals(null)
		})

		o.test("deleting a newer mail in an existing conversation of 2 items", async () => {
			await setUpTestData(2, labels, false, 2)
			await model.loadInitial()

			const oldMails = model.mails
			const newMails = [oldMails[1]]

			const oldItems = model.items
			const newItems = [oldMails[1]]

			const entityUpdateData = {
				application: MailSetEntryTypeRef.app,
				type: MailSetEntryTypeRef.type,
				instanceListId: mailSetEntriesListId,
				instanceId: makeMailSetElementId(1),
				operation: OperationType.DELETE,
			}

			o(model.mails).deepEquals(oldMails)
			o(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.mails).deepEquals(newMails)
			o(model.items).deepEquals(newItems)
			o(model.getMail(entityUpdateData.instanceId)).equals(null)
		})

		o.test("creating a mail set entry in a different set does nothing", async () => {
			await setUpTestData(PageSize, labels, false, 1)
			await model.loadInitial()
			const { mail, entityUpdateData } = createInsertedMail(["something else", CUSTOM_MAX_ID], "whoo!")

			const oldItems = model.mails
			const newItems = [...oldItems]

			o(model.mails).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.mails).deepEquals(newItems)
			o(model.getMail(getElementId(mail))).equals(null)
		})

		o.test("updating a mail updates the contents", async () => {
			await setUpTestData(PageSize, labels, false, 1)
			await model.loadInitial()
			const mail = { ...model.mails[2] }
			mail.subject = "hey it's a subject"
			mail.sets = [mailSet._id] // remove all labels

			const entityUpdateData = {
				application: MailTypeRef.app,
				type: MailTypeRef.type,
				instanceListId: getListId(mail),
				instanceId: getElementId(mail),
				operation: OperationType.UPDATE,
			}
			when(entityClient.load(MailTypeRef, mail._id)).thenResolve(mail)

			entityUpdateData.operation = OperationType.UPDATE
			await model.handleEntityUpdate(entityUpdateData)
			o(model.getMail(getElementId(mail))).deepEquals(mail)
			o(model.getLabelsForMail(mail)).deepEquals([])
		})

		o.test("mail delete does nothing", async () => {
			await setUpTestData(PageSize, labels, false, 1)
			await model.loadInitial()
			const mail = { ...model.mails[2] }
			const entityUpdateData = {
				application: MailTypeRef.app,
				type: MailTypeRef.type,
				instanceListId: getListId(mail),
				instanceId: getElementId(mail),
				operation: OperationType.UPDATE,
			}
			when(entityClient.load(MailTypeRef, mail._id)).thenResolve(mail)
			entityUpdateData.operation = OperationType.DELETE

			await model.handleEntityUpdate(entityUpdateData)
			o(model.getMail(getElementId(mail))).deepEquals(mail)
		})
	})
})
