import o from "../../../../packages/otest/dist/otest"
import { MailListModel } from "../../../../src/mail-app/mail/model/MailListModel"
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
import { entityUpateToUpdateData, EntityUpdateData } from "../../../../src/common/api/common/utils/EntityUpdateUtils"
import { MailboxDetail } from "../../../../src/common/mailFunctionality/MailboxModel"
import { GroupInfoTypeRef, GroupTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs"
import { ConnectionError } from "../../../../src/common/api/common/error/RestError"
import { clamp, pad } from "@tutao/tutanota-utils"
import { LoadedMail } from "../../../../src/mail-app/mail/model/MailSetListModel"

o.spec("MailListModelTest", () => {
	let model: MailListModel

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
		model = new MailListModel(mailSet, conversationPrefProvider, entityClient, mailModel, inboxRuleHandler, cacheStorage)
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

	async function setUpTestData(count: number, initialLabels: MailFolder[], offline: boolean) {
		const mailSetEntries: MailSetEntry[] = []
		const mails: Mail[][] = [[], [], [], [], [], [], [], [], [], []]

		for (let i = 0; i < count; i++) {
			const mailBag = i % 10
			const mailId: IdTuple = makeMailId(i)

			const mail = createTestEntity(MailTypeRef, {
				_id: mailId,
				sets: [mailSet._id, ...initialLabels.map((l) => l._id)],
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
		await setUpTestData(PageSize, labels, false)
		await model.loadInitial()
		o(model.items.length).equals(PageSize)
		for (const mail of model.items) {
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
		await setUpTestData(PageSize, labels, true)
		await model.loadInitial()
		o(model.items.length).equals(PageSize)
		for (const mail of model.items) {
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

		await setUpTestData(PageSize, labels, false)
		await model.loadInitial()
		o(model.items.length).equals(PageSize - 1)
		for (const mail of model.items) {
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

	o.test("loadMore eventually loads more mails", async () => {
		const pages = 5
		await setUpTestData(PageSize * pages, labels, false)
		await model.loadInitial() // will have the first page loaded
		const unloadedMail = elementIdPart(makeMailId(1)) // a mail that will be on the bottom of the list

		// This mail is not loaded until we load a few more pages.
		for (let loadedPageCount = 1; loadedPageCount < pages; loadedPageCount++) {
			o(model.items.length).equals(PageSize * loadedPageCount)
			const mail = model.getMail(unloadedMail)
			o(mail).equals(null)
			await model.loadMore()
		}

		// Everything is loaded including that mail we wanted from before
		o(model.items.length).equals(PageSize * pages)
		const mail = model.getMail(unloadedMail)
		o(mail).notEquals(null)
	})

	o.test("loadAndSelect selects by mail id", async () => {
		await setUpTestData(PageSize * 5, labels, false)
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
			await setUpTestData(PageSize, [labels[0]], false)
			await model.loadInitial()

			// Overwrite one of the mails inside the list so it has both labels
			const someIndex = 50 // a random number
			const someMail: LoadedMail = {
				...model._loadedMails()[someIndex],
				labels: [labels[0], labels[1]],
			}
			someMail.mail.sets.push(labels[1]._id)
			model._updateSingleMail(someMail)
			o(model.getLabelsForMail(someMail.mail)[1]).deepEquals(labels[1])

			// Change one of the labels (but not inside the mail we just updated)
			labels[1] = {
				...labels[1],
				name: "Mint",
				color: "#00FFAA",
			}

			o(model.getLabelsForMail(someMail.mail)[1]).notDeepEquals(labels[1])

			const entityUpdateData: EntityUpdateData = {
				application: MailFolderTypeRef.app,
				typeId: MailFolderTypeRef.typeId,
				instanceListId: getListId(labels[1]),
				instanceId: getElementId(labels[1]),
				operation: OperationType.DELETE,
			}

			entityUpdateData.operation = OperationType.UPDATE
			await model.handleEntityUpdate(entityUpdateData)
			o(model.getLabelsForMail(someMail.mail)[1]).deepEquals(labels[1])

			// verify getLabelsForMail call times (someMail was queried twice, but other mails only once)
			verify(mailModel.getLabelsForMail(someMail.mail), { times: 2 })
			verify(mailModel.getLabelsForMail(model.items[someIndex + 1]), { times: 1 })
		})

		o.test("mailset delete does nothing", async () => {
			await setUpTestData(PageSize, [labels[0]], false)
			await model.loadInitial()

			const entityUpdateData: EntityUpdateData = {
				application: MailFolderTypeRef.app,
				typeId: MailFolderTypeRef.typeId,
				instanceListId: getListId(labels[1]),
				instanceId: getElementId(labels[1]),
				operation: OperationType.DELETE,
			}
			entityUpdateData.operation = OperationType.DELETE

			await model.handleEntityUpdate(entityUpdateData)
			o(model.items.length).equals(PageSize)
		})

		o.test("deleting a mail set entry", async () => {
			await setUpTestData(PageSize, labels, false)
			await model.loadInitial()
			const someIndex = 22 // a random number
			const someMail = model._loadedMails()[someIndex]

			const entityUpdateData: EntityUpdateData = {
				application: MailSetEntryTypeRef.app,
				typeId: MailSetEntryTypeRef.typeId,
				instanceListId: listIdPart(someMail.mailSetEntryId),
				instanceId: elementIdPart(someMail.mailSetEntryId),
				operation: OperationType.DELETE,
			}

			const oldItems = model.items
			const newItems = [...oldItems]
			newItems.splice(someIndex, 1)

			o(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.items).deepEquals(newItems)
			o(model.getMail(getElementId(someMail.mail))).equals(null)
		})

		function createInsertedMail(forEntries: Id): {
			mail: Mail
			mailSetEntry: MailSetEntry
			entityUpdateData: EntityUpdateData
			mailLabels: MailFolder[]
		} {
			const newMail = createTestEntity(MailTypeRef, {
				_id: ["new mail!!!", "the mail!!!"],
				sets: [mailSet._id, labels[1]._id],
			})

			const newEntry = createMailSetEntry({
				_id: [forEntries, CUSTOM_MAX_ID],
				mail: newMail._id,
			})

			const entityUpdateData: EntityUpdateData = {
				application: MailSetEntryTypeRef.app,
				typeId: MailSetEntryTypeRef.typeId,
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
			await setUpTestData(PageSize, labels, false)
			await model.loadInitial()
			const { mail, entityUpdateData, mailLabels } = createInsertedMail(mailSet.entries)

			const oldItems = model.items
			const newItems = [mail, ...oldItems]

			o(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.items).deepEquals(newItems)
			o(model.getMail(getElementId(mail))).deepEquals(mail)
			o(model.getLabelsForMail(mail)).deepEquals(mailLabels)
		})

		o.test("creating a mail set entry in a different set does nothing", async () => {
			await setUpTestData(PageSize, labels, false)
			await model.loadInitial()
			const { mail, entityUpdateData } = createInsertedMail("something else")

			const oldItems = model.items
			const newItems = [...oldItems]

			o(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o(model.items).deepEquals(newItems)
			o(model.getMail(getElementId(mail))).equals(null)
		})

		o.test("updating a mail updates the contents", async () => {
			await setUpTestData(PageSize, labels, false)
			await model.loadInitial()
			const mail = { ...model.items[2] }
			mail.subject = "hey it's a subject"
			mail.sets = [mailSet._id] // remove all labels

			const entityUpdateData: EntityUpdateData = {
				application: MailTypeRef.app,
				typeId: MailTypeRef.typeId,
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
			await setUpTestData(PageSize, labels, false)
			await model.loadInitial()
			const mail = { ...model.items[2] }
			const entityUpdateData: EntityUpdateData = {
				application: MailTypeRef.app,
				typeId: MailTypeRef.typeId,
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
