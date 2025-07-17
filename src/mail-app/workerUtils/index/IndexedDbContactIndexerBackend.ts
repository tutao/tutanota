import { ContactIndexerBackend } from "./ContactIndexerBackend"
import { Contact, ContactList, ContactTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { IndexerCore } from "./IndexerCore"
import type { SearchIndexEntry } from "../../../common/api/worker/search/SearchTypes"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { SuggestionFacade } from "./SuggestionFacade"
import { assertNotNull, neverNull, tokenize } from "@tutao/tutanota-utils"
import { elementIdPart, getElementId } from "../../../common/api/common/utils/EntityUtils"
import { _createNewIndexUpdate, typeRefToTypeInfo } from "../../../common/api/worker/search/IndexUtils"
import { FULL_INDEXED_TIMESTAMP } from "../../../common/api/common/TutanotaConstants"
import { NotFoundError } from "../../../common/api/common/error/RestError"
import { ClientTypeModelResolver } from "../../../common/api/common/EntityFunctions"
import { AttributeModel } from "../../../common/api/common/AttributeModel"

export class IndexedDbContactIndexerBackend implements ContactIndexerBackend {
	private _core: IndexerCore
	private _entity: EntityClient
	private suggestionFacade: SuggestionFacade<Contact>

	constructor(
		core: IndexerCore,
		entity: EntityClient,
		suggestionFacade: SuggestionFacade<Contact>,
		private readonly typeModelResolver: ClientTypeModelResolver,
	) {
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
				const keyToIndexEntries = await this._createContactIndexEntries(contact)
				await this._core.encryptSearchIndexEntries(contact._id, neverNull(contact._ownerGroup), keyToIndexEntries, indexUpdate)
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
		const keyToIndexEntries = await this._createContactIndexEntries(contact)
		const indexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(ContactTypeRef))
		await this._core.encryptSearchIndexEntries(contact._id, neverNull(contact._ownerGroup), keyToIndexEntries, indexUpdate)
		await Promise.all([this._core.writeIndexUpdate(indexUpdate), this.suggestionFacade.store()])
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
	async _createContactIndexEntries(contact: Contact): Promise<Map<string, SearchIndexEntry[]>> {
		const ContactModel = await this.typeModelResolver.resolveClientTypeReference(ContactTypeRef)
		const keyToIndexEntries = this._core.createIndexEntriesForAttributes(contact, [
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "firstName")),
				value: () => contact.firstName,
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "lastName")),
				value: () => contact.lastName,
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "nickname")),
				value: () => contact.nickname || "",
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "role")),
				value: () => contact.role,
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "title")),
				value: () => contact.title || "",
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "comment")),
				value: () => contact.comment,
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "company")),
				value: () => contact.company,
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "addresses")),
				value: () => contact.addresses.map((a) => a.address).join(","),
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "mailAddresses")),
				value: () => contact.mailAddresses.map((cma) => cma.address).join(","),
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "phoneNumbers")),
				value: () => contact.phoneNumbers.map((pn) => pn.number).join(","),
			},
			{
				id: assertNotNull(AttributeModel.getAttributeId(ContactModel, "socialIds")),
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
