import o from "@tutao/otest"
import { RecipientsModel, ResolveMode } from "../../../src/api/main/RecipientsModel.js"
import { ContactModel } from "../../../src/contacts/model/ContactModel.js"
import { LoginController } from "../../../src/api/main/LoginController.js"
import { MailFacade } from "../../../src/api/worker/facades/lazy/MailFacade.js"
import { EntityClient } from "../../../src/api/common/EntityClient.js"
import { func, instance, object, when } from "testdouble"
import { createGroupInfo, createGroupMembership, createPublicKeyReturn, createUser } from "../../../src/api/entities/sys/TypeRefs.js"
import { Recipient, RecipientType } from "../../../src/api/common/recipients/Recipient.js"
import { ContactTypeRef, createContact, createContactMailAddress } from "../../../src/api/entities/tutanota/TypeRefs.js"
import { UserController } from "../../../src/api/main/UserController.js"
import { GroupType } from "../../../src/api/common/TutanotaConstants.js"
import { verify } from "@tutao/tutanota-test-utils"
import { defer, delay } from "@tutao/tutanota-utils"

o.spec("RecipientsModel", function () {
	const contactListId = "contactListId"
	const contactElementId = "contactElementId"
	const contactId = [contactListId, contactElementId] as const

	const tutanotaAddress = "test@tuta.com"
	const otherAddress = "test@dudanoda.com"

	let contactModelMock: ContactModel
	let userControllerMock: UserController
	let loginControllerMock: LoginController
	let mailFacadeMock: MailFacade
	let entityClientMock: EntityClient

	let model: RecipientsModel

	o.beforeEach(function () {
		contactModelMock = object()

		userControllerMock = {
			user: createUser({
				memberships: [
					createGroupMembership({
						groupType: GroupType.Contact,
					}),
				],
			}),
			userGroupInfo: createGroupInfo({
				mailAddress: "test@example.com",
			}),
		} satisfies Partial<UserController> as UserController

		loginControllerMock = object()
		when(loginControllerMock.getUserController()).thenReturn(userControllerMock)

		mailFacadeMock = instance(MailFacade)
		entityClientMock = instance(EntityClient)

		model = new RecipientsModel(contactModelMock, loginControllerMock, mailFacadeMock, entityClientMock)
	})

	o("initializes with provided contact", function () {
		const contact = makeContactStub(contactId, otherAddress)
		o(model.resolve({ address: otherAddress, contact }, ResolveMode.Eager).contact).deepEquals(contact)
	})

	o("doesn't try to resolve contact if contact is provided", async function () {
		const contact = makeContactStub(contactId, otherAddress)
		const recipient = await model.resolve({ address: otherAddress, contact }, ResolveMode.Eager).resolved()
		o(recipient.contact).deepEquals(contact)
		verify(entityClientMock.load(ContactTypeRef, contactId), { times: 0 })
		verify(contactModelMock.searchForContact(otherAddress), { times: 0 })
	})

	o("loads contact with id", async function () {
		const contact = makeContactStub(contactId, otherAddress)
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		when(entityClientMock.load(ContactTypeRef, contactId)).thenResolve(contact)
		const recipient = await model.resolve({ address: otherAddress, contact: contactId }, ResolveMode.Eager).resolved()
		o(recipient.contact).deepEquals(contact)
	})

	o("searches for contact by mail address", async function () {
		const contactId = "contactElementId"
		const id = [contactListId, contactId] as const
		const contact = makeContactStub(id, otherAddress)
		when(contactModelMock.searchForContact(otherAddress)).thenResolve(contact)
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		const recipient = await model.resolve({ address: otherAddress }, ResolveMode.Eager).resolved()
		o(recipient.contact).deepEquals(contact)
	})

	o("prioritises name that was passed in", async function () {
		const recipient = await model
			.resolve(
				{ address: tutanotaAddress, name: "Pizza Tonno", contact: makeContactStub(contactId, tutanotaAddress, "Pizza", "Hawaii") },
				ResolveMode.Eager,
			)
			.resolved()
		o(recipient.name).equals("Pizza Tonno")
	})

	o("uses name from contact if name not provided", async function () {
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		const recipient = await model
			.resolve({ address: tutanotaAddress, contact: makeContactStub(contactId, tutanotaAddress, "Pizza", "Hawaii") }, ResolveMode.Eager)
			.resolved()
		o(recipient.name).equals("Pizza Hawaii")
	})

	o("infers internal recipient from tutanota address, otherwise unknown", async function () {
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		// using lazy mode to not wait for the resolution and to not have async task running after the test is done
		o(model.resolve({ address: tutanotaAddress }, ResolveMode.Lazy).type).equals(RecipientType.INTERNAL)("Tutanota address")
		o(model.resolve({ address: otherAddress }, ResolveMode.Lazy).type).equals(RecipientType.UNKNOWN)("Internal address")
	})

	o("correctly resolves type for non tutanota addresses", async function () {
		const internalAddress = "internal@email.com"
		const externalAddress = "external@email.com"
		when(mailFacadeMock.getRecipientKeyData(internalAddress)).thenResolve(createPublicKeyReturn())
		when(mailFacadeMock.getRecipientKeyData(externalAddress)).thenResolve(null)

		const internal = await model.resolve({ address: internalAddress }, ResolveMode.Eager).resolved()
		const external = await model.resolve({ address: externalAddress }, ResolveMode.Eager).resolved()

		o(internal.type).equals(RecipientType.INTERNAL)("key data existed so it is INTERNAL")
		o(external.type).equals(RecipientType.EXTERNAL)("key data did not exist so it is EXTERNAL")
	})

	o("ignores wrong type when tutanota address is passed in", async function () {
		const recipient = await model.resolve({ address: tutanotaAddress, type: RecipientType.EXTERNAL }, ResolveMode.Eager).resolved()
		o(recipient.type).equals(RecipientType.INTERNAL)
	})

	o("doesn't try to resolve type when type is not unknown", async function () {
		await model.resolve({ address: otherAddress, type: RecipientType.EXTERNAL }, ResolveMode.Eager).resolved()
		await model.resolve({ address: otherAddress, type: RecipientType.INTERNAL }, ResolveMode.Eager).resolved()
		await model.resolve({ address: tutanotaAddress }, ResolveMode.Eager).resolved()
		verify(mailFacadeMock.getRecipientKeyData(otherAddress), { times: 0 })
	})

	o("non-lazy resolution starts right away", async function () {
		const deferred = defer()

		const recipient = model.resolve({ address: tutanotaAddress }, ResolveMode.Eager)

		recipient.whenResolved(deferred.resolve)

		await deferred.promise

		o(recipient.isResolved()).equals(true)
	})

	o("lazy resolution isn't triggered until `resolved` is called", async function () {
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		const recipient = model.resolve({ address: otherAddress }, ResolveMode.Lazy)

		// see that the resolution doesn't start straight away
		// not sure of a better way to do this
		await delay(5)

		verify(contactModelMock.searchForContact(otherAddress), { times: 0 })
		verify(mailFacadeMock.getRecipientKeyData(otherAddress), { times: 0 })
		o(recipient.isResolved()).equals(false)

		await recipient.resolved()

		verify(contactModelMock.searchForContact(otherAddress), { times: 1 })
		verify(mailFacadeMock.getRecipientKeyData(otherAddress), { times: 1 })
		o(recipient.isResolved()).equals(true)
	})

	o("passes resolved recipient to callback", async function () {
		const contact = makeContactStub(contactId, otherAddress, "Re", "Cipient")
		when(contactModelMock.searchForContact(otherAddress)).thenResolve(contact)
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		when(mailFacadeMock.getRecipientKeyData(otherAddress)).thenResolve(null)

		const handler = func() as (recipient: Recipient) => void

		await model.resolve({ address: otherAddress, name: "Re Cipient" }, ResolveMode.Eager).whenResolved(handler).resolved()

		verify(handler({ address: otherAddress, name: "Re Cipient", type: RecipientType.EXTERNAL, contact }))
	})
})

function makeContactStub(id: IdTuple, mailAddress: string, firstName?: string, lastName?: string) {
	return createContact({
		_id: id,
		mailAddresses: [createContactMailAddress({ address: mailAddress })],
		firstName: firstName ?? "",
		lastName: lastName ?? "",
	})
}
