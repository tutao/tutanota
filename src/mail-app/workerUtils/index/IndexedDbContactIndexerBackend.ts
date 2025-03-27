import { ContactIndexerBackend } from "./ContactIndexerBackend"
import { Contact, ContactList, ContactTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { IndexerCore } from "./IndexerCore"
import type { Db, GroupData, SearchIndexEntry } from "../../../common/api/worker/search/SearchTypes"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { SuggestionFacade } from "./SuggestionFacade"
import { neverNull, tokenize } from "@tutao/tutanota-utils"
import { elementIdPart, getElementId } from "../../../common/api/common/utils/EntityUtils"
import { typeModels as tutanotaModels } from "../../../common/api/entities/tutanota/TypeModels"
import { _createNewIndexUpdate, typeRefToTypeInfo } from "../../../common/api/worker/search/IndexUtils"
import { FULL_INDEXED_TIMESTAMP, NOTHING_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { NotFoundError } from "../../../common/api/common/error/RestError"
import { GroupDataOS, MetaDataOS } from "../../../common/api/worker/search/IndexTables"

export class IndexedDbContactIndexerBackend implements ContactIndexerBackend {
	private _core: IndexerCore
	private _db: Db
	private _entity: EntityClient
	private suggestionFacade: SuggestionFacade<Contact>

	constructor(core: IndexerCore, db: Db, entity: EntityClient, suggestionFacade: SuggestionFacade<Contact>) {
		this._core = core
		this._db = db
		this._entity = entity
		this.suggestionFacade = suggestionFacade
	}

	async init(): Promise<void> {
		await this.suggestionFacade.load()
	}

	async areContactsIndexed(contactList: ContactList): Promise<boolean> {
		const t = await this._db.dbFacade.createTransaction(true, [MetaDataOS, GroupDataOS])
		const groupId = neverNull(contactList._ownerGroup)
		const groupData = await t.get<GroupData>(GroupDataOS, groupId)
		return groupData != null
	}

	async indexContactList(contactList: ContactList): Promise<void> {
		const groupId = neverNull(contactList._ownerGroup)
		let indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(ContactTypeRef))
		try {
			const contacts = await this._entity.loadAll(ContactTypeRef, contactList.contacts)
			for (const contact of contacts) {
				let keyToIndexEntries = this.createContactIndexEntries(contact)
				this._core.encryptSearchIndexEntries(contact._id, neverNull(contact._ownerGroup), keyToIndexEntries, indexUpdate)
			}
			await Promise.all([
				this._core.writeIndexUpdateWithIndexTimestamps(
					[
						{
							groupId,
							indexTimestamp: FULL_INDEXED_TIMESTAMP,
						},
					],
					indexUpdate,
				),
				this.suggestionFacade.store(),
			])
		} catch (e) {
			if (e instanceof NotFoundError) {
				return
			}
			throw e
		}
	}

	async onContactCreated(contact: Contact): Promise<void> {
		await this.suggestionFacade.store()

		const keyToIndexEntries = this.createContactIndexEntries(contact)
		const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(ContactTypeRef))
		this._core.encryptSearchIndexEntries(contact._id, neverNull(contact._ownerGroup), keyToIndexEntries, indexUpdate)
	}

	async onContactDeleted(contact: IdTuple): Promise<void> {
		const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(ContactTypeRef))
		await this._core._processDeleted(ContactTypeRef, elementIdPart(contact), indexUpdate)
	}

	async onContactUpdated(contact: Contact): Promise<void> {
		const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(ContactTypeRef))
		await Promise.all([this._core._processDeleted(ContactTypeRef, getElementId(contact), indexUpdate), this.onContactCreated(contact)])
	}

	private createContactIndexEntries(contact: Contact): Map<string, SearchIndexEntry[]> {
		const ContactModel = tutanotaModels.Contact
		let keyToIndexEntries = this._core.createIndexEntriesForAttributes(contact, [
			{
				attribute: ContactModel.values["firstName"],
				value: () => contact.firstName,
			},
			{
				attribute: ContactModel.values["lastName"],
				value: () => contact.lastName,
			},
			{
				attribute: ContactModel.values["nickname"],
				value: () => contact.nickname || "",
			},
			{
				attribute: ContactModel.values["role"],
				value: () => contact.role,
			},
			{
				attribute: ContactModel.values["title"],
				value: () => contact.title || "",
			},
			{
				attribute: ContactModel.values["comment"],
				value: () => contact.comment,
			},
			{
				attribute: ContactModel.values["company"],
				value: () => contact.company,
			},
			{
				attribute: ContactModel.associations["addresses"],
				value: () => contact.addresses.map((a) => a.address).join(","),
			},
			{
				attribute: ContactModel.associations["mailAddresses"],
				value: () => contact.mailAddresses.map((cma) => cma.address).join(","),
			},
			{
				attribute: ContactModel.associations["phoneNumbers"],
				value: () => contact.phoneNumbers.map((pn) => pn.number).join(","),
			},
			{
				attribute: ContactModel.associations["socialIds"],
				value: () => contact.socialIds.map((s) => s.socialId).join(","),
			},
		])

		this.suggestionFacade.addSuggestions(this.getSuggestionWords(contact))
		return keyToIndexEntries
	}

	private getSuggestionWords(contact: Contact): string[] {
		return tokenize(contact.firstName + " " + contact.lastName + " " + contact.mailAddresses.map((ma) => ma.address).join(" "))
	}
}
