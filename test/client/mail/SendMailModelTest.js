// @flow

import o from "ospec"
// $FlowIgnore[untyped-import]
import en from "../../../src/translations/en"
import type {IUserController} from "../../../src/api/main/UserController"
import type {LoginController} from "../../../src/api/main/LoginController"
import type {MailboxDetail, MailModel} from "../../../src/mail/model/MailModel"
import type {Contact} from "../../../src/api/entities/tutanota/Contact"
import {ContactTypeRef, createContact} from "../../../src/api/entities/tutanota/Contact"
import type {ContactModel} from "../../../src/contacts/model/ContactModel"
import {downcast, identity, neverNull} from "../../../src/api/common/utils/Utils"
import type {TutanotaProperties} from "../../../src/api/entities/tutanota/TutanotaProperties"
import {createTutanotaProperties} from "../../../src/api/entities/tutanota/TutanotaProperties"
import {SendMailModel, TOO_MANY_VISIBLE_RECIPIENTS} from "../../../src/mail/editor/SendMailModel"
import {createGroupInfo} from "../../../src/api/entities/sys/GroupInfo"
import {createMailboxGroupRoot} from "../../../src/api/entities/tutanota/MailboxGroupRoot"
import {createGroup} from "../../../src/api/entities/sys/Group"
import {createMailBox} from "../../../src/api/entities/tutanota/MailBox"
import type {WorkerClient} from "../../../src/api/main/WorkerClient"
import {ConversationType, GroupType, MailMethod, OperationType} from "../../../src/api/common/TutanotaConstants"
import {lang} from "../../../src/misc/LanguageViewModel"
import type {Customer} from "../../../src/api/entities/sys/Customer"
import {CustomerTypeRef} from "../../../src/api/entities/sys/Customer"
import {mockAttribute, unmockAttribute} from "../../api/TestUtils"
import type {User} from "../../../src/api/entities/sys/User"
import {createUser, UserTypeRef} from "../../../src/api/entities/sys/User"
import type {RecipientInfo} from "../../../src/api/common/RecipientInfo"
import {isTutanotaMailAddress, RecipientInfoType} from "../../../src/api/common/RecipientInfo"
import type {Mail} from "../../../src/api/entities/tutanota/Mail"
import {createMail, MailTypeRef} from "../../../src/api/entities/tutanota/Mail"
import type {EventController} from "../../../src/api/main/EventController"
import {createMailAddress} from "../../../src/api/entities/tutanota/MailAddress"
import {createGroupMembership} from "../../../src/api/entities/sys/GroupMembership"
import {UserError} from "../../../src/api/main/UserError"
import {ContactListTypeRef} from "../../../src/api/entities/tutanota/ContactList"
import {NotFoundError} from "../../../src/api/common/error/RestError"
import {EntityClient} from "../../../src/api/common/EntityClient"
import {locator} from "../../../src/api/main/MainLocator"
import {CustomerAccountCreateDataTypeRef} from "../../../src/api/entities/tutanota/CustomerAccountCreateData"
import {NotificationMailTypeRef} from "../../../src/api/entities/tutanota/NotificationMail"
import {ChallengeTypeRef} from "../../../src/api/entities/sys/Challenge"
import {getContactDisplayName} from "../../../src/contacts/model/ContactUtils"
import {createConversationEntry} from "../../../src/api/entities/tutanota/ConversationEntry"
import {isSameId} from "../../../src/api/common/utils/EntityUtils";
import {isSameTypeRef, TypeRef} from "../../../src/api/common/utils/TypeRef";
import type {HttpMethodEnum} from "../../../src/api/common/EntityFunctions"
import {SysService} from "../../../src/api/entities/sys/Services"
import {createPublicKeyReturn} from "../../../src/api/entities/sys/PublicKeyReturn"


type TestIdGenerator = {
	newId: () => Id,
	newListId: () => Id,
	newIdTuple: () => IdTuple
}
let testIdGenerator: TestIdGenerator
let internalAddresses = []

