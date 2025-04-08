import { IndexerCore } from "./IndexerCore"
import { assertNotNull } from "@tutao/tutanota-utils"
import { File as TutanotaFile, Mail, MailDetails, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import {
	elementIdPart,
	getElementId,
	LEGACY_BCC_RECIPIENTS_ID,
	LEGACY_BODY_ID,
	LEGACY_CC_RECIPIENTS_ID,
	LEGACY_TO_RECIPIENTS_ID,
} from "../../../common/api/common/utils/EntityUtils"
import { Metadata } from "../../../common/api/worker/search/IndexTables"
import { IndexUpdate, SearchIndexEntry } from "../../../common/api/worker/search/SearchTypes"
import { _createNewIndexUpdate, getPerformanceTimestamp, htmlToText, typeRefToTypeInfo } from "../../../common/api/worker/search/IndexUtils"
import { getDisplayedSender, getMailBodyText, MailAddressAndName } from "../../../common/api/common/CommonMailUtils"
import { GroupTimestamps, MailIndexerBackend, MailWithDetailsAndAttachments } from "./MailIndexerBackend"
import { ClientTypeModelResolver } from "../../../common/api/common/EntityFunctions"
import { AttributeModel } from "../../../common/api/common/AttributeModel"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"

export class IndexedDbMailIndexerBackend implements MailIndexerBackend {
	constructor(private readonly core: IndexerCore, private readonly userId: Id, private readonly typeModelResolver: ClientTypeModelResolver) {}

	getCurrentIndexTimestamps(groupIds: readonly Id[]): Promise<Map<Id, number>> {
		return this.core.getGroupIndexTimestamps(groupIds)
	}

	async indexMails(dataPerGroup: GroupTimestamps, mailsWithDetails: readonly MailWithDetailsAndAttachments[]): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		for (const element of mailsWithDetails) {
			const keyToIndexEntries = await this.createMailIndexEntries(element.mail, element.mailDetails, element.attachments)
			await this.core.encryptSearchIndexEntries(element.mail._id, assertNotNull(element.mail._ownerGroup), keyToIndexEntries, indexUpdate)
		}
		await this.core.writeIndexUpdateWithIndexTimestamps(
			Array.from(dataPerGroup).map(([id, timestamp]) => ({
				groupId: id,
				indexTimestamp: timestamp,
			})),
			indexUpdate,
		)
	}

	async onMailCreated({ mail, mailDetails, attachments }: MailWithDetailsAndAttachments): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		const indexEntries = await this.createMailIndexEntries(mail, mailDetails, attachments)
		await this.core.encryptSearchIndexEntries(mail._id, assertNotNull(mail._ownerGroup), indexEntries, indexUpdate)
		await this.core.writeIndexUpdate(indexUpdate)
	}

	async onMailUpdated({ mail, mailDetails, attachments }: MailWithDetailsAndAttachments): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		await this.core._processDeleted(MailTypeRef, getElementId(mail), indexUpdate)
		const indexEntries = await this.createMailIndexEntries(mail, mailDetails, attachments)
		await this.core.encryptSearchIndexEntries(mail._id, assertNotNull(mail._ownerGroup), indexEntries, indexUpdate)
		await this.core.writeIndexUpdate(indexUpdate)
	}

	async onMailDeleted(mailId: IdTuple): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		await this.core._processDeleted(MailTypeRef, elementIdPart(mailId), indexUpdate)
		await this.core.writeIndexUpdate(indexUpdate)
	}

	async onBeforeMailDeleted(_: IdTuple): Promise<void> {
		// no-op: does processing in  onMailDeleted()
	}

	async enableIndexing(): Promise<void> {
		await this.core.storeMetadata(Metadata.mailIndexingEnabled, true)
	}

	async isMailIndexingEnabled(): Promise<boolean> {
		const storedValue = (await this.core.getMetadata(Metadata.mailIndexingEnabled)) as boolean | null
		return storedValue ?? false
	}

	private createIndexUpdate(): IndexUpdate {
		return _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
	}

	/** @private visibleForTesting */
	async createMailIndexEntries(mail: Mail, mailDetails: MailDetails, files: readonly TutanotaFile[]): Promise<Map<string, SearchIndexEntry[]>> {
		let startTimeIndex = getPerformanceTimestamp()

		// avoid caching system@tutanota.de since the user wouldn't be searching for this
		let senderToIndex: MailAddressAndName

		const hasSender = mail.sender != null
		if (hasSender) senderToIndex = getDisplayedSender(mail)

		const MailModel = await this.typeModelResolver.resolveClientTypeReference(MailTypeRef)
		const keyToIndexEntries = this.core.createIndexEntriesForAttributes(mail, [
			{
				// assertNotNull(AttributeModel.getAttributeId(ContactModel, "firstName")),
				id: assertNotNull(AttributeModel.getAttributeId(MailModel, "subject")),
				value: () => mail.subject,
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				id: LEGACY_TO_RECIPIENTS_ID,
				value: () => mailDetails.recipients.toRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				id: LEGACY_CC_RECIPIENTS_ID,
				value: () => mailDetails.recipients.ccRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				id: LEGACY_BCC_RECIPIENTS_ID,
				value: () => mailDetails.recipients.bccRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(MailModel, "sender")),
				value: () => (hasSender ? senderToIndex.name + " <" + senderToIndex.address + ">" : ""),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				id: LEGACY_BODY_ID,
				value: () => htmlToText(getMailBodyText(mailDetails.body)),
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(MailModel, "attachments")),
				value: () => files.map((file) => file.name).join(" "),
			},
		])

		return keyToIndexEntries
	}

	truncateAllCurrentIndexTimestamps(_newTimestamp: number): Promise<void> {
		throw new ProgrammingError("truncateAllCurrentIndexTimestamps can only be called with offline storage")
	}
}
