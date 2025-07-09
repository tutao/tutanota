import o from "@tutao/otest"
import { RecipientsModel } from "../../../src/common/api/main/RecipientsModel.js"
import { LoginController } from "../../../src/common/api/main/LoginController.js"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { func, instance, object, when } from "testdouble"
import { GroupInfoTypeRef, GroupMembershipTypeRef, UserTypeRef } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { Recipient, RecipientType } from "../../../src/common/api/common/recipients/Recipient.js"
import { ContactMailAddressTypeRef, ContactTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { EncryptionKeyVerificationState, GroupType, PresentableKeyVerificationState } from "../../../src/common/api/common/TutanotaConstants.js"
import { assertThrows, verify } from "@tutao/tutanota-test-utils"
import { defer, delay } from "@tutao/tutanota-utils"
import { createTestEntity } from "../TestUtils.js"
import { ContactModel } from "../../../src/common/contactsFunctionality/ContactModel.js"
import { KeyVerificationFacade, VerifiedPublicEncryptionKey } from "../../../src/common/api/worker/facades/lazy/KeyVerificationFacade"
import { ProgrammingError } from "../../../src/common/api/common/error/ProgrammingError"
import { KeyVerificationMismatchError } from "../../../src/common/api/common/error/KeyVerificationMismatchError"

o.spec("RecipientsModelTest", function () {
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
	let keyVerificationFacadeMock: KeyVerificationFacade

	let model: RecipientsModel

	o.beforeEach(function () {
		contactModelMock = object()

		userControllerMock = {
			user: createTestEntity(UserTypeRef, {
				memberships: [
					createTestEntity(GroupMembershipTypeRef, {
						groupType: GroupType.Contact,
					}),
				],
			}),
			userGroupInfo: createTestEntity(GroupInfoTypeRef, {
				mailAddress: "test@example.com",
			}),
		} satisfies Partial<UserController> as UserController

		loginControllerMock = object()
		when(loginControllerMock.getUserController()).thenReturn(userControllerMock)

		mailFacadeMock = instance(MailFacade)
		entityClientMock = instance(EntityClient)
		keyVerificationFacadeMock = instance(KeyVerificationFacade)

		model = new RecipientsModel(contactModelMock, loginControllerMock, mailFacadeMock, entityClientMock)
	})

	o("initializes with provided contact", function () {
		const contact = makeContactStub(contactId, otherAddress)
		o(model.initialize({ address: otherAddress, contact }).contact).deepEquals(contact)
	})

	o("doesn't try to resolve contact if contact is provided", async function () {
		const contact = makeContactStub(contactId, otherAddress)
		const recipient = await model.initialize({ address: otherAddress, contact }).resolve()
		o(recipient.contact).deepEquals(contact)
		verify(entityClientMock.load(ContactTypeRef, contactId), { times: 0 })
		verify(contactModelMock.searchForContact(otherAddress), { times: 0 })
	})

	o("loads contact with id", async function () {
		const contact = makeContactStub(contactId, otherAddress)
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		when(entityClientMock.load(ContactTypeRef, contactId)).thenResolve(contact)
		const recipient = await model.initialize({ address: otherAddress, contact: contactId }).resolve()
		o(recipient.contact).deepEquals(contact)
	})

	o("searches for contact by mail address", async function () {
		const contactId = "contactElementId"
		const id = [contactListId, contactId] as const
		const contact = makeContactStub(id, otherAddress)
		when(contactModelMock.searchForContact(otherAddress)).thenResolve(contact)
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		const recipient = await model.initialize({ address: otherAddress }).resolve()
		o(recipient.contact).deepEquals(contact)
	})

	o("prioritises name that was passed in", async function () {
		const recipient = await model
			.initialize({
				address: tutanotaAddress,
				name: "Pizza Tonno",
				contact: makeContactStub(contactId, tutanotaAddress, "Pizza", "Hawaii"),
			})
			.resolve()
		o(recipient.name).equals("Pizza Tonno")
	})

	o("uses name from contact if name not provided", async function () {
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		const recipient = await model
			.initialize({
				address: tutanotaAddress,
				contact: makeContactStub(contactId, tutanotaAddress, "Pizza", "Hawaii"),
			})
			.resolve()
		o(recipient.name).equals("Pizza Hawaii")
	})

	o("infers internal recipient from tutanota address, otherwise unknown", async function () {
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		// using lazy mode to not wait for the resolution and to not have async task running after the test is done
		const recipient = model.initialize({ address: tutanotaAddress })
		o(recipient.type).equals(RecipientType.UNKNOWN)("Tutanota address")
		await recipient.resolve()
		o(recipient.type).equals(RecipientType.INTERNAL)("Tutanota address")

		const otherRecipient = model.initialize({ address: otherAddress })
		o(otherRecipient.type).equals(RecipientType.UNKNOWN)("Internal address")
		await otherRecipient.resolve()
		o(otherRecipient.type).equals(RecipientType.EXTERNAL)("Extern address")
	})

	o("correctly resolves type for non tutanota addresses", async function () {
		const internalAddress = "internal@email.com"
		const externalAddress = "external@email.com"

		const loadedPublicEncryptionKey: VerifiedPublicEncryptionKey = object()
		loadedPublicEncryptionKey.verificationState = EncryptionKeyVerificationState.NO_ENTRY

		when(mailFacadeMock.getRecipientKeyData(internalAddress)).thenResolve(loadedPublicEncryptionKey)
		when(mailFacadeMock.getRecipientKeyData(externalAddress)).thenResolve(null)

		const internal = await model.initialize({ address: internalAddress }).resolve()
		const external = await model.initialize({ address: externalAddress }).resolve()

		o(internal.type).equals(RecipientType.INTERNAL)("key data existed so it is INTERNAL")
		o(external.type).equals(RecipientType.EXTERNAL)("key data did not exist so it is EXTERNAL")
	})

	o("correctly fails when key verification state is undefined", async function () {
		const internalAddress = "internal@email.com"

		const loadedPublicEncryptionKey: VerifiedPublicEncryptionKey = object()
		when(mailFacadeMock.getRecipientKeyData(internalAddress)).thenResolve(loadedPublicEncryptionKey)

		await assertThrows(ProgrammingError, async () => await model.initialize({ address: internalAddress }).resolve())
	})

	o("correctly presents key verification state (when key data is available)", async function () {
		when(contactModelMock.getContactListId()).thenResolve("contactListId")

		const internalAddress = "internal@email.com"

		const loadedPublicEncryptionKey: VerifiedPublicEncryptionKey = object()
		when(mailFacadeMock.getRecipientKeyData(internalAddress)).thenResolve(loadedPublicEncryptionKey)

		let recipient: Recipient

		loadedPublicEncryptionKey.verificationState = EncryptionKeyVerificationState.NO_ENTRY
		recipient = await model.initialize({ address: internalAddress }).resolve()
		o(recipient.type).equals(RecipientType.INTERNAL)
		o(recipient.verificationState).equals(PresentableKeyVerificationState.NONE)("NO_ENTRY -> NONE")

		loadedPublicEncryptionKey.verificationState = EncryptionKeyVerificationState.VERIFIED_MANUAL
		recipient = await model.initialize({ address: internalAddress }).resolve()
		o(recipient.type).equals(RecipientType.INTERNAL)
		o(recipient.verificationState).equals(PresentableKeyVerificationState.SECURE)("VERIFIED_MANUAL -> SECURE")

		loadedPublicEncryptionKey.verificationState = EncryptionKeyVerificationState.NOT_SUPPORTED
		recipient = await model.initialize({ address: internalAddress }).resolve()
		o(recipient.type).equals(RecipientType.INTERNAL)
		o(recipient.verificationState).equals(PresentableKeyVerificationState.NONE)("NOT_SUPPORTED -> NONE")

		loadedPublicEncryptionKey.verificationState = EncryptionKeyVerificationState.VERIFIED_TOFU
		recipient = await model.initialize({ address: internalAddress }).resolve()
		o(recipient.type).equals(RecipientType.INTERNAL)
		o(recipient.verificationState).equals(PresentableKeyVerificationState.NONE)("VERIFIED_TOFU -> NONE")

		when(mailFacadeMock.getRecipientKeyData(internalAddress)).thenReject(new KeyVerificationMismatchError(""))
		recipient = await model.initialize({ address: internalAddress }).resolve()
		o(recipient.type).equals(RecipientType.INTERNAL)
		o(recipient.verificationState).equals(PresentableKeyVerificationState.ALERT)("KeyVerificationMismatchError -> ALERT")
	})

	o("correctly presents key verification state (when no key data is available)", async function () {
		when(contactModelMock.getContactListId()).thenResolve("contactListId")

		const externalAddress = "external@email.com"

		when(mailFacadeMock.getRecipientKeyData(tutanotaAddress)).thenResolve(null)
		when(mailFacadeMock.getRecipientKeyData(externalAddress)).thenResolve(null)

		let recipient: Recipient
		recipient = await model.initialize({ address: tutanotaAddress }).resolve()
		o(recipient.type).equals(RecipientType.INTERNAL)
		o(recipient.verificationState).equals(PresentableKeyVerificationState.NONE)

		recipient = await model.initialize({ address: externalAddress }).resolve()
		o(recipient.type).equals(RecipientType.EXTERNAL)
		o(recipient.verificationState).equals(PresentableKeyVerificationState.NONE)
	})

	o("ignores wrong type when tutanota address is passed in", async function () {
		const recipient = await model.initialize({ address: tutanotaAddress, type: RecipientType.EXTERNAL }).resolve()
		o(recipient.type).equals(RecipientType.INTERNAL)
	})

	o("non-lazy resolution starts right away", async function () {
		const deferred = defer()

		const recipient = model.initialize({ address: tutanotaAddress })

		recipient.whenResolved(deferred.resolve)

		await deferred.promise

		o(recipient.isResolved()).equals(true)
	})

	o("lazy resolution isn't triggered until `resolved` is called", async function () {
		when(contactModelMock.getContactListId()).thenResolve("contactListId")
		const recipient = model.initialize({ address: otherAddress })

		// see that the resolution doesn't start straight away
		// not sure of a better way to do this
		await delay(5)

		verify(contactModelMock.searchForContact(otherAddress), { times: 0 })
		verify(mailFacadeMock.getRecipientKeyData(otherAddress), { times: 0 })
		o(recipient.isResolved()).equals(false)

		await recipient.resolve()

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

		await model.initialize({ address: otherAddress, name: "Re Cipient" }).whenResolved(handler).resolve()

		verify(
			handler({
				address: otherAddress,
				name: "Re Cipient",
				type: RecipientType.EXTERNAL,
				contact,
				verificationState: PresentableKeyVerificationState.NONE,
			}),
		)
	})
})

function makeContactStub(id: IdTuple, mailAddress: string, firstName?: string, lastName?: string) {
	return createTestEntity(ContactTypeRef, {
		_id: id,
		mailAddresses: [createTestEntity(ContactMailAddressTypeRef, { address: mailAddress })],
		firstName: firstName ?? "",
		lastName: lastName ?? "",
	})
}