function mockWorker(): WorkerClient {
	return downcast({
		createMailDraft(...args): Promise<Mail> {
			return Promise.resolve(createMail())
		},
		updateMailDraft(...args): Promise<Mail> {
			return Promise.resolve(createMail())
		},
		sendMailDraft(...args): Promise<void> {
			return Promise.resolve()
		},
		entityRequest(...args): Promise<any> {
			return Promise.resolve()
		},
		serviceRequest<T>(service: SysServiceEnum | TutanotaServiceEnum | MonitorServiceEnum | AccountingServiceEnum, method: HttpMethodEnum, requestEntity: ?any, responseTypeRef: ?TypeRef<T>, queryParameter: ?Params, sk: ?Aes128Key, extraHeaders?: Params): Promise<any> {
			if (service === SysService.PublicKeyService) {
				return Promise.resolve().then(() => internalAddresses.includes(downcast(requestEntity).mailAddress) ? createPublicKeyReturn({pubKey: new Uint8Array(0)}) : null)
			}
			return Promise.resolve()
		}
	})
}

function mockLoginController(userController: IUserController, internalLoggedIn: boolean = true): LoginController {
	return downcast({
		userController,
		isInternalUserLoggedIn: () => internalLoggedIn,
		getUserController() { return this.userController }
	})
}

function mockUserController(user: User, props: TutanotaProperties, customer: Customer): IUserController {
	return downcast({
		user,
		loadCustomer: () => Promise.resolve(customer),
		props
	})
}

class ContactModelMock implements ContactModel {
	contacts: Array<Contact>

	constructor(contacts: Array<Contact>) {
		this.contacts = contacts
	}

	searchForContact(mailAddress: string): Promise<?Contact> {
		const contact = this.contacts.find(contact => contact.mailAddresses.includes(mailAddress))
		return Promise.resolve(contact)
	}

	contactListId(): Promise<Id> {
		return Promise.resolve("contactListId")
	}


	searchForContacts(query: string, field: string, minSuggestionCount: number): Promise<Contact[]> {
		throw new Error("stub!")
	}

	searchForContactByMailAddress(mailAddress: string): Promise<?Contact> {
		throw new Error("stub!")
	}
}

function mockEntity<T>(typeRef: TypeRef<T>, id: Id | IdTuple, attrs: Object): any {
	return Object.assign({_type: typeRef, _id: id}, attrs)
}

const EXTERNAL_ADDRESS_1 = "address1@test.com"
const EXTERNAL_ADDRESS_2 = "address2@test.com"

