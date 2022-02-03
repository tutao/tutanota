import o from "ospec"
// @ts-ignore[untyped-import]
import en from "../../../src/translations/en"
import type {IUserController} from "../../../src/api/main/UserController"
import type {LoginController} from "../../../src/api/main/LoginController"
import {MailboxDetail, MailModel} from "../../../src/mail/model/MailModel"
import {Contact, ContactTypeRef, createContact} from "../../../src/api/entities/tutanota/Contact"
import {ContactModel} from "../../../src/contacts/model/ContactModel"
import {assertThrows} from "@tutao/tutanota-test-utils"
import {downcast, isSameTypeRef} from "@tutao/tutanota-utils"
import {createTutanotaProperties} from "../../../src/api/entities/tutanota/TutanotaProperties"
import {SendMailModel, TOO_MANY_VISIBLE_RECIPIENTS} from "../../../src/mail/editor/SendMailModel"
import {createGroupInfo} from "../../../src/api/entities/sys/GroupInfo"
import {createMailboxGroupRoot} from "../../../src/api/entities/tutanota/MailboxGroupRoot"
import {createGroup} from "../../../src/api/entities/sys/Group"
import {createMailBox} from "../../../src/api/entities/tutanota/MailBox"
import {ConversationType, GroupType, MailMethod, OperationType} from "../../../src/api/common/TutanotaConstants"
import {lang} from "../../../src/misc/LanguageViewModel"
import {createCustomer, CustomerTypeRef} from "../../../src/api/entities/sys/Customer"
import {createUser, UserTypeRef} from "../../../src/api/entities/sys/User"
import type {RecipientInfo} from "../../../src/api/common/RecipientInfo"
import {isTutanotaMailAddress, RecipientInfoType} from "../../../src/api/common/RecipientInfo"
import {createMail, MailTypeRef} from "../../../src/api/entities/tutanota/Mail"
import {EventController} from "../../../src/api/main/EventController"
import {createMailAddress} from "../../../src/api/entities/tutanota/MailAddress"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import {UserError} from "../../../src/api/main/UserError"
import {ContactListTypeRef} from "../../../src/api/entities/tutanota/ContactList"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {CustomerAccountCreateDataTypeRef} from "../../../src/api/entities/tutanota/CustomerAccountCreateData"
import {NotificationMailTypeRef} from "../../../src/api/entities/tutanota/NotificationMail"
import {ChallengeTypeRef} from "../../../src/api/entities/sys/Challenge"
import {getContactDisplayName} from "../../../src/contacts/model/ContactUtils"
import {ConversationEntryTypeRef, createConversationEntry} from "../../../src/api/entities/tutanota/ConversationEntry"
import {isSameId} from "../../../src/api/common/utils/EntityUtils"
import {MailFacade} from "../../../src/api/worker/facades/MailFacade"
import {RecipientField} from "../../../src/mail/model/MailUtils"
import {func, instance, matchers, object, replace, verify, when} from "testdouble"

const {anything, argThat} = matchers

type TestIdGenerator = {
	currentIdValue: number,
	currentListIdValue: number,
	newId: () => Id
	newListId: () => Id
	newIdTuple: () => IdTuple
}
let testIdGenerator: TestIdGenerator

const EXTERNAL_ADDRESS_1 = "address1@test.com"
const EXTERNAL_ADDRESS_2 = "address2@test.com"
const DEFAULT_SENDER_FOR_TESTING = "test@tutanota.de"
const INTERNAL_RECIPIENT_1 = {
	name: "test1",
	address: "test1@tutanota.de",
	contact: null,
}
const BODY_TEXT_1 = "lorem ipsum dolor yaddah yaddah"
const SUBJECT_LINE_1 = "Did you get that thing I sent ya"
const STRONG_PASSWORD = "@()IE!)(@FME)0-123jfDSA32SDACmmnvnvddEW"
const WEAK_PASSWORD = "123"

