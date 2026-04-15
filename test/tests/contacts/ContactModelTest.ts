import o from "@tutao/otest"
import { ContactModel } from "../../../src/common/contactsFunctionality/ContactModel"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock"
import { clientInitializedTypeModelResolver, createTestEntity } from "../TestUtils"
import { LoginController } from "../../../src/common/api/main/LoginController"
import { object, when } from "testdouble"
import { EventController } from "../../../src/common/api/main/EventController"
import { ContactSearchFacade } from "../../../src/mail-app/workerUtils/index/ContactSearchFacade"
import { sysTypeRefs } from "@tutao/typerefs"
import { TypeModelResolver } from "@tutao/typerefs"
import { UserController } from "../../../src/common/api/main/UserController"
import { tutanotaTypeRefs } from "@tutao/typerefs"
import { DbError } from "../../../src/common/api/common/error/DbError"
import { timestampToGeneratedId } from "@tutao/typerefs"

o.spec("ContactModel", () => {
	let entityMock: EntityRestClientMock
	let entityClient: EntityClient
	let userController: UserController
	let loginController: LoginController
	let eventController: EventController
	let contactSearchFacade: ContactSearchFacade
	let typeModelResolver: TypeModelResolver

	let model: ContactModel

	const userGroupId = "userGroupId"
	const contactListEntityId = "contactListId"
	const contactListId = "contacts"

	o.beforeEach(() => {
		entityMock = new EntityRestClientMock()
		typeModelResolver = clientInitializedTypeModelResolver()
		entityClient = new EntityClient(entityMock, typeModelResolver)
		loginController = object()
		eventController = object()
		contactSearchFacade = object()
		userController = object()
		model = new ContactModel(entityClient, loginController, eventController, contactSearchFacade)
		when(loginController.isFullyLoggedIn()).thenReturn(true)
		when(loginController.getUserController()).thenReturn(userController)
		userController.user = createTestEntity(sysTypeRefs.UserTypeRef, {
			userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
				group: userGroupId,
			}),
		})
	})

	o.spec("searchForContact", function () {
		o.test("when no contact list it returns null", async () => {
			when(userController.isInternalUser()).thenReturn(false)

			o.check(await model.searchForContact("blah")).equals(null)
		})

		async function createContactList() {
			const typeModel = await typeModelResolver.resolveClientTypeReference(tutanotaTypeRefs.ContactListTypeRef)
			const rootId = [userGroupId, typeModel.rootId] as const
			entityMock.addListInstances(
				createTestEntity(sysTypeRefs.RootInstanceTypeRef, {
					_id: rootId,
					reference: contactListEntityId,
				}),
			)
			const contactList = createTestEntity(tutanotaTypeRefs.ContactListTypeRef, {
				_id: contactListEntityId,
				contacts: contactListId,
			})
			entityMock.addElementInstances(contactList)
		}

		o.test("when facade returns results it returns an exact match out of them", async () => {
			when(userController.isInternalUser()).thenReturn(true)
			await createContactList()

			const exactMatch = createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(1)],
				firstName: "olderExact",
				mailAddresses: [
					createTestEntity(tutanotaTypeRefs.ContactMailAddressTypeRef, {
						address: "exact@test.com",
					}),
				],
			})
			const inexactMatch = createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(2)],
				mailAddresses: [
					createTestEntity(tutanotaTypeRefs.ContactMailAddressTypeRef, {
						address: "inexact@test.com",
					}),
				],
			})
			const newerExactMatch = createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(3)],
				firstName: "newerExact",
				mailAddresses: [
					createTestEntity(tutanotaTypeRefs.ContactMailAddressTypeRef, {
						address: "exact@test.com",
					}),
				],
			})
			entityMock.addListInstances(exactMatch, inexactMatch, newerExactMatch)
			when(contactSearchFacade.findContacts("exact@test.com", "mailAddresses")).thenResolve([newerExactMatch._id, exactMatch._id, inexactMatch._id])

			// it still returns the oldest contact even if we return newer as the first
			o.check(await model.searchForContact("exact@test.com")).deepEquals(exactMatch)
		})

		o.test("when facade fails it still loads the list returns an exact match out of them", async () => {
			when(userController.isInternalUser()).thenReturn(true)
			await createContactList()

			const exactMatch = createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(1)],
				firstName: "olderExact",
				mailAddresses: [
					createTestEntity(tutanotaTypeRefs.ContactMailAddressTypeRef, {
						address: "exact@test.com",
					}),
				],
			})
			const inexactMatch = createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(2)],
				mailAddresses: [
					createTestEntity(tutanotaTypeRefs.ContactMailAddressTypeRef, {
						address: "inexact@test.com",
					}),
				],
			})
			const newerExactMatch = createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(3)],
				firstName: "newerExact",
				mailAddresses: [
					createTestEntity(tutanotaTypeRefs.ContactMailAddressTypeRef, {
						address: "exact@test.com",
					}),
				],
			})
			entityMock.addListInstances(exactMatch, inexactMatch, newerExactMatch)

			when(contactSearchFacade.findContacts("exact@test.com", "mailAddresses")).thenReject(new DbError("test"))

			o.check(await model.searchForContact("exact@test.com")).deepEquals(exactMatch)
		})
	})
})
