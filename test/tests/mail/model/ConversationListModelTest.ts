import o from "@tutao/otest"
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
import { EntityUpdateData, PrefetchStatus } from "../../../../src/common/api/common/utils/EntityUpdateUtils"
import { MailboxDetail } from "../../../../src/common/mailFunctionality/MailboxModel"
import { GroupInfoTypeRef, GroupTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs"
import { ConnectionError } from "../../../../src/common/api/common/error/RestError"
import { assertNotNull, clamp, lastThrow, pad } from "@tutao/tutanota-utils"
import { LoadedMail } from "../../../../src/mail-app/mail/model/MailSetListModel"
import { ConversationListModel } from "../../../../src/mail-app/mail/model/ConversationListModel"
import { theme } from "../../../../src/common/gui/theme.js"
import { ListLoadingState } from "../../../../src/common/gui/base/List"
import { getMailFilterForType, MailFilterType } from "../../../../src/mail-app/mail/view/MailViewerUtils"
import { ProcessInboxHandler } from "../../../../src/mail-app/mail/model/ProcessInboxHandler"
import { FolderSystem } from "../../../../src/common/api/common/mail/FolderSystem"

o.spec("ConversationListModel", () => {
	let model: ConversationListModel

	const mailboxDetail: MailboxDetail = {
		mailbox: createTestEntity(MailBoxTypeRef),
		mailGroupInfo: createTestEntity(GroupInfoTypeRef),
		mailGroup: createTestEntity(GroupTypeRef),
		mailboxGroupRoot: createTestEntity(MailboxGroupRootTypeRef),
	}
	const noPatchesAndInstance: Pick<EntityUpdateData, "instance" | "patches"> = {
		instance: null,
		patches: null,
	}

	const mailSetEntriesListId = "entries"
	const _ownerGroup = "me"

	const labels: MailFolder[] = [
		createTestEntity(MailFolderTypeRef, {
			_id: ["mailFolderList", "tutaPrimary"],
			color: theme.primary,
			folderType: MailSetKind.LABEL,
			name: "Tuta Primary Label",
			parentFolder: null,
		}),
		createTestEntity(MailFolderTypeRef, {
			_id: ["mailFolderList", "tutaSecondary"],
			color: theme.secondary,
			folderType: MailSetKind.LABEL,
			name: "Tuta Secondary Label",
			parentFolder: null,
		}),
	]

	let mailSet: MailFolder
	let conversationPrefProvider: ConversationPrefProvider
	let entityClient: EntityClient
	let mailModel: MailModel
	let processInboxHandler: ProcessInboxHandler
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
		processInboxHandler = object()
		cacheStorage = object()
		model = new ConversationListModel(mailSet, conversationPrefProvider, entityClient, mailModel, processInboxHandler, cacheStorage)
		when(mailModel.getMailboxDetailsForMailFolder(mailSet)).thenResolve(mailboxDetail)
		const folderSystem: FolderSystem = object()
		when(mailModel.getFolderSystemByGroupId(matchers.anything())).thenReturn(folderSystem)
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

	// Creates a totalMails number of mails, grouping into a number of conversations equal to totalMails/mailsPerConversation
	async function setUpTestData(totalMails: number, initialLabels: MailFolder[], offline: boolean, mailsPerConversation: number): Promise<Mail[]> {
		const mailSetEntries: MailSetEntry[] = []
		const mails: Mail[][] = [[], [], [], [], [], [], [], [], [], []]
		const allMails: Mail[] = []

		for (let i = 0; i < totalMails; i++) {
			const mailBag = i % 10
			const mailId: IdTuple = makeMailId(i)
			const conversationId = "" + Math.floor(i / mailsPerConversation)

			const mail = createTestEntity(MailTypeRef, {
				_id: mailId,
				sets: [mailSet._id, ...initialLabels.map((l) => l._id)],
				conversationEntry: [conversationId, elementIdPart(mailId)],
			})

			mails[mailBag].push(mail)
			allMails.push(mail)

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

		return allMails.reverse()
	}

	o.test("loads PageSize items and sets labels correctly", async () => {
		await setUpTestData(PageSize, labels, false, 1)
		await model.loadInitial()
		o.check(model.mails.length).equals(PageSize)
		for (const mail of model.mails) {
			o.check(model.getLabelsForMail(mail)).deepEquals(labels)
		}
		verify(cacheStorage.provideFromRange(MailSetEntryTypeRef, mailSetEntriesListId, CUSTOM_MAX_ID, PageSize, true), {
			times: 0,
		})
		verify(mailModel.getMailboxDetailsForMailFolder(matchers.anything()), {
			times: 0,
		})
		verify(processInboxHandler.handleIncomingMail(matchers.anything(), matchers.anything(), mailboxDetail, matchers.anything()), {
			times: 0,
		})
	})

	o.test("loads PageSize items while offline and sets labels correctly", async () => {
		await setUpTestData(PageSize, labels, true, 1)
		await model.loadInitial()
		o.check(model.mails.length).equals(PageSize)
		for (const mail of model.mails) {
			o.check(model.getLabelsForMail(mail)).deepEquals(labels)
		}
		verify(cacheStorage.provideFromRange(MailSetEntryTypeRef, mailSetEntriesListId, CUSTOM_MAX_ID, PageSize, true), {
			times: 1,
		})
		verify(mailModel.getMailboxDetailsForMailFolder(matchers.anything()), {
			times: 0,
		})
		verify(processInboxHandler.handleIncomingMail(matchers.anything(), matchers.anything(), mailboxDetail, matchers.anything()), {
			times: 0,
		})
	})

	o.test("loads fewer than PageSize items while offline, loadMore will fail", async () => {
		const mails = await setUpTestData(PageSize - 1, labels, true, 1)
		await model.loadInitial()
		o.check(model.mails.length).equals(PageSize - 1)
		o.check(model.mails).deepEquals(mails)
		for (const mail of model.mails) {
			o.check(model.getLabelsForMail(mail)).deepEquals(labels)
		}
		verify(cacheStorage.provideFromRange(MailSetEntryTypeRef, mailSetEntriesListId, CUSTOM_MAX_ID, PageSize, true), {
			times: 1,
		})
		verify(mailModel.getMailboxDetailsForMailFolder(matchers.anything()), {
			times: 0,
		})
		verify(processInboxHandler.handleIncomingMail(matchers.anything(), matchers.anything(), mailboxDetail, matchers.anything()), {
			times: 0,
		})
		o.check(model.loadingStatus).equals(ListLoadingState.Idle)

		await model.loadMore()
		o.check(model.mails.length).equals(PageSize - 1)
		o.check(model.mails).deepEquals(mails)
		o.check(model.loadingStatus).equals(ListLoadingState.ConnectionLost)
	})

	o.test("applies inbox rules if inbox", async () => {
		mailSet.folderType = MailSetKind.INBOX

		// make one item have a rule
		when(
			processInboxHandler.handleIncomingMail(
				matchers.argThat((mail: Mail) => isSameId(mail._id, makeMailId(25))),
				matchers.anything(),
				matchers.anything(),
				matchers.anything(),
			),
		).thenResolve({ folderType: MailSetKind.SPAM })

		when(
			processInboxHandler.handleIncomingMail(
				matchers.argThat((mail: Mail) => !isSameId(mail._id, makeMailId(25))),
				matchers.anything(),
				matchers.anything(),
				matchers.anything(),
			),
		).thenResolve({ folderType: MailSetKind.INBOX })

		await setUpTestData(PageSize, labels, false, 1)

		await model.loadInitial()

		o.check(model.mails.length).equals(PageSize - 1)
		for (const mail of model.mails) {
			o.check(model.getLabelsForMail(mail)).deepEquals(labels)
		}
		verify(cacheStorage.provideFromRange(MailSetEntryTypeRef, mailSetEntriesListId, CUSTOM_MAX_ID, PageSize, true), {
			times: 0,
		})
		verify(mailModel.getMailboxDetailsForMailFolder(matchers.anything()), {
			times: 1,
		})
		verify(processInboxHandler.handleIncomingMail(matchers.anything(), matchers.anything(), mailboxDetail, matchers.anything()), {
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
				o.check(model.mails.length).equals(PageSize * loadedPageCount)
				const mail = model.getMail(unloadedMail)
				o.check(mail).equals(null)
				await model.loadMore()
			}

			// Everything is loaded including that mail we wanted from before
			o.check(model.mails.length).equals(PageSize * pages)
			const mail = model.getMail(unloadedMail)
			o.check(mail).notEquals(null)
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
				o.check(mail).equals(null)
				await model.loadMore()
			}

			// Everything is now loaded, including that mail we wanted from before
			o.check(model.mails.length).equals(PageSize * pages * mailsPerConversation)

			// But we have fewer pages shown because half of them are hidden behind conversations where there are newer mails
			o.check(model.items.length).equals(PageSize * pages)
			const mail = model.getMail(unloadedMail)
			o.check(mail).notEquals(null)
		})

		o.test("everything is one conversation", async () => {
			const pages = 4
			const totalMails = PageSize * pages
			await setUpTestData(totalMails, labels, false, totalMails)
			await model.loadInitial() // will have the first page loaded
			await model.loadAll()

			o.check(model.mails.length).equals(totalMails)
			o.check(model.items.length).equals(1)
		})
	})

	o.test("loadAndSelect selects by mail id", async () => {
		await setUpTestData(PageSize * 5, labels, false, 1)
		await model.loadInitial() // will have the first page loaded

		// This mail is not loaded yet.
		const unloadedMail = elementIdPart(makeMailId(1)) // a mail that will be on the bottom of the list
		const mail = model.getMail(unloadedMail)
		o.check(mail).equals(null)
		o.check(model.getSelectedAsArray()).deepEquals([])

		// Should now be loaded
		const loadedMail = assertNotNull(await model.loadAndSelect(unloadedMail, () => false))
		o.check(loadedMail).equals(model.getMail(unloadedMail))

		// ...and selected
		o.check(model.getSelectedAsArray()).deepEquals([loadedMail])
	})

	o.test("handle create events while already loaded", async () => {
		const loadedMails = await setUpTestData(PageSize, labels, false, 1)
		const mail = lastThrow(loadedMails)
		await model.loadInitial()

		// the loaded mails are in reverse order, so we take the 0th element to get the last
		const mailSetEntryId: IdTuple = [mailSetEntriesListId, makeMailSetElementId(0)]
		const entityUpdateData: EntityUpdateData = {
			typeRef: MailSetEntryTypeRef,
			instanceListId: listIdPart(mailSetEntryId) as NonEmptyString,
			instanceId: elementIdPart(mailSetEntryId),
			operation: OperationType.CREATE,
			instance: null,
			patches: null,
			prefetchStatus: PrefetchStatus.NotPrefetched,
		}

		when(entityClient.load(MailSetEntryTypeRef, mailSetEntryId)).thenResolve(
			createTestEntity(MailSetEntryTypeRef, {
				_id: mailSetEntryId,
				mail: mail._id,
			}),
		)

		await model.handleEntityUpdate(entityUpdateData)
		o.check(model._getConversationMap().get(listIdPart(mail.conversationEntry))?.getMainMail()!.mailSetEntryId).deepEquals(mailSetEntryId)
	})

	o.spec("handleEntityUpdate", () => {
		o.test("mailset update updates labels", async () => {
			await setUpTestData(PageSize, [labels[0]], false, 1)
			await model.loadInitial()

			// Overwrite one of the mails inside the list so it has both labels
			const someIndex = 50 // a random number
			const someMail: LoadedMail = {
				...model._getLoadedMail(elementIdPart(makeMailId(someIndex)))!,
				labels: [labels[0], labels[1]],
			}
			someMail.mail.sets.push(labels[1]._id)
			model._insertOrUpdateLoadedMails([someMail])
			o.check(model.getLabelsForMail(someMail.mail)[1]).deepEquals(labels[1])

			// Change one of the labels (but not inside the mail we just updated)
			labels[1] = {
				...labels[1],
				name: "Mint",
				color: "#00FFAA",
			}

			o.check(model.getLabelsForMail(someMail.mail)[1]).notDeepEquals(labels[1])

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailFolderTypeRef,
				instanceListId: getListId(labels[1]) as NonEmptyString,
				instanceId: getElementId(labels[1]),
				operation: OperationType.DELETE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}

			const oldMails = model.mails

			entityUpdateData.operation = OperationType.UPDATE
			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.getLabelsForMail(someMail.mail)[1]).deepEquals(labels[1])

			// verify getLabelsForMail call times (someMail was queried twice, but other mails only once)
			verify(mailModel.getLabelsForMail(someMail.mail), { times: 2 })
			verify(mailModel.getLabelsForMail(model.mails[someIndex + 1]), { times: 1 })

			// does not break referential equality with mails (items is not guaranteed and is usually broken if *any*
			// update is made to the list)
			o.check(model.mails).equals(oldMails)
		})

		o.test("mailset delete does nothing", async () => {
			await setUpTestData(PageSize, [labels[0]], false, 1)
			await model.loadInitial()

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailFolderTypeRef,
				instanceListId: getListId(labels[1]) as NonEmptyString,
				instanceId: getElementId(labels[1]),
				operation: OperationType.DELETE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}
			entityUpdateData.operation = OperationType.DELETE

			const oldMails = model.mails
			const oldItems = model.items

			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.mails.length).equals(PageSize)

			// no change to referential equality
			o.check(model.items).equals(oldItems)
			o.check(model.mails).equals(oldMails)
		})

		o.test("deleting a mail set entry", async () => {
			await setUpTestData(PageSize, labels, false, 1)
			await model.loadInitial()
			const someIndex = 22 // a random number
			const someMail: LoadedMail = model._getLoadedMail(elementIdPart(makeMailId(someIndex)))!

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailSetEntryTypeRef,
				instanceListId: listIdPart(someMail.mailSetEntryId) as NonEmptyString,
				instanceId: elementIdPart(someMail.mailSetEntryId),
				operation: OperationType.DELETE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}

			const oldItems = model.mails
			const newItems = [...oldItems]
			newItems.splice(PageSize - 1 - someIndex, 1)

			o.check(model.mails).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.mails).deepEquals(newItems)
			o.check(model.getMail(getElementId(someMail.mail))).equals(null)
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

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailSetEntryTypeRef,
				instanceListId: getListId(newEntry) as NonEmptyString,
				instanceId: getElementId(newEntry),
				operation: OperationType.CREATE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
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

			o.check(model.mails).equals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.mails).deepEquals(newItems)
			o.check(model.getMail(getElementId(mail))).deepEquals(mail)
			o.check(model.getLabelsForMail(mail)).deepEquals(mailLabels)
		})

		o.test("creating an older mail in an existing conversation", async () => {
			await setUpTestData(1, labels, false, 1)
			await model.loadInitial()
			const { mail, entityUpdateData } = createInsertedMail([mailSetEntriesListId, CUSTOM_MIN_ID], "0")

			const oldMails = model.mails
			const newMails = [...oldMails, mail]

			const oldItems = model.items
			const newItems = [...oldItems]

			o.check(model.mails).deepEquals(oldMails)
			o.check(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.mails).deepEquals(newMails)
			o.check(model.items).deepEquals(newItems)
			o.check(model.getMail(getElementId(mail))).equals(mail)
		})

		o.test("creating a newer mail in an existing conversation", async () => {
			await setUpTestData(1, labels, false, 1)
			await model.loadInitial()
			const { mail, entityUpdateData } = createInsertedMail([mailSetEntriesListId, CUSTOM_MAX_ID], "0")

			const oldMails = model.mails
			const newMails = [...oldMails, mail]

			const oldItems = model.items
			const newItems = [mail]

			o.check(model.mails).deepEquals(oldMails)
			o.check(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.mails).deepEquals(newMails)
			o.check(model.items).deepEquals(newItems)
			o.check(model.getMail(getElementId(mail))).equals(mail)
		})

		o.test("deleting an older mail in an existing conversation", async () => {
			await setUpTestData(2, labels, false, 2)
			await model.loadInitial()

			const oldMails = model.mails
			const newMails = [oldMails[0]]

			const oldItems = model.items
			const newItems = [...oldItems]

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailSetEntryTypeRef,
				instanceListId: mailSetEntriesListId,
				instanceId: makeMailSetElementId(0),
				operation: OperationType.DELETE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}

			o.check(model.mails).deepEquals(oldMails)
			o.check(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.mails).deepEquals(newMails)
			o.check(model.items).deepEquals(newItems)
			o.check(model.getMail(entityUpdateData.instanceId)).equals(null)
		})

		o.test("deleting the newest mail in an existing conversation of 3 items selects the second newest", async () => {
			await setUpTestData(3, labels, false, 3)
			await model.loadInitial()

			const oldMails = model.mails
			const newMails = [oldMails[1], oldMails[2]]

			const oldItems = model.items
			const newItems = [oldMails[1]]

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailSetEntryTypeRef,
				instanceListId: mailSetEntriesListId,
				instanceId: makeMailSetElementId(2),
				operation: OperationType.DELETE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}

			o.check(model.mails).deepEquals(oldMails)
			o.check(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.mails).deepEquals(newMails)
			o.check(model.items).deepEquals(newItems)
			o.check(model.getMail(entityUpdateData.instanceId)).equals(null)
		})

		o.test("deleting a newer mail in an existing conversation of 2 items", async () => {
			await setUpTestData(2, labels, false, 2)
			await model.loadInitial()

			const oldMails = model.mails
			const newMails = [oldMails[1]]

			const oldItems = model.items
			const newItems = [oldMails[1]]

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailSetEntryTypeRef,
				instanceListId: mailSetEntriesListId,
				instanceId: makeMailSetElementId(1),
				operation: OperationType.DELETE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}

			o.check(model.mails).deepEquals(oldMails)
			o.check(model.items).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.mails).deepEquals(newMails)
			o.check(model.items).deepEquals(newItems)
			o.check(model.getMail(entityUpdateData.instanceId)).equals(null)
		})

		o.test("creating a mail set entry in a different set does nothing", async () => {
			await setUpTestData(PageSize, labels, false, 1)
			await model.loadInitial()
			const { mail, entityUpdateData } = createInsertedMail(["something else", CUSTOM_MAX_ID], "whoo!")

			const oldItems = model.mails
			const newItems = [...oldItems]

			o.check(model.mails).deepEquals(oldItems)
			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.mails).deepEquals(newItems)
			o.check(model.getMail(getElementId(mail))).equals(null)
		})

		o.test("updating a mail updates the contents", async () => {
			await setUpTestData(PageSize, labels, false, 1)
			await model.loadInitial()
			const mail = { ...model.mails[2] }
			mail.subject = "hey it's a subject"
			mail.sets = [mailSet._id] // remove all labels

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailTypeRef,
				instanceListId: getListId(mail) as NonEmptyString,
				instanceId: getElementId(mail),
				operation: OperationType.UPDATE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}
			when(entityClient.load(MailTypeRef, mail._id)).thenResolve(mail)

			entityUpdateData.operation = OperationType.UPDATE

			const oldMails = model.mails
			const oldItems = model.items

			await model.handleEntityUpdate(entityUpdateData)

			o.check(model.getMail(getElementId(mail))).deepEquals(mail)
			o.check(model.getLabelsForMail(mail)).deepEquals([])

			// Referential equality is broken
			o.check(model.mails).notEquals(oldMails)
			o.check(model.items).notEquals(oldItems)
		})

		o.test("mail delete does nothing", async () => {
			await setUpTestData(PageSize, labels, false, 1)
			await model.loadInitial()
			const mail = { ...model.mails[2] }
			const entityUpdateData: EntityUpdateData = {
				typeRef: MailTypeRef,
				instanceListId: getListId(mail) as NonEmptyString,
				instanceId: getElementId(mail),
				operation: OperationType.UPDATE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}
			when(entityClient.load(MailTypeRef, mail._id)).thenResolve(mail)
			entityUpdateData.operation = OperationType.DELETE

			await model.handleEntityUpdate(entityUpdateData)
			o.check(model.getMail(getElementId(mail))).deepEquals(mail)
		})
	})

	o.spec("filter on ConversationList", () => {
		o.test("When filtering for unread mails only relevant conversations are shown", async () => {
			const allMails = await setUpTestData(2, [], false, 1)
			await model.loadInitial()

			o.check(model.items.length).equals(2)

			const unreadMail = allMails[0]
			unreadMail.unread = true

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailTypeRef,
				instanceListId: getListId(unreadMail) as NonEmptyString,
				instanceId: getElementId(unreadMail),
				operation: OperationType.UPDATE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}
			when(entityClient.load(MailTypeRef, unreadMail._id)).thenResolve(unreadMail)

			entityUpdateData.operation = OperationType.UPDATE

			await model.handleEntityUpdate(entityUpdateData)

			model.setFilter([getMailFilterForType(MailFilterType.Unread)])

			const unreadMails = model.items

			o.check(unreadMails.length).equals(1)
		})

		o.test("When the mail does not match filter after filter was set, it is still kept in the list", async () => {
			const allMails = await setUpTestData(2, [], false, 1)
			await model.loadInitial()

			o.check(model.items.length).equals(2)

			model.setFilter([getMailFilterForType(MailFilterType.Read)])

			const unreadMail = allMails[0]
			unreadMail.unread = true

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailTypeRef,
				instanceListId: getListId(unreadMail) as NonEmptyString,
				instanceId: getElementId(unreadMail),
				operation: OperationType.UPDATE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}
			when(entityClient.load(MailTypeRef, unreadMail._id)).thenResolve(unreadMail)

			entityUpdateData.operation = OperationType.UPDATE

			await model.handleEntityUpdate(entityUpdateData)

			const unreadMails = model.items

			o.check(unreadMails.length).equals(2)
		})

		o.test("When filter is set, the relevant Email in the conversation is shown", async () => {
			const allMails = await setUpTestData(5, [], false, 5)
			await model.loadInitial()

			let displayedItem = model.items

			o.check(isSameId(displayedItem[0]._id, allMails[0]._id)).equals(true)

			const unreadMail = allMails[2]
			unreadMail.unread = true

			const entityUpdateData: EntityUpdateData = {
				typeRef: MailTypeRef,
				instanceListId: getListId(unreadMail) as NonEmptyString,
				instanceId: getElementId(unreadMail),
				operation: OperationType.UPDATE,
				...noPatchesAndInstance,
				prefetchStatus: PrefetchStatus.NotPrefetched,
			}
			when(entityClient.load(MailTypeRef, unreadMail._id)).thenResolve(unreadMail)

			entityUpdateData.operation = OperationType.UPDATE

			await model.handleEntityUpdate(entityUpdateData)

			model.setFilter([getMailFilterForType(MailFilterType.Unread)])

			displayedItem = model.items

			o.check(isSameId(displayedItem[0]._id, unreadMail._id)).equals(true)
		})
	})
})
