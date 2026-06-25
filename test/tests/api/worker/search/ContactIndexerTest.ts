import o from "@tutao/otest"

import { ContactIndexer } from "../../../../../src/applications/mail-app/workerUtils/index/ContactIndexer.js"
import { createTestEntity } from "../../../TestUtils.js"
import { matchers, object, verify, when } from "testdouble"
import { ContactIndexerBackend } from "../../../../../src/applications/mail-app/workerUtils/index/ContactIndexerBackend"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { UserFacade } from "../../../../../src/platform-kit/base/facades/UserFacade"

import { Contact, ContactList, ContactListTypeRef, ContactTypeRef } from "@tutao/entities/tutanota"

import { GroupMembershipTypeRef, User, UserTypeRef } from "@tutao/entities/sys"

o.spec("ContactIndexer", () => {
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

		o.test("create", async () => {
			await indexer.afterContactCreated([contactsListId, testContactId])
			verify(backend.onContactCreated(testContact))
		})
		o.test("before delete", async () => {
			await indexer.beforeContactDeleted([contactsListId, testContactId])
			verify(backend.onBeforeContactDeleted([contactsListId, testContactId]))
			verify(entityClient.load(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})
		o.test("delete", async () => {
			await indexer.afterContactDeleted([contactsListId, testContactId])
			verify(backend.onContactDeleted([contactsListId, testContactId]))
			verify(entityClient.load(matchers.anything(), matchers.anything(), matchers.anything()), { times: 0 })
		})
		o.test("update", async () => {
			await indexer.afterContactUpdated([contactsListId, testContactId])
			verify(backend.onContactUpdated(testContact))
		})
	})
})
