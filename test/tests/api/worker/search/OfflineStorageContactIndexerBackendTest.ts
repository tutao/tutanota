import o from "@tutao/otest"
import { OfflineStorageContactIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/OfflineStorageContactIndexerBackend"
import { OfflineStoragePersistence } from "../../../../../src/mail-app/workerUtils/index/OfflineStoragePersistence"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { matchers, object, verify, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils"
import { tutanotaTypeRefs } from "@tutao/typerefs"

o.spec("OfflineStorageContactIndexerBackend", () => {
	let persistence: OfflineStoragePersistence
	let entityClient: EntityClient
	let backend: OfflineStorageContactIndexerBackend

	o.beforeEach(() => {
		persistence = object()
		entityClient = object()
		backend = new OfflineStorageContactIndexerBackend(entityClient, persistence)
	})

	o.test("areContactsIndexed", async () => {
		const contactList = createTestEntity(tutanotaTypeRefs.ContactListTypeRef)
		await backend.areContactsIndexed(contactList)
		verify(persistence.areContactsIndexed())
	})

	o.test("indexContactList does nothing when already indexed", async () => {
		const contactList = createTestEntity(tutanotaTypeRefs.ContactListTypeRef)
		when(persistence.areContactsIndexed()).thenResolve(true)
		await backend.indexContactList(contactList)
		verify(persistence.areContactsIndexed())
		verify(persistence.storeContactData(matchers.anything()), { times: 0 })
		verify(persistence.setContactsIndexed(matchers.anything()), { times: 0 })
		verify(entityClient.loadAll(matchers.anything(), matchers.anything()), { times: 0 })
	})

	o.test("indexContactList does something when not indexed", async () => {
		const contactList = createTestEntity(tutanotaTypeRefs.ContactListTypeRef)
		when(persistence.areContactsIndexed()).thenResolve(false)

		const contacts = [createTestEntity(tutanotaTypeRefs.ContactTypeRef), createTestEntity(tutanotaTypeRefs.ContactTypeRef)]

		when(entityClient.loadAll(tutanotaTypeRefs.ContactTypeRef, contactList.contacts)).thenResolve(contacts)
		await backend.indexContactList(contactList)
		verify(persistence.areContactsIndexed())
		verify(persistence.storeContactData(contacts))
		verify(persistence.setContactsIndexed(true))
	})

	o.test("onContactDeleted", async () => {
		await backend.onContactDeleted(["hello", "world"])
		verify(persistence.deleteContactData(["hello", "world"]))
	})

	o.test("onContactUpdated", async () => {
		const contact = createTestEntity(tutanotaTypeRefs.ContactTypeRef)
		await backend.onContactUpdated(contact)
		verify(persistence.storeContactData([contact]))
	})

	o.test("onContactCreated", async () => {
		const contact = createTestEntity(tutanotaTypeRefs.ContactTypeRef)
		await backend.onContactCreated(contact)
		verify(persistence.storeContactData([contact]))
	})
})