const DEFAULT_SENDER_FOR_TESTING = "test@tutanota.de"
const INTERNAL_RECIPIENT_1 = {
	name: "test1",
	address: "test1@tutanota.de",
	contact: null
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
	// the global worker is used in various other places silently, like in call to update from _updateContacts
	let worker: WorkerClient, logins: LoginController, eventController: EventController, mailModel: MailModel, contactModel: ContactModel,
		mailboxDetails: MailboxDetail, userController: IUserController, entity: EntityClient, model: SendMailModel
	let customer: Customer

	let mockedAttributeReferences = []

	o.beforeEach(function () {

		currentIdValue: 0,
			testIdGenerator = {
				currentListIdValue: 0,
				newId(): Id {
					return (this.currentIdValue++).toString()
				},
				newListId(): Id {
					return (this.currentListIdValue++).toString()
				},
				newIdTuple(): IdTuple {
					return [this.newListId(), this.newId()]
				}
			}

		worker = mockWorker()
		locator.init(worker) // because it is used in certain parts of the code

		entity = new EntityClient(worker)
		mockedAttributeReferences.push(mockAttribute(entity, entity.loadRoot, <T>(typeRef: TypeRef<T>, groupId: Id) => {
			if (isSameTypeRef(typeRef, ContactListTypeRef)) {
				return Promise.resolve(downcast({contacts: testIdGenerator.newId()}))
			} else {
				throw new NotFoundError("entity not found: " + typeRef.type + " " + groupId)
			}
		}))

		mockedAttributeReferences.push(mockAttribute(entity, entity.setup, <T>(typeRef: TypeRef<T>, groupId: Id) => {
			return Promise.resolve({})
		}))

		mockedAttributeReferences.push(mockAttribute(entity, entity.update, <T>(typeRef: TypeRef<T>, groupId: Id) => {
			return Promise.resolve({})
		}))

		customer = downcast({})

		const tutanotaProperties = createTutanotaProperties(downcast({
			defaultSender: DEFAULT_SENDER_FOR_TESTING,
			defaultUnconfidential: true,
			notificationMailLanguage: "en",
			noAutomaticContacts: false,
			userGroupInfo: createGroupInfo({}),
			// emailSignatureType: EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT,
			// customEmailSignature: "CUSTOM TEST SIGNATURE"
		}))

		const mockUser = createUser({
			userGroup: createGroupMembership({_id: testIdGenerator.newId(), group: testIdGenerator.newId()}),
			memberships: [
				createGroupMembership(
					{
						_id: testIdGenerator.newId(),
						groupType: GroupType.Contact,
					})
			]
		})
		userController = mockUserController(mockUser, tutanotaProperties, customer)
		logins = mockLoginController(userController)

		eventController = downcast({
			addEntityListener: o.spy(() => {}),
			removeEntityListener: o.spy(() => {})
		})

		mailModel = downcast({})

		contactModel = new ContactModelMock([])


		mailboxDetails = {
			mailbox: createMailBox(),
			folders: [],
			mailGroupInfo: createGroupInfo(),
			mailGroup: createGroup(),
			mailboxGroupRoot: createMailboxGroupRoot()
		}
		model = new SendMailModel(worker, logins, mailModel, contactModel, downcast(eventController), entity, mailboxDetails)

		mockedAttributeReferences.push(mockAttribute(model, model._getDefaultSender, () => DEFAULT_SENDER_FOR_TESTING))


		mockedAttributeReferences.push(mockAttribute(model._entity, model._entity.load, (typeRef, id, params) => {
			return Promise.resolve({_type: typeRef, _id: id})
		}))

		mockedAttributeReferences.push(mockAttribute(worker, worker.sendMailDraft, o.spy(worker.sendMailDraft)))
		mockedAttributeReferences.push(mockAttribute(worker, worker.createMailDraft, o.spy(worker.createMailDraft)))
		mockedAttributeReferences.push(mockAttribute(worker, worker.updateMailDraft, o.spy(worker.updateMailDraft)))
	})

	o.afterEach(function () {
		mockedAttributeReferences.forEach(ref => unmockAttribute(ref))
		mockedAttributeReferences = []
	})


	o.spec("initialization", function () {
		o.beforeEach(function () {
			mockAttribute(model, model._createAndResolveRecipientInfo, (name, address, contact, resolveLazily) => {
				const ri: RecipientInfo = {
					type: isTutanotaMailAddress(address) ? RecipientInfoType.INTERNAL : RecipientInfoType.EXTERNAL,
					mailAddress: address,
					name: name,
					contact: contact || createContact({
						firstName: name,
						mailAddresses: [address]
					}),
					resolveContactPromise: null
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
				{to: [INTERNAL_RECIPIENT_1]},
				SUBJECT_LINE_1,
				BODY_TEXT_1,
				[],
				false,
				DEFAULT_SENDER_FOR_TESTING
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
				contact: INTERNAL_RECIPIENT_1.contact
			}
			const initializedModel = await model.initWithTemplate(
				{to: [INTERNAL_RECIPIENT_1, duplicate]},
				SUBJECT_LINE_1,
				BODY_TEXT_1,
				[],
				false,
				DEFAULT_SENDER_FOR_TESTING
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
			const loadMock = mockAttribute(entity, entity.load, <T>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params, extraHeaders?: Params) => {
				const values = {_id: id}
				const ce = createConversationEntry()
				ce.conversationType = ConversationType.REPLY
				return Promise.resolve(ce)
			})
			const draftMail = createMail({
				confidential: false,
				sender: createMailAddress(),
				toRecipients: [],
				ccRecipients: [],
				bccRecipients: [],
				subject: "",
				replyTos: []
			})
			const initializedModel = await model.initWithDraft(draftMail, [], BODY_TEXT_1)
			unmockAttribute(loadMock)

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
			const loadMock = mockAttribute(entity, entity.load, <T>(typeRef: TypeRef<T>, id: Id | IdTuple, queryParams: ?Params, extraHeaders?: Params) => {
				const values = {_id: id}
				const ce = createConversationEntry()
				ce.conversationType = ConversationType.FORWARD
				return Promise.resolve(ce)
			})
			const draftMail = createMail({
				confidential: true,
				sender: createMailAddress(),
				toRecipients: [createMailAddress({address: ""}), createMailAddress({address: EXTERNAL_ADDRESS_1})],
				ccRecipients: [createMailAddress({address: EXTERNAL_ADDRESS_2})],
				bccRecipients: [],
				subject: SUBJECT_LINE_1,
				replyTos: []
			})
			const initializedModel = await model.initWithDraft(draftMail, [], BODY_TEXT_1)
			unmockAttribute(loadMock)

			o(initializedModel.getConversationType()).equals(ConversationType.FORWARD)
			o(initializedModel.getSubject()).equals(draftMail.subject)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(draftMail)
			o(initializedModel.allRecipients().length).equals(2)("Only MailAddresses with a valid address will be accepted as recipients")
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

		o("adding duplicate to recipient", async function () {
			const recipient = {
				name: "sanchez",
				address: "123@test.com",
				contact: null
			}
			const [r1] = model.addOrGetRecipient("to", recipient, false)
			o(r1.contact === null).equals(true)
			o(r1.resolveContactPromise === null).equals(false)
			o(model.addOrGetRecipient("to", recipient, false)[0] === r1).equals(true)
			o(model.toRecipients().length).equals(1)
			o(model.ccRecipients().length).equals(0)
			o(model.bccRecipients().length).equals(0)
			await r1.resolveContactPromise
			o(r1.contact === null).equals(false)
			o(r1.resolveContactPromise === null).equals(true)
			o(neverNull(r1.contact).mailAddresses[0].address).equals(recipient.address)

		})

		o("add different to recipients", async function () {
			const pablo = {
				name: "pablo",
				address: "pablo94@test.co.uk",
				contact: null
			}

			const cortez = {
				name: "cortez",
				address: "c.asd@test.net",
				contact: null
			}
			const [r1] = model.addOrGetRecipient("to", pablo, false)
			const [r2] = model.addOrGetRecipient("to", cortez, false)
			o(r1.contact === null).equals(true)
			o(r1.resolveContactPromise === null).equals(false)
			o(r2.contact === null).equals(true)
			o(r2.resolveContactPromise === null).equals(false)
			o(r1 === r2).equals(false)
			o(model.toRecipients().length).equals(2)
			o(model.ccRecipients().length).equals(0)
			o(model.bccRecipients().length).equals(0)

			await r1.resolveContactPromise
			o(r1.contact === null).equals(false)
			o(r1.resolveContactPromise === null).equals(true)
			o(neverNull(r1.contact).mailAddresses[0].address).equals(pablo.address)

			await r2.resolveContactPromise
			o(r2.contact === null).equals(false)
			o(r2.resolveContactPromise === null).equals(true)
			o(neverNull(r2.contact).mailAddresses[0].address).equals(cortez.address)

		})

		o("add duplicate recipients to different fields", async function () {
			const recipient = {
				name: "sanchez",
				address: "123@test.com",
				contact: null
			}
			const [r1] = model.addOrGetRecipient("to", recipient, false)
			const [r2] = model.addOrGetRecipient("cc", recipient, false)

			o(r1.contact === null).equals(true)
			o(r1.resolveContactPromise === null).equals(false)
			o(r2.contact === null).equals(true)
			o(r2.resolveContactPromise === null).equals(false)
			o(r1 === r2).equals(false)
			o(model.toRecipients().length).equals(1)
			o(model.ccRecipients().length).equals(1)
			o(model.bccRecipients().length).equals(0)

			await r1.resolveContactPromise
			o(r1.contact === null).equals(false)
			o(r1.resolveContactPromise === null).equals(true)
			o(neverNull(r1.contact).mailAddresses[0].address).equals(recipient.address)

			await r2.resolveContactPromise
			o(r2.contact === null).equals(false)
			o(r2.resolveContactPromise === null).equals(true)
			o(neverNull(r2.contact).mailAddresses[0].address).equals(recipient.address)
		})
	})

	o.spec("Sending", function () {

		o("completely blank email", async function () {
			const method = MailMethod.NONE
			const getConfirmation = o.spy(_ => Promise.resolve(true))

			const e = await model.send(method, getConfirmation).catch(identity)
			o(Object.getPrototypeOf(e)).equals(UserError.prototype)
			o(e.message).equals(lang.get("noRecipients_msg"))
			o(getConfirmation.callCount).equals(0)
			o(worker.sendMailDraft.callCount).equals(0)
			o(worker.createMailDraft.callCount).equals(0)
			o(worker.updateMailDraft.callCount).equals(0)
		})

		o("blank subject no confirm", async function () {

			await model.addOrGetRecipient("to", {name: "test", address: "test@address.com", contact: null})[0].resolveContactPromise

			const method = MailMethod.NONE
			const getConfirmation = o.spy(_ => Promise.resolve(false))

			const r = await model.send(method, getConfirmation)
			o(r).equals(false)
			o(getConfirmation.callCount).equals(1)
			o(worker.sendMailDraft.callCount).equals(0)
			o(worker.createMailDraft.callCount).equals(0)
			o(worker.updateMailDraft.callCount).equals(0)
		})

		o("confidential missing password", async function () {

			await model.addOrGetRecipient("to", {name: "test", address: "test@address.com", contact: null})[0].resolveContactPromise
			model.setConfidential(true)

			const method = MailMethod.NONE
			const getConfirmation = o.spy(_ => Promise.resolve(true))

			const e = await model.send(method, getConfirmation).catch(identity)
			o(Object.getPrototypeOf(e)).equals(UserError.prototype)
			o(e.message).equals(lang.get("noPreSharedPassword_msg"))
			o(getConfirmation.callCount).equals(1)
			o(worker.sendMailDraft.callCount).equals(0)
			o(worker.createMailDraft.callCount).equals(0)
			o(worker.updateMailDraft.callCount).equals(0)
		})


		o("confidential weak password no confirm", async function () {

			const recipient = {name: "test", address: "test@address.com", contact: null}
			model.addOrGetRecipient("to", recipient)
			model.setSubject("subject")
			model.setPassword("test@address.com", "abc")
			o(model.getPassword(recipient.address)).equals("abc")
			model.setConfidential(true)

			const method = MailMethod.NONE
			const getConfirmation = o.spy(_ => Promise.resolve(false))

			const r = await model.send(method, getConfirmation)
			o(r).equals(false)
			o(getConfirmation.callCount).equals(1)
			o(worker.sendMailDraft.callCount).equals(0)
			o(worker.createMailDraft.callCount).equals(0)
			o(worker.updateMailDraft.callCount).equals(0)
		})


		o("confidential weak password confirm", async function () {

			const recipient = {name: "test", address: "test@address.com", contact: null}
			model.addOrGetRecipient("to", recipient)
			model.setSubject("did you get that thing i sent ya?")
			const password = WEAK_PASSWORD
			model.setPassword("test@address.com", password)
			o(model.getPassword(recipient.address)).equals(password)
			model.setConfidential(true)

			const method = MailMethod.NONE
			const getConfirmation = o.spy(_ => Promise.resolve(true))

			const r = await model.send(method, getConfirmation)
			o(r).equals(true)
			o(getConfirmation.callCount).equals(1)
			o(worker.sendMailDraft.callCount).equals(1)
			o(worker.createMailDraft.callCount).equals(1)
			o(worker.updateMailDraft.callCount).equals(0)
			const contact = model.getRecipientList("to")[0].contact
			o(contact && contact.presharedPassword).equals(password)
			o(entity.setup.callCount).equals(1)
			o(entity.setup.args.includes(contact)).equals(true)
			o(entity.update.callCount).equals(0)
		})

		o("confidential strong password", async function () {

			const address = "test@address.com"
			const recipient = {name: "test", address: address, contact: null}
			model.addOrGetRecipient("to", recipient)
			model.setSubject("did you get that thing i sent ya?")
			const password = STRONG_PASSWORD
			model.setPassword(address, password)
			o(model.getPassword(address)).equals(password)
			model.setConfidential(true)


			const method = MailMethod.NONE
			const getConfirmation = o.spy(msg => {
				o("We shouldn't call getConfirmation").equals("But we did");
				return Promise.resolve(false)
			})

			const r = await model.send(method, getConfirmation)
			o(r).equals(true)
			o(getConfirmation.callCount).equals(0)
			o(worker.sendMailDraft.callCount).equals(1)
			o(worker.createMailDraft.callCount).equals(1)
			o(worker.updateMailDraft.callCount).equals(0)
			const contact = model.getRecipientList("to")[0].contact
			o(contact && contact.presharedPassword).equals(password)
			o(entity.setup.callCount).equals(1)
			o(entity.setup.args.includes(contact)).equals(true)
			o(entity.update.callCount).equals(0)
		})

		o("existing and new contacts", async function () {

			const password = STRONG_PASSWORD
			const recipients = [
				{name: "paul gilbert", address: "paul@gmail.com", contact: null},
				{name: "steve vai", address: "steve@gmail.com", contact: null},
				{name: "ingwe malmsteen", address: "ingwe@tutanota.com", contact: null},
				{
					name: "frank zappa", address: "frank@gmail.com", contact: createContact({
						_id: testIdGenerator.newIdTuple(),
						firstName: "frank",
						lastName: "zappa",
						presharedPassword: null
					})
				},
				{
					name: "ronnie james dio", address: "dio@gmail.com", contact: createContact({
						_id: testIdGenerator.newIdTuple(),
						firstName: "ronnie james",
						lastName: "dio",
						presharedPassword: STRONG_PASSWORD // <---- this contact will not be updated
					})
				},
				{
					name: "guthrie govan", address: "guthrie@gmail.com", contact: createContact({
						_id: testIdGenerator.newIdTuple(),
						firstName: "guthrie",
						lastName: "govan",
						presharedPassword: "some old password"
					})
				},
				{
					name: "james hetfield", address: "james@tutanota.com", contact: createContact({
						_id: testIdGenerator.newIdTuple(),
						firstName: "james",
						lastName: "hetfield",
					})
				}
			]

			recipients.forEach((r) => {
				model.addOrGetRecipient("to", r)
				o(model.getPassword(r.address)).equals(r.contact
					? r.contact.presharedPassword || ""
					: "")("If a recipient was added with a contact that has a password, we want to set that password on the way in")
			})

			o(model.allRecipients().length).equals(recipients.length)

			recipients.forEach(r => {
				model.setPassword(r.address, password)
			})

			model.setSubject("did you get that thing i sent ya?")
			model.setConfidential(true)


			const method = MailMethod.NONE
			const getConfirmation = o.spy(_ => {
				o("We shouldn't call getConfirmation").equals("But we did");
				return Promise.resolve(false)
			})

			const numContactsToSetup = 3
			const numContactsToUpdate = 2


			const r = await model.send(method, getConfirmation)
			o(r).equals(true)

			o(getConfirmation.callCount).equals(0)
			o(worker.sendMailDraft.callCount).equals(1)
			o(worker.createMailDraft.callCount).equals(1)
			o(worker.updateMailDraft.callCount).equals(0)

			o(entity.setup.callCount).equals(numContactsToSetup)("contacts that didn't already exist should have been created in the server")
			o(entity.update.callCount).equals(numContactsToUpdate)("contacts that did already exist should be updated in the server if they received a new password")

			const didUpdateDio = entity.update.calls.some(call => call.args[0].mailAddresses.includes("dio@gmail.com"))
			o(didUpdateDio).equals(false)("When an external recipient doesn't have it's password changed, then we dont make an update in the server")
		})
	})

	o.spec("Entity Event Updates", function () {

		let loadMock
		let existingContact

		o.beforeEach(async function () {
			existingContact = createContact({
				_id: testIdGenerator.newIdTuple(),
				firstName: "james",
				lastName: "hetfield",
			})

			const recipients = [
				{name: "paul gilbert", address: "paul@gmail.com", contact: null},
				{
					name: "james hetfield", address: "james@tutanota.com", contact: existingContact
				}

			]

			await model.initWithTemplate({to: recipients}, "they all drink lemonade", "")
		})

		o("nonmatching event", async function () {
			let spy = o.spy(entity.load)
			/*
			export type EntityUpdateData = {
				application: string,
				type: string,
				instanceListId: string,
				instanceId: string,
				operation: OperationTypeEnum
			}
			 */
			await model._handleEntityEvent(downcast(CustomerAccountCreateDataTypeRef))
			await model._handleEntityEvent(downcast(UserTypeRef))
			await model._handleEntityEvent(downcast(CustomerTypeRef))
			await model._handleEntityEvent(downcast(NotificationMailTypeRef))
			await model._handleEntityEvent(downcast(ChallengeTypeRef))
			await model._handleEntityEvent(downcast(MailTypeRef))

			o(spy.callCount).equals(0)
		})

		o("contact updated email kept", async function () {
			const {app, type} = ContactTypeRef
			const [instanceListId, instanceId] = existingContact._id

			const contactForUpdate = {
				firstName: "newfirstname",
				lastName: "newlastname",
				mailAddresses: [createMailAddress({address: "james@tutanota.com"}), createMailAddress({address: "address2@hotmail.com"})]
			}

			loadMock = mockAttribute(entity, entity.load, <T>(typeRef: TypeRef<T>, id: IdTuple, ...args) => {
				const values = {_id: id}
				return Promise.resolve(createContact(Object.assign(downcast(values), contactForUpdate)))
			})

			await model._handleEntityEvent(downcast({application: app, type, operation: OperationType.UPDATE, instanceListId, instanceId}))

			unmockAttribute(loadMock)

			o(model.allRecipients().length).equals(2)
			const updatedRecipient = model.allRecipients().find(r => r.contact
				&& isSameId(r.contact._id, existingContact._id))
			o(updatedRecipient && updatedRecipient.name).equals(getContactDisplayName(downcast(contactForUpdate)))

		})

		o("contact updated email removed or changed", async function () {
			const {app, type} = ContactTypeRef
			const [instanceListId, instanceId] = existingContact._id

			const contactForUpdate = {
				firstName: "james",
				lastName: "hetfield",
				mailAddresses: [createMailAddress({address: "nolongerjames@hotmail.com"})]
			}

			loadMock = mockAttribute(entity, entity.load, <T>(typeRef: TypeRef<T>, id: IdTuple, ...args) => {
				const values = {_id: id}
				return Promise.resolve(createContact(Object.assign(downcast(values), contactForUpdate)))
			})

			await model._handleEntityEvent(downcast({application: app, type, operation: OperationType.UPDATE, instanceListId, instanceId}))

			unmockAttribute(loadMock)

			o(model.allRecipients().length).equals(1)
			const updatedContact = model.allRecipients().find(r => r.contact
				&& isSameId(r.contact._id, existingContact._id))
			o(updatedContact == null).equals(true)

		})

		o("contact removed", async function () {
			const {app, type} = ContactTypeRef
			const [instanceListId, instanceId] = existingContact._id

			await model._handleEntityEvent(downcast({application: app, type, operation: OperationType.DELETE, instanceListId, instanceId}))

			o(model.allRecipients().length).equals(1)
			const updatedContact = model.allRecipients().find(r => r.contact
				&& isSameId(r.contact._id, existingContact._id))
			o(updatedContact == null).equals(true)

		})

		o("too many to recipients dont confirm", async function () {
			const recipients = {to: []}
			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.to.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`
				})
			}
			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = o.spy(() => Promise.resolve(false))

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")
			o(await model.send(MailMethod.NONE, getConfirmation)).equals(false)
			o(getConfirmation.calls).deepEquals([{this: undefined, args: ["manyRecipients_msg"]}])
		})

		o("too many to recipients confirm", async function () {
			const recipients = {to: []}
			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.to.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`
				})
			}
			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = o.spy(() => Promise.resolve(true))

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")
			o(await model.send(MailMethod.NONE, getConfirmation)).equals(true)
			o(getConfirmation.calls).deepEquals([{this: undefined, args: ["manyRecipients_msg"]}])
		})

		o("too many cc recipients dont confirm", async function () {
			const recipients = {cc: []}
			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.cc.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`
				})
			}
			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = o.spy(() => Promise.resolve(false))

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")
			o(await model.send(MailMethod.NONE, getConfirmation)).equals(false)
			o(getConfirmation.calls).deepEquals([{this: undefined, args: ["manyRecipients_msg"]}])
		})

		o("too many cc recipients confirm", async function () {
			const recipients = {cc: []}
			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.cc.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`
				})
			}
			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = o.spy(() => Promise.resolve(true))

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")
			o(await model.send(MailMethod.NONE, getConfirmation)).equals(true)
			o(getConfirmation.calls).deepEquals([{this: undefined, args: ["manyRecipients_msg"]}])
		})

	})
})
