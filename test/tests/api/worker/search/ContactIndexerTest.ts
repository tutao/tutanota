import o from "@tutao/otest"
import { Contact, ContactList, ContactListTypeRef, ContactTypeRef, MailTypeRef } from "../../../../../src/common/api/entities/tutanota/TypeRefs.js"
import { ContactIndexer } from "../../../../../src/mail-app/workerUtils/index/ContactIndexer.js"
import { OperationType } from "../../../../../src/common/api/common/TutanotaConstants.js"
import { GroupMembershipTypeRef, User, UserTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"
import { createTestEntity } from "../../../TestUtils.js"
import { matchers, object, verify, when } from "testdouble"
import { ContactIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/ContactIndexerBackend"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade"
import { TypeRef } from "@tutao/tutanota-utils"
import { EntityUpdateData } from "../../../../../src/common/api/common/utils/EntityUpdateUtils"

o.spec("ContactIndexer test", () => {
	let entityClient: EntityClient
	let userFacade: UserFacade
	let backend: ContactIndexerBackend
	let indexer: ContactIndexer
	let user: User
	let contactList: ContactList
	const group = "my user's group"
	const contactsListId = "my contact list"

	o.beforeEach(() => {
		entityClient = object()
		userFacade = object()
		backend = object()
		user = createTestEntity(UserTypeRef)
		contactList = createTestEntity(ContactListTypeRef)
		contactList.contacts = contactsListId

		user.userGroup = createTestEntity(GroupMembershipTypeRef, { group })

		when(userFacade.getLoggedInUser()).thenReturn(user)
		when(entityClient.loadRoot(ContactListTypeRef, group)).thenResolve(contactList)

		indexer = new ContactIndexer(entityClient, userFacade, backend)
	})

	o.test("ContactList instance is cached", async () => {
		when(backend.areContactsIndexed(matchers.anything())).thenResolve(true)
		await indexer.areContactsIndexed()
		await indexer.areContactsIndexed()
		await indexer.areContactsIndexed()
		verify(entityClient.loadRoot(ContactListTypeRef, group), { times: 1 })
	})

	o.test("init", async () => {
		await indexer.init()
		verify(backend.init())
	})

	o.test("areContactsIndexed", async () => {
		when(backend.areContactsIndexed(matchers.anything())).thenResolve(true)
		const result = await indexer.areContactsIndexed()
		o.check(result).equals(true)
		verify(backend.areContactsIndexed(contactList))
	})

	o.test("indexFullContactLists", async () => {
		await indexer.indexFullContactList()
		verify(backend.indexContactList(contactList))
	})

	o.spec("entityUpdates", () => {
		const testContactId = "my contact"
		let testContact: Contact

		o.beforeEach(() => {
			testContact = createTestEntity(ContactTypeRef, { _id: [contactsListId, testContactId] })
			when(entityClient.load(ContactTypeRef, testContact._id)).thenResolve(testContact)
		})

		o.test("ignores non contact updates", async () => {
			const nonContactCreate = createUpdate(OperationType.CREATE, "hello", "world", MailTypeRef)
			const nonContactDelete = createUpdate(OperationType.DELETE, "hello", "world", MailTypeRef)
			const nonContactUpdate = createUpdate(OperationType.UPDATE, "hello", "world", MailTypeRef)
			await indexer.processEntityEvents([nonContactUpdate, nonContactCreate, nonContactDelete], "a", "b")
			verify(entityClient.load(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			verify(backend.onContactDeleted(matchers.anything()), { times: 0 })
			verify(backend.onContactCreated(matchers.anything()), { times: 0 })
			verify(backend.onContactUpdated(matchers.anything()), { times: 0 })
		})
		o.test("create", async () => {
			const contactCreate = createUpdate(OperationType.CREATE, contactsListId, testContactId, ContactTypeRef)
			await indexer.processEntityEvents([contactCreate], "a", "b")
			verify(backend.onContactCreated(testContact))
		})
		o.test("delete", async () => {
			const contactDelete = createUpdate(OperationType.DELETE, contactsListId, testContactId, ContactTypeRef)
			await indexer.processEntityEvents([contactDelete], "a", "b")
			verify(backend.onContactDeleted([contactsListId, testContactId]))
			verify(entityClient.load(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})
		o.test("update", async () => {
			const contactUpdate = createUpdate(OperationType.UPDATE, contactsListId, testContactId, ContactTypeRef)
			await indexer.processEntityEvents([contactUpdate], "a", "b")
			verify(backend.onContactUpdated(testContact))
		})
	})
})

function createUpdate(operation: OperationType, instanceListId: Id, instanceId: Id, typeRef: TypeRef<any> = ContactTypeRef): EntityUpdateData {
	return {
		operation,
		instanceId,
		instanceListId,
		application: typeRef.app,
		type: typeRef.type,
	}
}
