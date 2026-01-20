import o from "@tutao/otest"
import {
	SINGLE_TRAIN_INTERVAL_TRAINING_DATA_LIMIT,
	SpamClassifierDataDealer,
	UnencryptedPopulateClientSpamTrainingDatum,
} from "../../../../../../src/mail-app/workerUtils/spamClassification/SpamClassifierDataDealer"
import {
	ClientSpamTrainingDatum,
	ClientSpamTrainingDatumIndexEntryTypeRef,
	ClientSpamTrainingDatumTypeRef,
	MailBagTypeRef,
	MailBox,
	MailboxGroupRoot,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailDetails,
	MailDetailsTypeRef,
	MailSetRefTypeRef,
	MailSetTypeRef,
	MailTypeRef,
} from "../../../../../../src/common/api/entities/tutanota/TypeRefs"
import { MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION, SpamDecision } from "../../../../../../src/common/api/common/TutanotaConstants"
import { matchers, object, verify, when } from "testdouble"
import { EntityClient } from "../../../../../../src/common/api/common/EntityClient"
import { BulkMailLoader } from "../../../../../../src/mail-app/workerUtils/index/BulkMailLoader"
import { MailFacade } from "../../../../../../src/common/api/worker/facades/lazy/MailFacade"
import { createTestEntity } from "../../../../TestUtils"
import { compareNewestFirst, GENERATED_MIN_ID, getElementId, isSameId } from "../../../../../../src/common/api/common/utils/EntityUtils"
import { DEFAULT_IS_SPAM_CONFIDENCE } from "../../../../../../src/common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { last } from "@tutao/tutanota-utils"

const { anything } = matchers

function createMailByFolderAndReceivedDate(mailId: IdTuple, mailSet: IdTuple, receivedDate: Date, mailDetailsId: Id) {
	return createTestEntity(MailTypeRef, {
		_id: mailId,
		sets: [mailSet],
		receivedDate: receivedDate,
		mailDetails: ["detailsListId", mailDetailsId],
	})
}

function createSpamTrainingDatumByConfidenceAndDecision(
	confidence: string,
	spamDecision: SpamDecision,
	id: IdTuple = ["listId", "elementId"],
): ClientSpamTrainingDatum {
	return createTestEntity(ClientSpamTrainingDatumTypeRef, {
		_id: id,
		_ownerGroup: "group",
		confidence,
		spamDecision,
		vector: new Uint8Array(),
	})
}

function createClientSpamTrainingDatumIndexEntryByClientSpamTrainingDatumElementId(clientSpamTrainingDatumElementId: Id) {
	return createTestEntity(ClientSpamTrainingDatumIndexEntryTypeRef, { clientSpamTrainingDatumElementId })
}

function getSortableTestMailId(isSpam: boolean, index: number) {
	const formattedIndex = (index < 100 ? (index < 10 ? "00" : "0") : "") + index
	if (isSpam) {
		return "spamMailId" + formattedIndex
	} else {
		return "inboxMailId" + formattedIndex
	}
}

