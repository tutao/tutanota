import { ContactIndexerBackend } from "./ContactIndexerBackend"
import { Contact, ContactList, ContactTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { IndexerCore } from "./IndexerCore"
import type { SearchIndexEntry } from "../../../common/api/worker/search/SearchTypes"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { SuggestionFacade } from "./SuggestionFacade"
import { neverNull, tokenize } from "@tutao/tutanota-utils"
import { elementIdPart, getElementId } from "../../../common/api/common/utils/EntityUtils"
import { typeModels as tutanotaModels } from "../../../common/api/entities/tutanota/TypeModels"
import { _createNewIndexUpdate, typeRefToTypeInfo } from "../../../common/api/worker/search/IndexUtils"
import { FULL_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { NotFoundError } from "../../../common/api/common/error/RestError"

export class IndexedDbContactIndexerBackend implements ContactIndexerBackend {
	private _core: IndexerCore
	private _entity: EntityClient
	private suggestionFacade: SuggestionFacade<Contact>

	constructor(core: IndexerCore, entity: EntityClient, suggestionFacade: SuggestionFacade<Contact>) {
		this._core = core
		this._entity = entity
		this.suggestionFacade = suggestionFacade
	}

	async init(): Promise<void> {
		await this.suggestionFacade.load()
	}

	async areContactsIndexed(contactList: ContactList): Promise<boolean> {
		return this._core.areContactsIndexed(contactList)
	}

	async indexContactList(contactList: ContactList): Promise<void> {
		const groupId = neverNull(contactList._ownerGroup)
		const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(ContactTypeRef))
		try {
			const contacts = await this._entity.loadAll(ContactTypeRef, contactList.contacts)
			for (const contact of contacts) {
				let keyToIndexEntries = this._createContactIndexEntries(contact)
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
		const keyToIndexEntries = this._createContactIndexEntries(contact)
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

	// @VisibleForTests
	_createContactIndexEntries(contact: Contact): Map<string, SearchIndexEntry[]> {
		const ContactModel = tutanotaModels.Contact
		let keyToIndexEntries = this._core.createIndexEntriesForAttributes(contact, [
			{
				id: ContactModel.values["firstName"].id,
				value: () => contact.firstName,
			},
			{
				id: ContactModel.values["lastName"].id,
				value: () => contact.lastName,
			},
			{
				id: ContactModel.values["nickname"].id,
				value: () => contact.nickname || "",
			},
			{
				id: ContactModel.values["role"].id,
				value: () => contact.role,
			},
			{
				id: ContactModel.values["title"].id,
				value: () => contact.title || "",
			},
			{
				id: ContactModel.values["comment"].id,
				value: () => contact.comment,
			},
			{
				id: ContactModel.values["company"].id,
				value: () => contact.company,
			},
			{
				id: ContactModel.associations["addresses"].id,
				value: () => contact.addresses.map((a) => a.address).join(","),
			},
			{
				id: ContactModel.associations["mailAddresses"].id,
				value: () => contact.mailAddresses.map((cma) => cma.address).join(","),
			},
			{
				id: ContactModel.associations["phoneNumbers"].id,
				value: () => contact.phoneNumbers.map((pn) => pn.number).join(","),
			},
			{
				id: ContactModel.associations["socialIds"].id,
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
