import { b64UserIdHash, DbFacade } from "../../../common/api/worker/search/DbFacade"
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
import { Metadata, MetaDataOS } from "../../../common/api/worker/search/IndexTables"
import { IndexUpdate, SearchIndexEntry } from "../../../common/api/worker/search/SearchTypes"
import { _createNewIndexUpdate, getPerformanceTimestamp, htmlToText, typeRefToTypeInfo } from "../../../common/api/worker/search/IndexUtils"
import { getDisplayedSender, getMailBodyText, MailAddressAndName } from "../../../common/api/common/CommonMailUtils"
import { typeModels } from "../../../common/api/entities/tutanota/TypeModels"
import { GroupTimestamps, MailIndexerBackend, MailWithDetailsAndAttachments } from "./MailIndexerBackend"

export class IndexedDbMailIndexerBackend implements MailIndexerBackend {
	constructor(private readonly dbFacade: DbFacade, private readonly core: IndexerCore, private readonly userId: Id) {}

	async init() {}

	getCurrentIndexTimestamps(groupIds: readonly Id[]): Promise<Map<Id, number>> {
		return this.core.getGroupIndexTimestamps(groupIds)
	}

	async indexMails(dataPerGroup: GroupTimestamps, mailsWithDetails: readonly MailWithDetailsAndAttachments[]): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		for (const element of mailsWithDetails) {
			const keyToIndexEntries = this.createMailIndexEntries(element.mail, element.mailDetails, element.attachments)
			this.core.encryptSearchIndexEntries(element.mail._id, assertNotNull(element.mail._ownerGroup), keyToIndexEntries, indexUpdate)
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
		const indexEntries = this.createMailIndexEntries(mail, mailDetails, attachments)
		this.core.encryptSearchIndexEntries(mail._id, assertNotNull(mail._ownerGroup), indexEntries, indexUpdate)
		await this.core.writeIndexUpdate(indexUpdate)
	}

	async onMailUpdated({ mail, mailDetails, attachments }: MailWithDetailsAndAttachments): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		await this.core._processDeleted(MailTypeRef, getElementId(mail), indexUpdate)
		const indexEntries = this.createMailIndexEntries(mail, mailDetails, attachments)
		this.core.encryptSearchIndexEntries(mail._id, assertNotNull(mail._ownerGroup), indexEntries, indexUpdate)
		await this.core.writeIndexUpdate(indexUpdate)
	}

	async onMailDeleted(mailId: IdTuple): Promise<void> {
		const indexUpdate = this.createIndexUpdate()
		await this.core._processDeleted(MailTypeRef, elementIdPart(mailId), indexUpdate)
		await this.core.writeIndexUpdate(indexUpdate)
	}

	async enableIndexing(): Promise<boolean> {
		const enabled = await this.isMailIndexingEnabled()
		if (!enabled) {
			const t2 = await this.dbFacade.createTransaction(false, [MetaDataOS])
			t2.put(MetaDataOS, Metadata.mailIndexingEnabled, true)
			t2.put(MetaDataOS, Metadata.excludedListIds, [])
			await t2.wait()
		}
		return enabled
	}

	async isMailIndexingEnabled(): Promise<boolean> {
		const t = await this.dbFacade.createTransaction(true, [MetaDataOS])
		return (await t.get(MetaDataOS, Metadata.mailIndexingEnabled)) ?? false
	}

	deleteIndex(): Promise<void> {
		return this.dbFacade.deleteDatabase(b64UserIdHash(this.userId))
	}

	private createIndexUpdate(): IndexUpdate {
		return _createNewIndexUpdate(typeRefToTypeInfo(MailTypeRef))
	}

	private createMailIndexEntries(mail: Mail, mailDetails: MailDetails, files: readonly TutanotaFile[]): Map<string, SearchIndexEntry[]> {
		let startTimeIndex = getPerformanceTimestamp()

		// avoid caching system@tutanota.de since the user wouldn't be searching for this
		let senderToIndex: MailAddressAndName

		const hasSender = mail.sender != null
		if (hasSender) senderToIndex = getDisplayedSender(mail)

		const MailModel = typeModels.Mail
		const MailDetailsModel = typeModels.MailDetails
		const RecipientModel = typeModels.Recipients
		let keyToIndexEntries = this.core.createIndexEntriesForAttributes(mail, [
			{
				attribute: MailModel.values["subject"],
				value: () => mail.subject,
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, RecipientModel.associations["toRecipients"], { id: LEGACY_TO_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.toRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, RecipientModel.associations["ccRecipients"], { id: LEGACY_CC_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.ccRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, RecipientModel.associations["bccRecipients"], { id: LEGACY_BCC_RECIPIENTS_ID }),
				value: () => mailDetails.recipients.bccRecipients.map((r) => r.name + " <" + r.address + ">").join(","),
			},
			{
				attribute: MailModel.associations["sender"],
				value: () => (hasSender ? senderToIndex.name + " <" + senderToIndex.address + ">" : ""),
			},
			{
				// allows old index entries (pre-maildetails) to be used with new clients.
				attribute: Object.assign({}, MailDetailsModel.associations["body"], { id: LEGACY_BODY_ID }),
				value: () => htmlToText(getMailBodyText(mailDetails.body)),
			},
			{
				attribute: MailModel.associations["attachments"],
				value: () => files.map((file) => file.name).join(" "),
			},
		])

		this.core._stats.indexingTime += getPerformanceTimestamp() - startTimeIndex
		return keyToIndexEntries
	}
}
