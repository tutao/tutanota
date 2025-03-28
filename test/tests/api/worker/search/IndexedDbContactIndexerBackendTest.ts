import o from "@tutao/otest"
import {
	Contact,
	ContactAddressTypeRef,
	ContactListTypeRef,
	ContactMailAddressTypeRef,
	ContactPhoneNumberTypeRef,
	ContactSocialIdTypeRef,
	ContactTypeRef,
} from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { FULL_INDEXED_TIMESTAMP } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { _createNewIndexUpdate, typeRefToTypeInfo } from "../../../../../src/common/api/worker/search/IndexUtils.js"
import { createTestEntity } from "../../../TestUtils.js"
import { resolveTypeReference } from "../../../../../src/common/api/common/EntityFunctions.js"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { matchers, object, verify, when } from "testdouble"
import { IndexedDbContactIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/IndexedDbContactIndexerBackend"
import { IndexerCore } from "../../../../../src/mail-app/workerUtils/index/IndexerCore"
import { SuggestionFacade } from "../../../../../src/mail-app/workerUtils/index/SuggestionFacade"
import { getElementId } from "../../../../../src/common/api/common/utils/EntityUtils"
import { assertNotNull, neverNull } from "@tutao/tutanota-utils"

o.spec("IndexedDbContactIndexerBackend test", () => {
	let entityClient: EntityClient
	let backend: IndexedDbContactIndexerBackend
	let core: IndexerCore
	let suggestionFacadeMock: SuggestionFacade<Contact>

	o.beforeEach(() => {
		entityClient = object()
		core = object()
		suggestionFacadeMock = object()
		backend = new IndexedDbContactIndexerBackend(core, entityClient, suggestionFacadeMock)
	})

	o.test("createContactIndexEntries without entries", () => {
		let contact = createTestEntity(ContactTypeRef)
		backend._createContactIndexEntries(contact)
		verify(suggestionFacadeMock.addSuggestions([]))
		verify(core.createIndexEntriesForAttributes(contact, matchers.anything()))
	})

	o.test("createContactIndexEntries with one entry without suggestions", () => {
		let contact = createTestEntity(ContactTypeRef, { company: "test" })
		backend._createContactIndexEntries(contact)
		verify(suggestionFacadeMock.addSuggestions([]))
		verify(core.createIndexEntriesForAttributes(contact, matchers.anything()))
	})

	o.test("createContactIndexEntries with one entry with suggestions", () => {
		const contact = createTestEntity(ContactTypeRef, {
			firstName: "first",
			lastName: "last",
			company: "company",
			mailAddresses: [createTestEntity(ContactMailAddressTypeRef, { address: "mail@tuta.com" })],
		})
		backend._createContactIndexEntries(contact)
		verify(core.createIndexEntriesForAttributes(contact, matchers.anything()))
		verify(suggestionFacadeMock.addSuggestions(["first", "last", "mail", "tuta", "com"]))
	})

	o.test("createContactIndexEntries many entries", async () => {
		let addresses = [createTestEntity(ContactAddressTypeRef, { address: "A0" }), createTestEntity(ContactAddressTypeRef, { address: "A1" })]
		let mailAddresses = [createTestEntity(ContactMailAddressTypeRef, { address: "MA0" }), createTestEntity(ContactMailAddressTypeRef, { address: "MA1" })]
		let phoneNumbers = [createTestEntity(ContactPhoneNumberTypeRef, { number: "PN0" }), createTestEntity(ContactPhoneNumberTypeRef, { number: "PN1" })]
		let socialIds = [createTestEntity(ContactSocialIdTypeRef, { socialId: "S0" }), createTestEntity(ContactSocialIdTypeRef, { socialId: "S1" })]

		let contact = createTestEntity(ContactTypeRef, {
			firstName: "FN",
			lastName: "LN",
			nickname: "NN",
			role: "R",
			title: "T",
			comment: "C",
			company: "co",
			addresses,
			mailAddresses,
			phoneNumbers,
			socialIds,
		})
		const ContactModel = await resolveTypeReference(ContactTypeRef)

		let wasCalled = false
		core.createIndexEntriesForAttributes = (a, b) => {
			o.check(a).equals(contact)

			const attributes = b.map((h) => {
				return { attribute: h.id, value: h.value() }
			})
			o.check(attributes).deepEquals([
				{
					attribute: ContactModel.values["firstName"].id,
					value: "FN",
				},
				{ attribute: ContactModel.values["lastName"].id, value: "LN" },
				{ attribute: ContactModel.values["nickname"].id, value: "NN" },
				{ attribute: ContactModel.values["role"].id, value: "R" },
				{ attribute: ContactModel.values["title"].id, value: "T" },
				{ attribute: ContactModel.values["comment"].id, value: "C" },
				{ attribute: ContactModel.values["company"].id, value: "co" },
				{ attribute: ContactModel.associations["addresses"].id, value: "A0,A1" },
				{ attribute: ContactModel.associations["mailAddresses"].id, value: "MA0,MA1" },
				{ attribute: ContactModel.associations["phoneNumbers"].id, value: "PN0,PN1" },
				{ attribute: ContactModel.associations["socialIds"].id, value: "S0,S1" },
			])
			wasCalled = true
			return new Map()
		}

		backend._createContactIndexEntries(contact)
		verify(suggestionFacadeMock.addSuggestions(["fn", "ln", "ma0", "ma1"]))
		o.check(wasCalled).equals(true)
	})

	o.test("indexFullContactList", async () => {
		const contactList = createTestEntity(ContactListTypeRef, {
			_ownerGroup: "ownerGroupId",
			contacts: "contactListId",
		})
		const contacts = [
			createTestEntity(ContactTypeRef, {
				_id: [contactList.contacts, "c0"],
				_ownerGroup: "c0owner",
			}),
			createTestEntity(ContactTypeRef, {
				_id: [contactList.contacts, "c1"],
				_ownerGroup: "c1owner",
			}),
		]

		when(entityClient.loadAll(ContactTypeRef, contactList.contacts)).thenResolve(contacts)

		// FIXME
		await backend.indexContactList(contactList)
		verify(core.encryptSearchIndexEntries(contacts[0]._id, neverNull(contacts[0]._ownerGroup), matchers.anything(), matchers.anything()))
		verify(core.encryptSearchIndexEntries(contacts[1]._id, neverNull(contacts[1]._ownerGroup), matchers.anything(), matchers.anything()))
		verify(suggestionFacadeMock.addSuggestions(matchers.anything()), { times: contacts.length })
		verify(suggestionFacadeMock.store())

		verify(
			core.writeIndexUpdateWithIndexTimestamps(
				[
					{
						groupId: assertNotNull(contactList._ownerGroup),
						indexTimestamp: FULL_INDEXED_TIMESTAMP,
					},
				],
				matchers.anything(),
			),
		)
	})

	o.test("onContactCreated", async () => {
		const contact = createTestEntity(ContactTypeRef)
		await backend.onContactCreated(contact)

		verify(suggestionFacadeMock.addSuggestions([]))
		verify(suggestionFacadeMock.store())
	})

	o.test("onContactUpdated", async () => {
		const contact = createTestEntity(ContactTypeRef, { _id: ["contact-list", "L-dNNLe----0"] })
		when(core.createIndexEntriesForAttributes(contact, matchers.anything())).thenReturn(new Map())
		const newIndexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(ContactTypeRef))
		await backend.onContactUpdated(contact)
		verify(core._processDeleted(ContactTypeRef, getElementId(contact), newIndexUpdate))
		verify(suggestionFacadeMock.store())
		verify(suggestionFacadeMock.addSuggestions([]))
		verify(core.encryptSearchIndexEntries(contact._id, neverNull(contact._ownerGroup), new Map(), newIndexUpdate))
	})

	o.test("onContactDeleted", async () => {
		const contact = createTestEntity(ContactTypeRef, { _id: ["contact-list", "1"] })
		await backend.onContactDeleted(contact._id)
		const newIndexUpdate = _createNewIndexUpdate(typeRefToTypeInfo(ContactTypeRef))
		verify(core._processDeleted(ContactTypeRef, getElementId(contact), newIndexUpdate))
	})
})