o.spec("SendMailModel", function () {

	o.before(function () {
		// we need lang initialized because the SendMailModel constructor requires some translation
		lang.init(en)
	})

	let mailModel: MailModel,
		entity: EntityClient,
		mailFacade: MailFacade

	let model: SendMailModel

	o.beforeEach(function () {
		testIdGenerator = {
			currentIdValue: 0,
			currentListIdValue: 0,

			newId(): Id {
				return (this.currentIdValue++).toString()
			},

			newListId(): Id {
				return (this.currentListIdValue++).toString()
			},

			newIdTuple(): IdTuple {
				return [this.newListId(), this.newId()]
			},
		}

		entity = instance(EntityClient)
		when(entity.loadRoot(argThat(typeRef => isSameTypeRef(typeRef, ContactListTypeRef)), anything()))
			.thenDo(
				() => ({contacts: testIdGenerator.newId()})
			)
		when(entity.load(anything(), anything(), anything()))
			.thenDo((typeRef, id, params) => ({_type: typeRef, _id: id}))


		mailModel = instance(MailModel)

		const contactModel = object<ContactModel>()
		when(contactModel.contactListId()).thenResolve("contactListId")
		when(contactModel.searchForContact(anything())).thenResolve(null)

		mailFacade = instance(MailFacade)
		when(mailFacade.createDraft(anything())).thenDo(() => createMail())
		when(mailFacade.updateDraft(anything())).thenDo(() => createMail())
		when(mailFacade.getRecipientKeyData(anything())).thenResolve(null)

		const tutanotaProperties = createTutanotaProperties(
			{
				defaultSender: DEFAULT_SENDER_FOR_TESTING,
				defaultUnconfidential: true,
				notificationMailLanguage: "en",
				noAutomaticContacts: false,
			},
		)
		const user = createUser({
			userGroup: createGroupMembership({
				_id: testIdGenerator.newId(),
				group: testIdGenerator.newId(),
			}),
			memberships: [
				createGroupMembership({
					_id: testIdGenerator.newId(),
					groupType: GroupType.Contact,
				}),
			],
		})

		const userController = object<IUserController>()
		replace(userController, "user", user)
		replace(userController, "props", tutanotaProperties)
		when(userController.loadCustomer()).thenResolve(createCustomer())

		const loginController = object<LoginController>()
		when(loginController.isInternalUserLoggedIn()).thenReturn(true)
		when(loginController.getUserController()).thenReturn(userController)

		const eventController = instance(EventController)

		const mailboxDetails = {
			mailbox: createMailBox(),
			folders: [],
			mailGroupInfo: createGroupInfo(),
			mailGroup: createGroup(),
			mailboxGroupRoot: createMailboxGroupRoot(),
		}

		model = new SendMailModel(
			mailFacade,
			loginController,
			mailModel,
			contactModel,
			eventController,
			entity,
			mailboxDetails,
		)

		replace(model, "_getDefaultSender", () => DEFAULT_SENDER_FOR_TESTING)
	})

	o.spec("initialization", function () {
		o.beforeEach(function () {
			replace(model, "_createAndResolveRecipientInfo", (name, address, contact, resolveLazily) => {
				const ri: RecipientInfo = {
					type: isTutanotaMailAddress(address) ? RecipientInfoType.INTERNAL : RecipientInfoType.EXTERNAL,
					mailAddress: address,
					name: name,
					contact:
						contact ||
						createContact({
							firstName: name,
							mailAddresses: [address],
						}),
					resolveContactPromise: null,
				}
				return [ri, Promise.resolve(ri)]
			})
		})
		o("initWithTemplate empty", async function () {
			await model.initWithTemplate({}, "", "", [], false)
			o(model.getConversationType()).equals(ConversationType.NEW)
			o(model.getSubject()).equals("")
			o(model.getBody()).equals("")
			o(model.getDraft()).equals(null)
			o(model.allRecipients().length).equals(0)
			o(model.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(model.isConfidential()).equals(true)
			o(model.containsExternalRecipients()).equals(false)
			o(model.getAttachments().length).equals(0)
			o(model.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
		o("initWithTemplate data", async function () {
			const initializedModel = await model.initWithTemplate(
				{
					to: [INTERNAL_RECIPIENT_1],
				},
				SUBJECT_LINE_1,
				BODY_TEXT_1,
				[],
				false,
				DEFAULT_SENDER_FOR_TESTING,
			)
			o(initializedModel.getConversationType()).equals(ConversationType.NEW)
			o(initializedModel.getSubject()).equals(SUBJECT_LINE_1)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(null)
			o(initializedModel.allRecipients().length).equals(1)
			o(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(model.isConfidential()).equals(true)
			o(model.containsExternalRecipients()).equals(false)
			o(initializedModel.getAttachments().length).equals(0)
			o(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
		o("initWithTemplate duplicated recipients", async function () {
			const duplicate = {
				name: INTERNAL_RECIPIENT_1.name,
				address: INTERNAL_RECIPIENT_1.address,
				contact: INTERNAL_RECIPIENT_1.contact,
			}
			const initializedModel = await model.initWithTemplate(
				{
					to: [INTERNAL_RECIPIENT_1, duplicate],
				},
				SUBJECT_LINE_1,
				BODY_TEXT_1,
				[],
				false,
				DEFAULT_SENDER_FOR_TESTING,
			)
			o(initializedModel.getConversationType()).equals(ConversationType.NEW)
			o(initializedModel.getSubject()).equals(SUBJECT_LINE_1)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(null)
			o(initializedModel.allRecipients().length).equals(1)
			o(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(model.isConfidential()).equals(true)
			o(model.containsExternalRecipients()).equals(false)
			o(initializedModel.getAttachments().length).equals(0)
			o(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
		o("initWithDraft with blank data", async function () {
			const draftMail = createMail({
				confidential: false,
				sender: createMailAddress(),
				toRecipients: [],
				ccRecipients: [],
				bccRecipients: [],
				subject: "",
				replyTos: [],
				conversationEntry: testIdGenerator.newIdTuple()
			})
			when(entity.load(ConversationEntryTypeRef, draftMail.conversationEntry)).thenResolve(createConversationEntry({conversationType: ConversationType.REPLY}))
			const initializedModel = await model.initWithDraft(draftMail, [], BODY_TEXT_1, Promise.resolve(new Map()))
			o(initializedModel.getConversationType()).equals(ConversationType.REPLY)
			o(initializedModel.getSubject()).equals(draftMail.subject)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(draftMail)
			o(initializedModel.allRecipients().length).equals(0)
			o(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(model.isConfidential()).equals(true)
			o(model.containsExternalRecipients()).equals(false)
			o(initializedModel.getAttachments().length).equals(0)
			o(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
		o("initWithDraft with some data", async function () {
			const draftMail = createMail({
				confidential: true,
				sender: createMailAddress(),
				toRecipients: [
					createMailAddress({
						address: "",
					}),
					createMailAddress({
						address: EXTERNAL_ADDRESS_1,
					}),
				],
				ccRecipients: [
					createMailAddress({
						address: EXTERNAL_ADDRESS_2,
					}),
				],
				bccRecipients: [],
				subject: SUBJECT_LINE_1,
				replyTos: [],
				conversationEntry: testIdGenerator.newIdTuple()
			})

			when(entity.load(ConversationEntryTypeRef, draftMail.conversationEntry))
				.thenResolve(createConversationEntry({conversationType: ConversationType.FORWARD}))

			const initializedModel = await model.initWithDraft(draftMail, [], BODY_TEXT_1, Promise.resolve(new Map()))
			o(initializedModel.getConversationType()).equals(ConversationType.FORWARD)
			o(initializedModel.getSubject()).equals(draftMail.subject)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(draftMail)
			o(initializedModel.allRecipients().length).equals(2)(
				"Only MailAddresses with a valid address will be accepted as recipients",
			)
			o(initializedModel.toRecipients().length).equals(1)
			o(initializedModel.ccRecipients().length).equals(1)
			o(initializedModel.bccRecipients().length).equals(0)
			o(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(model.isConfidential()).equals(true)
			o(model.containsExternalRecipients()).equals(true)
			o(initializedModel.getAttachments().length).equals(0)
			o(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
	})
	o.spec("Adding and removing recipients", function () {
		o.beforeEach(async function () {
			await model.initWithTemplate({}, "", "", [], false, "")
		})

		o("lazily resolved recipient will set it's promise to null when resolved", async function () {
			const recipient = {
				name: "sanchez",
				address: "123@test.com",
				contact: null,
			}
			const [r1] = model.addOrGetRecipient(RecipientField.TO, recipient, false)

			o(r1.contact).equals(null)("Contact not resolved yet, it's null")
			o(r1.resolveContactPromise).notEquals(null)("Contact not resolved yet, promise is non null")

			await r1.resolveContactPromise

			o(r1.contact).notEquals(null)("Contact has resolved and is no longer null")
			o(r1.resolveContactPromise).equals(null)("Contact has resolved, so it's promise is now null")
		})

		o("adding duplicate to-recipient", async function () {
			const recipient = {
				name: "sanchez",
				address: "123@test.com",
				contact: null,
			}
			const [r1] = model.addOrGetRecipient(RecipientField.TO, recipient, false)

			o(model.addOrGetRecipient(RecipientField.TO, recipient, false)[0] === r1).equals(true)("Adding same recipient a second time will return the same as the first time")

			o(model.toRecipients().length).equals(1)
			o(model.ccRecipients().length).equals(0)
			o(model.bccRecipients().length).equals(0)

			await r1.resolveContactPromise
			o(r1.contact!.mailAddresses[0].address).equals(recipient.address)
		})
		o("add different to-recipients", async function () {
			const pablo = {
				name: "pablo",
				address: "pablo94@test.co.uk",
				contact: null,
			}
			const cortez = {
				name: "cortez",
				address: "c.asd@test.net",
				contact: null,
			}
			const [r1] = model.addOrGetRecipient(RecipientField.TO, pablo, false)
			const [r2] = model.addOrGetRecipient(RecipientField.TO, cortez, false)
			o(r1 === r2).equals(false)
			o(model.toRecipients().length).equals(2)
			o(model.ccRecipients().length).equals(0)
			o(model.bccRecipients().length).equals(0)

			await r1.resolveContactPromise
			o(r1.contact!.mailAddresses[0].address).equals(pablo.address)

			await r2.resolveContactPromise
			o(r2.contact!.mailAddresses[0].address).equals(cortez.address)
		})
		o("add duplicate recipients to different fields", async function () {
			const recipient = {
				name: "sanchez",
				address: "123@test.com",
				contact: null,
			}
			const [r1] = model.addOrGetRecipient(RecipientField.TO, recipient, false)
			const [r2] = model.addOrGetRecipient(RecipientField.CC, recipient, false)
			o(r1 === r2).equals(false)
			o(model.toRecipients().length).equals(1)
			o(model.ccRecipients().length).equals(1)
			o(model.bccRecipients().length).equals(0)
			await r1.resolveContactPromise
			o(r1.contact!.mailAddresses[0].address).equals(recipient.address)
			await r2.resolveContactPromise
			o(r2.contact!.mailAddresses[0].address).equals(recipient.address)
		})
	})
	o.spec("Sending", function () {
		o("completely blank email", async function () {
			const method = MailMethod.NONE
			const getConfirmation = func<() => Promise<boolean>>()
			const e = await assertThrows(UserError, () => model.send(method, getConfirmation))
			o(e?.message).equals(lang.get("noRecipients_msg"))
			verify(getConfirmation(), {times: 0})
			verify(mailFacade.sendDraft(anything(), anything(), anything()), {times: 0})
			verify(mailFacade.createDraft(anything()), {times: 0})
			verify(mailFacade.updateDraft(anything()), {times: 0})
		})
		o("blank subject no confirm", async function () {
			await model.addOrGetRecipient(RecipientField.TO, {
				name: "test",
				address: "test@address.com",
				contact: null,
			})[0].resolveContactPromise
			const method = MailMethod.NONE
			const getConfirmation = func<() => Promise<boolean>>()
			const r = await model.send(method, getConfirmation)
			o(r).equals(false)
			verify(getConfirmation(), {times: 0})
			verify(mailFacade.sendDraft(anything(), anything(), anything()), {times: 0})
			verify(mailFacade.createDraft(anything()), {times: 0})
			verify(mailFacade.updateDraft(anything()), {times: 0})
		})
		o("confidential missing password", async function () {
			await model.addOrGetRecipient(RecipientField.TO, {
				name: "test",
				address: "test@address.com",
				contact: null,
			})[0].resolveContactPromise
			model.setConfidential(true)
			const method = MailMethod.NONE

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation(anything())).thenResolve(true)

			const e = await assertThrows(UserError, () => model.send(method, getConfirmation))
			o(e?.message).equals(lang.get("noPreSharedPassword_msg"))

			verify(mailFacade.sendDraft(anything(), anything(), anything()), {times: 0})
			verify(mailFacade.createDraft(anything()), {times: 0})
			verify(mailFacade.updateDraft(anything()), {times: 0})
		})
		o("confidential weak password no confirm", async function () {
			const recipient = {
				name: "test",
				address: "test@address.com",
				contact: null,
			}
			model.addOrGetRecipient(RecipientField.TO, recipient)
			model.setSubject("subject")
			model.setPassword("test@address.com", "abc")
			o(model.getPassword(recipient.address)).equals("abc")
			model.setConfidential(true)
			const method = MailMethod.NONE

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation(anything())).thenResolve(false)

			const r = await model.send(method, getConfirmation)
			o(r).equals(false)
			verify(mailFacade.sendDraft(anything(), anything(), anything()), {times: 0})
			verify(mailFacade.createDraft(anything()), {times: 0})
			verify(mailFacade.updateDraft(anything()), {times: 0})
		})
		o("confidential weak password confirm", async function () {
			const recipient = {
				name: "test",
				address: "test@address.com",
				contact: null,
			}
			model.addOrGetRecipient(RecipientField.TO, recipient)
			model.setSubject("did you get that thing i sent ya?")
			const password = WEAK_PASSWORD
			model.setPassword("test@address.com", password)
			o(model.getPassword(recipient.address)).equals(password)
			model.setConfidential(true)
			const method = MailMethod.NONE
			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation(anything())).thenResolve(true)

			const r = await model.send(method, getConfirmation)
			o(r).equals(true)

			verify(mailFacade.sendDraft(anything(), anything(), anything()), {times: 1})
			verify(mailFacade.createDraft(anything()), {times: 1})
			verify(mailFacade.updateDraft(anything()), {times: 0})

			const contact = model.getRecipientList(RecipientField.TO)[0].contact!
			o(contact.presharedPassword).equals(password)
		})

		o("correct password will be returned from getPassword after calling setPassword", function () {
			model.setPassword("address1", "password1")
			model.setPassword("address2", "password2")

			o(model.getPassword("address2")).equals("password2")
			o(model.getPassword("address1")).equals("password1")
		})

		o("confidential strong password", async function () {
			const address = "test@address.com"
			const recipient = {
				name: "test",
				address: address,
				contact: null,
			}
			model.addOrGetRecipient(RecipientField.TO, recipient)
			model.setSubject("did you get that thing i sent ya?")
			const password = STRONG_PASSWORD
			model.setPassword(address, password)
			model.setConfidential(true)
			const method = MailMethod.NONE

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()

			const r = await model.send(method, getConfirmation)
			o(r).equals(true)

			verify(getConfirmation(anything), {times: 0})

			verify(mailFacade.sendDraft(anything(), anything(), anything()), {times: 1})
			verify(mailFacade.createDraft(anything()), {times: 1})
			verify(mailFacade.updateDraft(anything()), {times: 0})

			const contact = model.getRecipientList(RecipientField.TO)[0].contact!
			o(contact.presharedPassword).equals(password)
		})

		o("when a recipient doesn't have an existing contact, it will be created", async function () {
			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()

			const [recipientInfo, resolveContactPromise] = model.addOrGetRecipient(
				RecipientField.TO,
				{
					name: "chippie",
					address: "chippie@cinco.net",
					contact: null
				}
			)

			model.setPassword("chippie@cinco.net", STRONG_PASSWORD)
			model.setSubject("did you get that thing i sent ya?")
			model.setConfidential(true)

			await model.send(MailMethod.NONE, getConfirmation)

			verify(entity.setup("contactListId", argThat((contact) => isSameTypeRef(ContactTypeRef, contact._type))))
			verify(entity.update(anything()), {times: 0})
		})

		o("when a recipient has an existing contact, it won't be created or updated", async function () {
			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()

			const [recipientInfo, resolveContactPromise] = model.addOrGetRecipient(
				RecipientField.TO,
				{
					name: "chippie",
					address: "chippie@cinco.net",
					contact: createContact({
						_id: testIdGenerator.newIdTuple(),
						firstName: "my",
						lastName: "chippie",
						presharedPassword: STRONG_PASSWORD,
					})
				}
			)

			model.setSubject("did you get that thing i sent ya?")
			model.setConfidential(true)

			await model.send(MailMethod.NONE, getConfirmation)

			verify(entity.setup(anything(), anything(), anything()), {times: 0})
			verify(entity.update(anything()), {times: 0})
		})

		o("when a recipient has an existing contact, and the saved password changes, then the contact will be updated", async function () {
			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()

			const contact = createContact({
				_id: testIdGenerator.newIdTuple(),
				firstName: "my",
				lastName: "chippie",
				presharedPassword: "weak password",
			})

			const [recipientInfo, resolveContactPromise] = model.addOrGetRecipient(
				RecipientField.TO,
				{
					name: "chippie",
					address: "chippie@cinco.net",
					contact
				}
			)

			model.setPassword("chippie@cinco.net", STRONG_PASSWORD)
			model.setSubject("did you get that thing i sent ya?")
			model.setConfidential(true)

			await model.send(MailMethod.NONE, getConfirmation)

			verify(entity.update(contact), {times: 1})
		})
	})
	o.spec("Entity Event Updates", function () {
		let existingContact

		o.beforeEach(async function () {

			existingContact = createContact({
				_id: testIdGenerator.newIdTuple(),
				firstName: "james",
				lastName: "hetfield",
			})

			const recipients = [
				{
					name: "paul gilbert",
					address: "paul@gmail.com",
					contact: null,
				},
				{
					name: "james hetfield",
					address: "james@tutanota.com",
					contact: existingContact,
				},
			]
			await model.initWithTemplate(
				{
					to: recipients,
				},
				"they all drink lemonade",
				"",
			)
		})

		o("nonmatching event", async function () {
			await model._handleEntityEvent(downcast(CustomerAccountCreateDataTypeRef))
			await model._handleEntityEvent(downcast(UserTypeRef))
			await model._handleEntityEvent(downcast(CustomerTypeRef))
			await model._handleEntityEvent(downcast(NotificationMailTypeRef))
			await model._handleEntityEvent(downcast(ChallengeTypeRef))
			await model._handleEntityEvent(downcast(MailTypeRef))
			verify(entity.load(anything(), anything(), anything(), anything()), {times: 0})
		})

		o("contact updated email kept", async function () {
			const {app, type} = ContactTypeRef
			const [instanceListId, instanceId] = existingContact._id
			const contactForUpdate = {
				firstName: "newfirstname",
				lastName: "newlastname",
				mailAddresses: [
					createMailAddress({
						address: "james@tutanota.com",
					}),
					createMailAddress({
						address: "address2@hotmail.com",
					}),
				],
			}
			when(entity.load(ContactTypeRef, argThat((id) => isSameId(id, existingContact._id))))
				.thenResolve(createContact(Object.assign({_id: existingContact._id} as Contact, contactForUpdate)))

			await model._handleEntityEvent(
				{
					application: app,
					type,
					operation: OperationType.UPDATE,
					instanceListId,
					instanceId,
				},
			)
			o(model.allRecipients().length).equals(2)
			const updatedRecipient = model
				.allRecipients()
				.find(r => r.contact && isSameId(r.contact._id, existingContact._id))
			o(updatedRecipient && updatedRecipient.name).equals(getContactDisplayName(downcast(contactForUpdate)))
		})
		o("contact updated email removed or changed", async function () {
			const {app, type} = ContactTypeRef
			const [instanceListId, instanceId] = existingContact._id
			const contactForUpdate = {
				firstName: "james",
				lastName: "hetfield",
				mailAddresses: [
					createMailAddress({
						address: "nolongerjames@hotmail.com",
					}),
				],
			}

			when(entity.load(ContactTypeRef, existingContact._id))
				.thenResolve(
					createContact(Object.assign({
						_id: existingContact._id,
					} as Contact, contactForUpdate))
				)

			await model._handleEntityEvent(
				{
					application: app,
					type,
					operation: OperationType.UPDATE,
					instanceListId,
					instanceId,
				},
			)
			o(model.allRecipients().length).equals(1)
			const updatedContact = model
				.allRecipients()
				.find(r => r.contact && isSameId(r.contact._id, existingContact._id))
			o(updatedContact ?? null).equals(null)
		})
		o("contact removed", async function () {
			const {app, type} = ContactTypeRef
			const [instanceListId, instanceId] = existingContact._id
			await model._handleEntityEvent(
				{
					application: app,
					type,
					operation: OperationType.DELETE,
					instanceListId,
					instanceId,
				},
			)
			o(model.allRecipients().length).equals(1)
			const updatedContact = model
				.allRecipients()
				.find(r => r.contact && isSameId(r.contact._id, existingContact._id))
			o(updatedContact == null).equals(true)
		})
		o("too many to recipients dont confirm", async function () {
			const recipients = {
				to: [] as {name: string, address: string}[],
			}

			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.to.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`,
				})
			}

			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation("manyRecipients_msg")).thenResolve(false)

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")
			o(await model.send(MailMethod.NONE, getConfirmation)).equals(false)
		})
		o("too many to recipients confirm", async function () {
			const recipients = {
				to: [] as {name: string, address: string}[],
			}

			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.to.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`,
				})
			}

			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation("manyRecipients_msg")).thenResolve(true)

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")

			o(await model.send(MailMethod.NONE, getConfirmation)).equals(true)
		})
		o("too many cc recipients dont confirm", async function () {
			const recipients = {
				cc: [] as {name: string, address: string}[],
			}

			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.cc.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`,
				})
			}

			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation("manyRecipients_msg")).thenResolve(false)

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")
			o(await model.send(MailMethod.NONE, getConfirmation)).equals(false)
		})
		o("too many cc recipients confirm", async function () {
			const recipients = {
				cc: [] as {name: string, address: string}[],
			}

			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.cc.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`,
				})
			}

			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation("manyRecipients_msg")).thenResolve(true)

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")
			o(await model.send(MailMethod.NONE, getConfirmation)).equals(true)
		})
	})
})