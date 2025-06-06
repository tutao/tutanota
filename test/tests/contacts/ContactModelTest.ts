import o from "@tutao/otest"
import { ContactModel } from "../../../src/common/contactsFunctionality/ContactModel"
import { EntityClient } from "../../../src/common/api/common/EntityClient"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock"
import { clientInitializedTypeModelResolver, createTestEntity } from "../TestUtils"
import { LoginController } from "../../../src/common/api/main/LoginController"
import { object, when } from "testdouble"
import { EventController } from "../../../src/common/api/main/EventController"
import { ContactSearchFacade } from "../../../src/mail-app/workerUtils/index/ContactSearchFacade"
import { GroupMembershipTypeRef, RootInstanceTypeRef, UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs"
import { TypeModelResolver } from "../../../src/common/api/common/EntityFunctions"
import { UserController } from "../../../src/common/api/main/UserController"
import { ContactListTypeRef, ContactMailAddressTypeRef, ContactTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs"
import { DbError } from "../../../src/common/api/common/error/DbError"
import { timestampToGeneratedId } from "../../../src/common/api/common/utils/EntityUtils"

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
		userController.user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, {
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
			const typeModel = await typeModelResolver.resolveClientTypeReference(ContactListTypeRef)
			const rootId = [userGroupId, typeModel.rootId] as const
			entityMock.addListInstances(
				createTestEntity(RootInstanceTypeRef, {
					_id: rootId,
					reference: contactListEntityId,
				}),
			)
			const contactList = createTestEntity(ContactListTypeRef, {
				_id: contactListEntityId,
				contacts: contactListId,
			})
			entityMock.addElementInstances(contactList)
		}

		o.test("when facade returns results it returns an exact match out of them", async () => {
			when(userController.isInternalUser()).thenReturn(true)
			await createContactList()

			const exactMatch = createTestEntity(ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(1)],
				firstName: "olderExact",
				mailAddresses: [
					createTestEntity(ContactMailAddressTypeRef, {
						address: "exact@test.com",
					}),
				],
			})
			const inexactMatch = createTestEntity(ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(2)],
				mailAddresses: [
					createTestEntity(ContactMailAddressTypeRef, {
						address: "inexact@test.com",
					}),
				],
			})
			const newerExactMatch = createTestEntity(ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(3)],
				firstName: "newerExact",
				mailAddresses: [
					createTestEntity(ContactMailAddressTypeRef, {
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

			const exactMatch = createTestEntity(ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(1)],
				firstName: "olderExact",
				mailAddresses: [
					createTestEntity(ContactMailAddressTypeRef, {
						address: "exact@test.com",
					}),
				],
			})
			const inexactMatch = createTestEntity(ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(2)],
				mailAddresses: [
					createTestEntity(ContactMailAddressTypeRef, {
						address: "inexact@test.com",
					}),
				],
			})
			const newerExactMatch = createTestEntity(ContactTypeRef, {
				_id: [contactListId, timestampToGeneratedId(3)],
				firstName: "newerExact",
				mailAddresses: [
					createTestEntity(ContactMailAddressTypeRef, {
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
