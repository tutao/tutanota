import o from "@tutao/otest"
import { entityUpdateUtils, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { ContactIndexer } from "../../../../../src/mail-app/workerUtils/index/ContactIndexer.js"
import { createTestEntity } from "../../../TestUtils.js"
import { matchers, object, verify, when } from "testdouble"
import { ContactIndexerBackend } from "../../../../../src/mail-app/workerUtils/index/ContactIndexerBackend"
import { EntityClient } from "../../../../../src/common/api/common/EntityClient"
import { UserFacade } from "../../../../../src/common/api/worker/facades/UserFacade"
import { TypeRef } from "@tutao/utils"

import { noPatchesAndInstance } from "../EventBusClientTest"
import { OperationType } from "../../../../../src/app-env"

o.spec("ContactIndexer", () => {
	let entityClient: EntityClient
	let userFacade: UserFacade
	let backend: ContactIndexerBackend
	let indexer: ContactIndexer
	let user: sysTypeRefs.User
	let contactList: tutanotaTypeRefs.ContactList
	const group = "my user's group"
	const contactsListId = "my contact list"

	o.beforeEach(() => {
		entityClient = object()
		userFacade = object()
		backend = object()
		user = createTestEntity(sysTypeRefs.UserTypeRef)
		contactList = createTestEntity(tutanotaTypeRefs.ContactListTypeRef)
		contactList.contacts = contactsListId

		user.userGroup = createTestEntity(sysTypeRefs.GroupMembershipTypeRef, { group })

		when(userFacade.getLoggedInUser()).thenReturn(user)
		when(entityClient.loadRoot(tutanotaTypeRefs.ContactListTypeRef, group)).thenResolve(contactList)

		indexer = new ContactIndexer(entityClient, userFacade, backend)
	})

	o.test("ContactList instance is cached", async () => {
		when(backend.areContactsIndexed(matchers.anything())).thenResolve(true)
		await indexer.areContactsIndexed()
		await indexer.areContactsIndexed()
		await indexer.areContactsIndexed()
		verify(entityClient.loadRoot(tutanotaTypeRefs.ContactListTypeRef, group), { times: 1 })
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
		let testContact: tutanotaTypeRefs.Contact

		o.beforeEach(() => {
			testContact = createTestEntity(tutanotaTypeRefs.ContactTypeRef, { _id: [contactsListId, testContactId] })
			when(entityClient.load(tutanotaTypeRefs.ContactTypeRef, testContact._id)).thenResolve(testContact)
		})

		o.test("ignores non contact updates", async () => {
			const nonContactCreate = createUpdate(OperationType.CREATE, "hello", "world", tutanotaTypeRefs.MailTypeRef)
			const nonContactDelete = createUpdate(OperationType.DELETE, "hello", "world", tutanotaTypeRefs.MailTypeRef)
			const nonContactUpdate = createUpdate(OperationType.UPDATE, "hello", "world", tutanotaTypeRefs.MailTypeRef)
			await indexer.processEntityEvents([nonContactUpdate, nonContactCreate, nonContactDelete], "a", "b")
			verify(entityClient.load(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
			verify(backend.onContactDeleted(matchers.anything()), { times: 0 })
			verify(backend.onContactCreated(matchers.anything()), { times: 0 })
			verify(backend.onContactUpdated(matchers.anything()), { times: 0 })
		})
		o.test("create", async () => {
			const contactCreate = createUpdate(OperationType.CREATE, contactsListId, testContactId, tutanotaTypeRefs.ContactTypeRef)
			await indexer.processEntityEvents([contactCreate], "a", "b")
			verify(backend.onContactCreated(testContact))
		})
		o.test("delete", async () => {
			const contactDelete = createUpdate(OperationType.DELETE, contactsListId, testContactId, tutanotaTypeRefs.ContactTypeRef)
			await indexer.processEntityEvents([contactDelete], "a", "b")
			verify(backend.onContactDeleted([contactsListId, testContactId]))
			verify(entityClient.load(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})
		o.test("update", async () => {
			const contactUpdate = createUpdate(OperationType.UPDATE, contactsListId, testContactId, tutanotaTypeRefs.ContactTypeRef)
			await indexer.processEntityEvents([contactUpdate], "a", "b")
			verify(backend.onContactUpdated(testContact))
		})
	})
})

function createUpdate(
	operation: OperationType,
	instanceListId: NonEmptyString,
	instanceId: Id,
	typeRef: TypeRef<any> = tutanotaTypeRefs.ContactTypeRef,
): entityUpdateUtils.EntityUpdateData {
	return {
		operation: operation,
		instanceId: instanceId,
		instanceListId: instanceListId,
		typeRef: typeRef,
		...noPatchesAndInstance,
	}
}