o.spec("SpamClassifierDataDealer", () => {
	const entityClientMock = object<EntityClient>()
	const bulkMailLoaderMock = object<BulkMailLoader>()
	const mailFacadeMock = object<MailFacade>()
	let mailDetails: MailDetails
	let spamClassificationDataDealer: SpamClassifierDataDealer
	let mailboxGroupRoot: MailboxGroupRoot
	let mailBox: MailBox

	const inboxFolder = createTestEntity(MailSetTypeRef, {
		_id: ["folderListId", "inbox"],
		_ownerGroup: "owner",
		folderType: MailSetKind.INBOX,
	})
	const trashFolder = createTestEntity(MailSetTypeRef, {
		_id: ["folderListId", "trash"],
		_ownerGroup: "owner",
		folderType: MailSetKind.TRASH,
	})
	const spamFolder = createTestEntity(MailSetTypeRef, {
		_id: ["folderListId", "spam"],
		_ownerGroup: "owner",
		folderType: MailSetKind.SPAM,
	})

	o.beforeEach(function () {
		mailboxGroupRoot = createTestEntity(MailboxGroupRootTypeRef, {
			_ownerGroup: "owner",
			mailbox: "mailbox",
		})
		mailBox = createTestEntity(MailBoxTypeRef, {
			_id: "mailbox",
			_ownerGroup: "owner",
			mailSets: createTestEntity(MailSetRefTypeRef, { mailSets: "folderListId" }),
			currentMailBag: createTestEntity(MailBagTypeRef, { mails: "mailListId" }),
			archivedMailBags: [createTestEntity(MailBagTypeRef, { mails: "oldMailListId" })],
			clientSpamTrainingData: "clientSpamTrainingData",
			modifiedClientSpamTrainingDataIndex: "modifiedClientSpamTrainingDataIndex",
		})
		mailDetails = createTestEntity(MailDetailsTypeRef, { _id: "mailDetail" })
		when(mailFacadeMock.vectorizeAndCompressMails(anything())).thenResolve(new Uint8Array(1))
		spamClassificationDataDealer = new SpamClassifierDataDealer(
			entityClientMock,
			() => Promise.resolve(bulkMailLoaderMock),
			() => Promise.resolve(mailFacadeMock),
		)
	})

	o.spec("subsampleHamAndSpamMails", () => {
		o("does not subsample if ratio is balanced", () => {
			const data = [
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST),
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST),
			]
			const { subsampledTrainingData, hamCount, spamCount } = spamClassificationDataDealer.subsampleHamAndSpamMails(data)
			o(subsampledTrainingData.length).equals(2)
			o(hamCount).equals(1)
			o(spamCount).equals(1)
		})

		o("limits ham when ratio > MAX_RATIO", () => {
			const hamData = Array.from({ length: 50 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST))
			const spamData = Array.from({ length: 1 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST))
			const { subsampledTrainingData, hamCount, spamCount } = spamClassificationDataDealer.subsampleHamAndSpamMails([...hamData, ...spamData])
			o(hamCount).equals(10)
			o(spamCount).equals(1)
			o(subsampledTrainingData.length).equals(11)
		})

		o("limits spam when ratio < MIN_RATIO", () => {
			const hamData = Array.from({ length: 1 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST))
			const spamData = Array.from({ length: 50 }, () =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST),
			)

			const { subsampledTrainingData, hamCount, spamCount } = spamClassificationDataDealer.subsampleHamAndSpamMails([...hamData, ...spamData])
			o(hamCount).equals(1)
			o(spamCount).equals(10)
			o(subsampledTrainingData.length).equals(11)
		})

		o("respects ratio when # of mails > MAX_MAIL_CAP", () => {
			const hamData = Array.from({ length: 60 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST))
			const spamData = Array.from({ length: 40 }, () =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST),
			)
			const DUMMY_MAX_MAIL_CAP = 20

			const { subsampledTrainingData, hamCount, spamCount } = spamClassificationDataDealer.subsampleHamAndSpamMails(
				[...hamData, ...spamData],
				DUMMY_MAX_MAIL_CAP,
			)
			o(hamCount).equals(12)
			o(spamCount).equals(8)
			o(subsampledTrainingData.length).equals(20)
		})

		o("respects ratio when # of mails > MAX_MAIL_CAP (ratio > MAX_RATIO)", () => {
			const hamData = Array.from({ length: 50 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST))
			const spamData = Array.from({ length: 2 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST))
			const DUMMY_MAX_MAIL_CAP = 11

			const { subsampledTrainingData, hamCount, spamCount } = spamClassificationDataDealer.subsampleHamAndSpamMails(
				[...hamData, ...spamData],
				DUMMY_MAX_MAIL_CAP,
			)
			o(hamCount).equals(10)
			o(spamCount).equals(1)
			o(subsampledTrainingData.length).equals(11)
		})

		o("respects ratio when # of mails > MAX_MAIL_CAP (ratio < MIN_RATIO)", () => {
			const hamData = Array.from({ length: 2 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST))
			const spamData = Array.from({ length: 50 }, () =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST),
			)
			const DUMMY_MAX_MAIL_CAP = 11

			const { subsampledTrainingData, hamCount, spamCount } = spamClassificationDataDealer.subsampleHamAndSpamMails(
				[...hamData, ...spamData],
				DUMMY_MAX_MAIL_CAP,
			)
			o(hamCount).equals(1)
			o(spamCount).equals(10)
			o(subsampledTrainingData.length).equals(11)
		})

		o("prioritizes high confidence mails when capping", () => {
			const hamData = Array.from({ length: 50 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST))
			const hamDataWithHighConfidence = Array.from({ length: 50 }, () => createSpamTrainingDatumByConfidenceAndDecision("4", SpamDecision.WHITELIST))
			const spamData = Array.from({ length: 5 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST))
			const spamDataWithHighConfidence = Array.from({ length: 5 }, () => createSpamTrainingDatumByConfidenceAndDecision("4", SpamDecision.BLACKLIST))

			const DUMMY_MAX_MAIL_CAP = 11

			const { subsampledTrainingData, hamCount, spamCount } = spamClassificationDataDealer.subsampleHamAndSpamMails(
				[...hamData, ...spamData, ...hamDataWithHighConfidence, ...spamDataWithHighConfidence],
				DUMMY_MAX_MAIL_CAP,
			)
			o(hamCount).equals(10)
			o(spamCount).equals(1)
			o(subsampledTrainingData.length).equals(11)
			o(subsampledTrainingData.every((datum) => datum.confidence === "4")).equals(true)
		})
	})

	o.spec("fetchAllTrainingData", () => {
		o("uploads training data when clientSpamTrainingData is empty", async () => {
			when(entityClientMock.load(MailboxGroupRootTypeRef, "owner")).thenResolve(mailboxGroupRoot)
			when(entityClientMock.load(MailBoxTypeRef, "mailbox")).thenResolve(mailBox)
			const mails = Array.from({ length: 10 }, (_, index) =>
				createMailByFolderAndReceivedDate([mailBox.currentMailBag!.mails, "inboxMailId" + index], inboxFolder._id, new Date(), mailDetails._id),
			).concat(
				Array.from({ length: 10 }, (_, index) =>
					createMailByFolderAndReceivedDate([mailBox.currentMailBag!.mails, "spamMailId" + index], spamFolder._id, new Date(), mailDetails._id),
				),
			)
			const spamTrainingData = Array.from({ length: 10 }, (_, index) =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST, [
					mailBox.clientSpamTrainingData,
					getElementId(mails[index]),
				]),
			).concat(
				Array.from({ length: 10 }, (_, index) =>
					createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST, [
						mailBox.clientSpamTrainingData,
						getElementId(mails[10 + index]),
					]),
				),
			)
			const modifiedIndicesSinceStart = spamTrainingData.map((data) =>
				createClientSpamTrainingDatumIndexEntryByClientSpamTrainingDatumElementId(getElementId(data)),
			)
			when(entityClientMock.loadAll(ClientSpamTrainingDatumTypeRef, mailBox.clientSpamTrainingData)).thenResolve([], spamTrainingData)
			when(entityClientMock.loadAll(MailTypeRef, mailBox.currentMailBag!.mails, anything())).thenResolve(mails)
			when(entityClientMock.loadAll(MailTypeRef, mailBox.archivedMailBags[0].mails, anything())).thenResolve([])
			when(entityClientMock.loadAll(MailSetTypeRef, mailBox.mailSets.mailSets)).thenResolve([inboxFolder, spamFolder, trashFolder])
			when(entityClientMock.loadAll(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex)).thenResolve(
				modifiedIndicesSinceStart,
			)

			when(bulkMailLoaderMock.loadMailDetails(mails)).thenResolve(
				mails.map((mail) => {
					return { mail, mailDetails }
				}),
			)

			const trainingDataset = await spamClassificationDataDealer.fetchAllTrainingData("owner")

			// first load: empty, second load: fetch uploaded data
			verify(entityClientMock.loadAll(ClientSpamTrainingDatumTypeRef, mailBox.clientSpamTrainingData), { times: 2 })
			verify(entityClientMock.loadAll(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex), { times: 1 })
			const unencryptedPayload = mails.map((mail) => {
				return {
					mailId: mail._id,
					isSpam: isSameId(mail.sets[0], spamFolder._id),
					confidence: DEFAULT_IS_SPAM_CONFIDENCE,
					vector: new Uint8Array(1),
				} as UnencryptedPopulateClientSpamTrainingDatum
			})
			verify(mailFacadeMock.populateClientSpamTrainingData("owner", unencryptedPayload), { times: 1 })

			o(trainingDataset).deepEquals({
				trainingData: spamTrainingData,
				lastTrainingDataIndexId: getElementId(last(modifiedIndicesSinceStart)!),
				hamCount: 10,
				spamCount: 10,
			})
		})

		o("uploads training data when clientSpamTrainingData does not include all relevant mails", async () => {
			when(entityClientMock.load(MailboxGroupRootTypeRef, "owner")).thenResolve(mailboxGroupRoot)
			when(entityClientMock.load(MailBoxTypeRef, "mailbox")).thenResolve(mailBox)

			const relevantMails = Array.from({ length: 40 }, (_, index) =>
				createMailByFolderAndReceivedDate(
					[mailBox.currentMailBag!.mails, getSortableTestMailId(false, index)],
					inboxFolder._id,
					new Date(),
					mailDetails._id,
				),
			).concat(
				Array.from({ length: 40 }, (_, index) =>
					createMailByFolderAndReceivedDate(
						[mailBox.currentMailBag!.mails, getSortableTestMailId(true, index)],
						spamFolder._id,
						new Date(),
						mailDetails._id,
					),
				),
			)

			const existingSpamTrainingData = Array.from({ length: 20 }, (_, index) =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST, [
					mailBox.clientSpamTrainingData,
					getElementId(relevantMails[index]),
				]),
			).concat(
				Array.from({ length: 20 }, (_, index) =>
					createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST, [
						mailBox.clientSpamTrainingData,
						getElementId(relevantMails[40 + index]),
					]),
				),
			)

			const updatedSpamTrainingData = Array.from({ length: 40 }, (_, index) =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST, [
					mailBox.clientSpamTrainingData,
					getElementId(relevantMails[index]),
				]),
			).concat(
				Array.from({ length: 40 }, (_, index) =>
					createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST, [
						mailBox.clientSpamTrainingData,
						getElementId(relevantMails[40 + index]),
					]),
				),
			)

			const modifiedIndicesSinceStart = updatedSpamTrainingData.map((data) =>
				createClientSpamTrainingDatumIndexEntryByClientSpamTrainingDatumElementId(getElementId(data)),
			)

			when(entityClientMock.loadAll(ClientSpamTrainingDatumTypeRef, mailBox.clientSpamTrainingData)).thenResolve(
				existingSpamTrainingData,
				updatedSpamTrainingData,
			)
			when(entityClientMock.loadAll(MailTypeRef, mailBox.currentMailBag!.mails, anything())).thenResolve(relevantMails)
			when(entityClientMock.loadAll(MailTypeRef, mailBox.archivedMailBags[0].mails, anything())).thenResolve([])
			when(entityClientMock.loadAll(MailSetTypeRef, mailBox.mailSets.mailSets)).thenResolve([inboxFolder, spamFolder, trashFolder])
			when(entityClientMock.loadAll(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex)).thenResolve(
				modifiedIndicesSinceStart,
			)

			const expectedUploadMailsHam = relevantMails.slice(20, 40)
			const expectedUploadMailsSpam = relevantMails.slice(60, 80)
			const expectUploadMailsTotal = expectedUploadMailsHam.concat(expectedUploadMailsSpam)

			when(bulkMailLoaderMock.loadMailDetails(expectUploadMailsTotal)).thenResolve(
				expectUploadMailsTotal.map((mail) => {
					return { mail, mailDetails }
				}),
			)

			const trainingDataset = await spamClassificationDataDealer.fetchAllTrainingData("owner")

			// first load: empty, second load: fetch uploaded data
			verify(entityClientMock.loadAll(ClientSpamTrainingDatumTypeRef, mailBox.clientSpamTrainingData), { times: 2 })
			verify(entityClientMock.loadAll(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex), { times: 1 })

			const unencryptedPayload = expectUploadMailsTotal.map((mail) => {
				return {
					mailId: mail._id,
					isSpam: isSameId(mail.sets[0], spamFolder._id),
					confidence: DEFAULT_IS_SPAM_CONFIDENCE,
					vector: new Uint8Array(1),
				} as UnencryptedPopulateClientSpamTrainingDatum
			})
			verify(mailFacadeMock.populateClientSpamTrainingData("owner", unencryptedPayload), { times: 1 })

			o(trainingDataset).deepEquals({
				trainingData: updatedSpamTrainingData,
				lastTrainingDataIndexId: getElementId(last(modifiedIndicesSinceStart)!),
				hamCount: 40,
				spamCount: 40,
			})
		})

		o("uploads training data in multiple chunks", async () => {
			when(entityClientMock.load(MailboxGroupRootTypeRef, "owner")).thenResolve(mailboxGroupRoot)
			when(entityClientMock.load(MailBoxTypeRef, "mailbox")).thenResolve(mailBox)

			const relevantMails = Array.from({ length: 80 }, (_, index) => {
				return createMailByFolderAndReceivedDate(
					[mailBox.currentMailBag!.mails, getSortableTestMailId(false, index)],
					inboxFolder._id,
					new Date(),
					mailDetails._id,
				)
			}).concat(
				Array.from({ length: 80 }, (_, index) =>
					createMailByFolderAndReceivedDate(
						[mailBox.currentMailBag!.mails, getSortableTestMailId(true, index)],
						spamFolder._id,
						new Date(),
						mailDetails._id,
					),
				),
			)

			const existingSpamTrainingData = Array.from({ length: 40 }, (_, index) =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST, [
					mailBox.clientSpamTrainingData,
					getElementId(relevantMails[index]),
				]),
			).concat(
				Array.from({ length: 40 }, (_, index) =>
					createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST, [
						mailBox.clientSpamTrainingData,
						getElementId(relevantMails[80 + index]),
					]),
				),
			)

			const updatedSpamTrainingData = Array.from({ length: 80 }, (_, index) =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST, [
					mailBox.clientSpamTrainingData,
					getElementId(relevantMails[index]),
				]),
			).concat(
				Array.from({ length: 80 }, (_, index) =>
					createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST, [
						mailBox.clientSpamTrainingData,
						getElementId(relevantMails[80 + index]),
					]),
				),
			)

			const modifiedIndicesSinceStart = updatedSpamTrainingData.map((data) =>
				createClientSpamTrainingDatumIndexEntryByClientSpamTrainingDatumElementId(getElementId(data)),
			)

			when(entityClientMock.loadAll(ClientSpamTrainingDatumTypeRef, mailBox.clientSpamTrainingData)).thenResolve(
				existingSpamTrainingData,
				updatedSpamTrainingData,
			)
			when(entityClientMock.loadAll(MailTypeRef, mailBox.currentMailBag!.mails, anything())).thenResolve(relevantMails)
			when(entityClientMock.loadAll(MailTypeRef, mailBox.archivedMailBags[0].mails, anything())).thenResolve([])
			when(entityClientMock.loadAll(MailSetTypeRef, mailBox.mailSets.mailSets)).thenResolve([inboxFolder, spamFolder, trashFolder])
			when(entityClientMock.loadAll(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex)).thenResolve(
				modifiedIndicesSinceStart,
			)

			const expectedUploadMailsHam = relevantMails.slice(40, 80)
			const expectedUploadMailsSpam = relevantMails.slice(120, 160)
			const expectUploadMailsTotal = expectedUploadMailsHam.concat(expectedUploadMailsSpam)

			const expectedFirstChunk = expectUploadMailsTotal.slice(0, MAX_NBR_OF_MAILS_SYNC_OPERATION)
			const expectedSecondChunk = expectUploadMailsTotal.slice(MAX_NBR_OF_MAILS_SYNC_OPERATION, expectUploadMailsTotal.length)
			when(bulkMailLoaderMock.loadMailDetails(expectedFirstChunk)).thenResolve(
				expectedFirstChunk.map((mail) => {
					return { mail, mailDetails }
				}),
			)
			when(bulkMailLoaderMock.loadMailDetails(expectedSecondChunk)).thenResolve(
				expectedSecondChunk.map((mail) => {
					return { mail, mailDetails }
				}),
			)

			const trainingDataset = await spamClassificationDataDealer.fetchAllTrainingData("owner")

			// first load: empty, second load: fetch uploaded data
			verify(entityClientMock.loadAll(ClientSpamTrainingDatumTypeRef, mailBox.clientSpamTrainingData), { times: 2 })
			verify(entityClientMock.loadAll(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex), { times: 1 })

			const firstUnencryptedPayload = expectedFirstChunk.map((mail) => {
				return {
					mailId: mail._id,
					isSpam: isSameId(mail.sets[0], spamFolder._id),
					confidence: DEFAULT_IS_SPAM_CONFIDENCE,
					vector: new Uint8Array(1),
				} as UnencryptedPopulateClientSpamTrainingDatum
			})
			const secondUnencryptedPayload = expectedSecondChunk.map((mail) => {
				return {
					mailId: mail._id,
					isSpam: isSameId(mail.sets[0], spamFolder._id),
					confidence: DEFAULT_IS_SPAM_CONFIDENCE,
					vector: new Uint8Array(1),
				} as UnencryptedPopulateClientSpamTrainingDatum
			})
			verify(mailFacadeMock.populateClientSpamTrainingData("owner", firstUnencryptedPayload), { times: 1 })
			verify(mailFacadeMock.populateClientSpamTrainingData("owner", secondUnencryptedPayload), { times: 1 })

			o(trainingDataset).deepEquals({
				trainingData: updatedSpamTrainingData.sort((l, r) => compareNewestFirst(l._id, r._id)),
				lastTrainingDataIndexId: getElementId(last(modifiedIndicesSinceStart)!),
				hamCount: 80,
				spamCount: 80,
			})
		})

		o("successfully returns training data with mixed ham/spam data", async () => {
			when(entityClientMock.load(MailboxGroupRootTypeRef, "owner")).thenResolve(mailboxGroupRoot)
			when(entityClientMock.load(MailBoxTypeRef, "mailbox")).thenResolve(mailBox)
			when(entityClientMock.loadAll(MailTypeRef, anything(), anything())).thenResolve([])

			const spamTrainingData = Array.from({ length: 10 }, () =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST),
			).concat(Array.from({ length: 10 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST)))
			const modifiedIndicesSinceStart = spamTrainingData.map((data) =>
				createClientSpamTrainingDatumIndexEntryByClientSpamTrainingDatumElementId(getElementId(data)),
			)
			when(entityClientMock.loadAll(ClientSpamTrainingDatumTypeRef, mailBox.clientSpamTrainingData)).thenResolve(spamTrainingData)
			when(entityClientMock.loadAll(MailSetTypeRef, mailBox.mailSets.mailSets)).thenResolve([inboxFolder, spamFolder, trashFolder])
			when(entityClientMock.loadAll(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex)).thenResolve(
				modifiedIndicesSinceStart,
			)

			const trainingDataset = await spamClassificationDataDealer.fetchAllTrainingData("owner")

			// only one load as the list is already populated
			verify(entityClientMock.loadAll(ClientSpamTrainingDatumTypeRef, mailBox.clientSpamTrainingData), { times: 1 })
			verify(entityClientMock.loadAll(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex), { times: 1 })

			o(trainingDataset).deepEquals({
				trainingData: spamTrainingData,
				lastTrainingDataIndexId: getElementId(last(modifiedIndicesSinceStart)!),
				hamCount: 10,
				spamCount: 10,
			})
		})

		o("filters out training data with confidence=0 or spamDecision NONE", async () => {
			const noneDecisionData = createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.NONE)
			const zeroConfData = createSpamTrainingDatumByConfidenceAndDecision("0", SpamDecision.WHITELIST)
			const validHamData = createSpamTrainingDatumByConfidenceAndDecision("1", SpamDecision.WHITELIST)
			const validSpamData = createSpamTrainingDatumByConfidenceAndDecision("4", SpamDecision.BLACKLIST)
			when(entityClientMock.load(MailboxGroupRootTypeRef, "owner")).thenResolve(mailboxGroupRoot)
			when(entityClientMock.load(MailBoxTypeRef, "mailbox")).thenResolve(mailBox)
			when(entityClientMock.loadAll(MailTypeRef, anything(), anything())).thenResolve([])

			const spamTrainingData = [noneDecisionData, zeroConfData, validSpamData, validHamData]
			const modifiedIndicesSinceStart = spamTrainingData.map((data) =>
				createClientSpamTrainingDatumIndexEntryByClientSpamTrainingDatumElementId(getElementId(data)),
			)
			when(entityClientMock.loadAll(ClientSpamTrainingDatumTypeRef, mailBox.clientSpamTrainingData)).thenResolve(spamTrainingData)

			when(entityClientMock.loadAll(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex)).thenResolve(
				modifiedIndicesSinceStart,
			)

			when(entityClientMock.loadAll(MailSetTypeRef, mailBox.mailSets.mailSets)).thenResolve([inboxFolder, spamFolder, trashFolder])

			const result = await spamClassificationDataDealer.fetchAllTrainingData("owner")

			o(result.trainingData.length).equals(2)
			o(result.spamCount).equals(1)
			o(result.hamCount).equals(1)
			o(new Set(result.trainingData)).deepEquals(new Set([validSpamData, validHamData]))
		})
	})

	o.spec("fetchPartialTrainingDataFromIndexStartId", () => {
		o("returns empty training data when modifiedClientSpamTrainingDataIndicesSinceStart are null", async () => {
			when(entityClientMock.load(MailboxGroupRootTypeRef, "owner")).thenResolve(mailboxGroupRoot)
			when(entityClientMock.load(MailBoxTypeRef, "mailbox")).thenResolve(mailBox)
			when(
				entityClientMock.loadRange(
					ClientSpamTrainingDatumIndexEntryTypeRef,
					mailBox.modifiedClientSpamTrainingDataIndex,
					"startId",
					SINGLE_TRAIN_INTERVAL_TRAINING_DATA_LIMIT,
					false,
				),
			).thenResolve([])

			const trainingDataset = await spamClassificationDataDealer.fetchPartialTrainingDataFromIndexStartId("startId", "owner")

			o(trainingDataset.trainingData.length).equals(0)
			o(trainingDataset.hamCount).equals(0)
			o(trainingDataset.spamCount).equals(0)
			o(trainingDataset.lastTrainingDataIndexId).equals("startId")
		})

		o("returns new training data when index or training data is there", async () => {
			when(entityClientMock.load(MailboxGroupRootTypeRef, "owner")).thenResolve(mailboxGroupRoot)
			when(entityClientMock.load(MailBoxTypeRef, "mailbox")).thenResolve(mailBox)

			const oldSpamTrainingData = Array.from({ length: 50 }, () =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST),
			).concat(Array.from({ length: 50 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST)))

			oldSpamTrainingData.map((data) => (data._id = [mailBox.clientSpamTrainingData, GENERATED_MIN_ID]))

			const newSpamTrainingData = Array.from({ length: 10 }, () =>
				createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.WHITELIST),
			).concat(Array.from({ length: 10 }, () => createSpamTrainingDatumByConfidenceAndDecision(DEFAULT_IS_SPAM_CONFIDENCE, SpamDecision.BLACKLIST)))

			newSpamTrainingData.map((data) => (data._id = [mailBox.clientSpamTrainingData, GENERATED_MIN_ID]))

			const modifiedIndicesSinceStart = newSpamTrainingData.map((data) =>
				createClientSpamTrainingDatumIndexEntryByClientSpamTrainingDatumElementId(getElementId(data)),
			)

			when(
				entityClientMock.loadRange(ClientSpamTrainingDatumIndexEntryTypeRef, mailBox.modifiedClientSpamTrainingDataIndex, "startId", anything(), false),
			).thenResolve(modifiedIndicesSinceStart)

			when(
				entityClientMock.loadMultiple(
					ClientSpamTrainingDatumTypeRef,
					mailBox.clientSpamTrainingData,
					modifiedIndicesSinceStart.map((index) => index.clientSpamTrainingDatumElementId),
				),
			).thenResolve(newSpamTrainingData)

			const trainingDataset = await spamClassificationDataDealer.fetchPartialTrainingDataFromIndexStartId("startId", "owner")

			o(trainingDataset.trainingData.length).equals(20)
			o(trainingDataset.hamCount).equals(10)
			o(trainingDataset.spamCount).equals(10)
			o(trainingDataset.lastTrainingDataIndexId).equals(getElementId(last(modifiedIndicesSinceStart)!))
		})
	})

	o.spec("fetchMailsByMailbagAfterDate", () => {
		o("correctly filters mails with received date greater than start date", async () => {
			const startDate = new Date(2020, 11, 30)
			const dayBeforeStart = new Date(2020, 11, 29)
			const recentMails = Array.from({ length: 10 }, () =>
				createMailByFolderAndReceivedDate([mailBox.currentMailBag!.mails, "inboxMailId"], inboxFolder._id, new Date(2025, 11, 17), mailDetails._id),
			)
			const oldMails = Array.from({ length: 10 }, () =>
				createMailByFolderAndReceivedDate([mailBox.currentMailBag!.mails, "inboxMailId"], inboxFolder._id, dayBeforeStart, mailDetails._id),
			)
			const mails = recentMails.concat(oldMails)
			when(entityClientMock.loadAll(MailTypeRef, mailBox.currentMailBag!.mails, anything())).thenResolve(mails)
			when(bulkMailLoaderMock.loadMailDetails(recentMails)).thenResolve(
				recentMails.map((mail) => {
					return { mail, mailDetails }
				}),
			)
			const result = await spamClassificationDataDealer.fetchMailsByMailbagAfterDate(
				mailBox.currentMailBag!,
				[inboxFolder, spamFolder, trashFolder],
				startDate,
			)
			o(result.length).equals(10)
		})
	})
})
