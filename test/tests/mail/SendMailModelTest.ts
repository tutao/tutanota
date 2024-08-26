import o from "@tutao/otest"
// @ts-ignore[untyped-import]
import en from "../../../src/mail-app/translations/en.js"
import type { UserController } from "../../../src/common/api/main/UserController.js"
import type { LoginController } from "../../../src/common/api/main/LoginController.js"
import {
	BodyTypeRef,
	Contact,
	ContactListTypeRef,
	ContactTypeRef,
	ConversationEntryTypeRef,
	createContact,
	CustomerAccountCreateDataTypeRef,
	Mail,
	MailAddressTypeRef,
	MailboxGroupRootTypeRef,
	MailboxPropertiesTypeRef,
	MailBoxTypeRef,
	MailDetailsTypeRef,
	MailTypeRef,
	NotificationMailTypeRef,
	RecipientsTypeRef,
	TutanotaPropertiesTypeRef,
} from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { assertThrows, verify } from "@tutao/tutanota-test-utils"
import { downcast, isSameTypeRef } from "@tutao/tutanota-utils"
import {
	ChallengeTypeRef,
	CustomerTypeRef,
	GroupInfoTypeRef,
	GroupMembershipTypeRef,
	GroupTypeRef,
	UserTypeRef,
} from "../../../src/common/api/entities/sys/TypeRefs.js"
import { ConversationType, GroupType, MailMethod, OperationType } from "../../../src/common/api/common/TutanotaConstants.js"
import { lang, TranslationKey } from "../../../src/common/misc/LanguageViewModel.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { UserError } from "../../../src/common/api/main/UserError.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { isSameId } from "../../../src/common/api/common/utils/EntityUtils.js"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { func, instance, matchers, object, replace, when } from "testdouble"
import { RecipientsModel, ResolveMode } from "../../../src/common/api/main/RecipientsModel"
import { ResolvableRecipientMock } from "./ResolvableRecipientMock.js"
import { NoZoneDateProvider } from "../../../src/common/api/common/utils/NoZoneDateProvider.js"
import { createTestEntity } from "../TestUtils.js"
import { ContactModel } from "../../../src/common/contactsFunctionality/ContactModel.js"
import { MailboxDetail, MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { SendMailModel, TOO_MANY_VISIBLE_RECIPIENTS } from "../../../src/common/mailFunctionality/SendMailModel.js"
import { RecipientField } from "../../../src/common/mailFunctionality/SharedMailUtils.js"
import { getContactDisplayName } from "../../../src/common/contactsFunctionality/ContactUtils.js"
import { FolderSystem } from "../../../src/common/api/common/mail/FolderSystem.js"

const { anything, argThat } = matchers

type TestIdGenerator = {
	currentIdValue: number
	currentListIdValue: number
	newId: () => Id
	newListId: () => Id
	newIdTuple: () => IdTuple
}
let testIdGenerator: TestIdGenerator = {
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

	let mailboxModel: MailboxModel, entity: EntityClient, mailFacade: MailFacade, recipientsModel: RecipientsModel

	let model: SendMailModel

	o.beforeEach(function () {
		entity = instance(EntityClient)
		when(
			entity.loadRoot(
				argThat((typeRef) => isSameTypeRef(typeRef, ContactListTypeRef)),
				anything(),
			),
		).thenDo(() => ({ contacts: testIdGenerator.newId() }))
		when(entity.load(anything(), anything(), anything())).thenDo((typeRef, id, params) => ({ _type: typeRef, _id: id }))

		mailboxModel = instance(MailboxModel)

		const contactModel = object<ContactModel>()
		when(contactModel.getContactListId()).thenResolve("contactListId")
		when(contactModel.searchForContact(anything())).thenResolve(null)

		mailFacade = instance(MailFacade)
		when(mailFacade.createDraft(anything())).thenDo(() => createTestEntity(MailTypeRef))
		when(mailFacade.updateDraft(anything())).thenDo(() => createTestEntity(MailTypeRef))
		when(mailFacade.getRecipientKeyData(anything())).thenResolve(null)
		when(mailFacade.getAttachmentIds(anything())).thenResolve([])

		const tutanotaProperties = createTestEntity(TutanotaPropertiesTypeRef, {
			defaultSender: DEFAULT_SENDER_FOR_TESTING,
			defaultUnconfidential: true,
			notificationMailLanguage: "en",
			noAutomaticContacts: false,
		})
		const user = createTestEntity(UserTypeRef, {
			userGroup: createTestEntity(GroupMembershipTypeRef, {
				_id: testIdGenerator.newId(),
				group: testIdGenerator.newId(),
			}),
			memberships: [
				createTestEntity(GroupMembershipTypeRef, {
					_id: testIdGenerator.newId(),
					groupType: GroupType.Contact,
				}),
			],
		})

		const userController = object<UserController>()
		replace(userController, "user", user)
		replace(userController, "props", tutanotaProperties)
		when(userController.loadCustomer()).thenResolve(createTestEntity(CustomerTypeRef))

		const loginController = object<LoginController>()
		when(loginController.isInternalUserLoggedIn()).thenReturn(true)
		when(loginController.getUserController()).thenReturn(userController)

		const eventController = instance(EventController)

		const mailboxDetails: MailboxDetail = {
			mailbox: createTestEntity(MailBoxTypeRef),
			folders: new FolderSystem([]),
			mailGroupInfo: createTestEntity(GroupInfoTypeRef, {
				mailAddress: "mailgroup@addre.ss",
			}),
			mailGroup: createTestEntity(GroupTypeRef),
			mailboxGroupRoot: createTestEntity(MailboxGroupRootTypeRef),
		}

		recipientsModel = instance(RecipientsModel)
		when(recipientsModel.resolve(anything(), anything())).thenDo((recipient, resolveMode) => {
			return new ResolvableRecipientMock(
				recipient.address,
				recipient.name,
				recipient.contact,
				recipient.type,
				[INTERNAL_RECIPIENT_1.address],
				[],
				resolveMode,
				user,
			)
		})

		const mailboxProperties = createTestEntity(MailboxPropertiesTypeRef)
		model = new SendMailModel(
			mailFacade,
			entity,
			loginController,
			mailboxModel,
			contactModel,
			eventController,
			mailboxDetails,
			recipientsModel,
			new NoZoneDateProvider(),
			mailboxProperties,
			async (mail: Mail) => {
				return false
			},
		)

		replace(model, "getDefaultSender", () => DEFAULT_SENDER_FOR_TESTING)
	})

	o.spec("initialization", function () {
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
			const draft = createTestEntity(MailTypeRef, {
				confidential: false,
				sender: createTestEntity(MailAddressTypeRef),
				subject: "",
				conversationEntry: testIdGenerator.newIdTuple(),
			})
			const draftDetails = createTestEntity(MailDetailsTypeRef, {
				recipients: createTestEntity(RecipientsTypeRef),
				body: createTestEntity(BodyTypeRef, {
					text: BODY_TEXT_1,
				}),
			})
			when(entity.load(ConversationEntryTypeRef, draft.conversationEntry)).thenResolve(
				createTestEntity(ConversationEntryTypeRef, { conversationType: ConversationType.REPLY }),
			)
			const initializedModel = await model.initWithDraft(draft, draftDetails, [], new Map())
			o(initializedModel.getConversationType()).equals(ConversationType.REPLY)
			o(initializedModel.getSubject()).equals(draft.subject)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(draft)
			o(initializedModel.allRecipients().length).equals(0)
			o(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(model.isConfidential()).equals(true)
			o(model.containsExternalRecipients()).equals(false)
			o(initializedModel.getAttachments().length).equals(0)
			o(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
		o("initWithDraft with some data", async function () {
			const draft = createTestEntity(MailTypeRef, {
				confidential: true,
				sender: createTestEntity(MailAddressTypeRef),
				subject: SUBJECT_LINE_1,
				conversationEntry: testIdGenerator.newIdTuple(),
			})
			const recipients = createTestEntity(RecipientsTypeRef, {
				toRecipients: [
					createTestEntity(MailAddressTypeRef, {
						address: "",
					}),
					createTestEntity(MailAddressTypeRef, {
						address: EXTERNAL_ADDRESS_1,
					}),
				],
				ccRecipients: [
					createTestEntity(MailAddressTypeRef, {
						address: EXTERNAL_ADDRESS_2,
					}),
				],
			})
			const draftDetails = createTestEntity(MailDetailsTypeRef, {
				recipients,
				body: createTestEntity(BodyTypeRef, { text: BODY_TEXT_1 }),
			})

			when(entity.load(ConversationEntryTypeRef, draft.conversationEntry)).thenResolve(
				createTestEntity(ConversationEntryTypeRef, { conversationType: ConversationType.FORWARD }),
			)

			const initializedModel = await model.initWithDraft(draft, draftDetails, [], new Map())
			o(initializedModel.getConversationType()).equals(ConversationType.FORWARD)
			o(initializedModel.getSubject()).equals(draft.subject)
			o(initializedModel.getBody()).equals(BODY_TEXT_1)
			o(initializedModel.getDraft()).equals(draft)
			o(initializedModel.allRecipients().length).equals(2)("Only MailAddresses with a valid address will be accepted as recipients")
			o(initializedModel.toRecipients().length).equals(1)
			o(initializedModel.ccRecipients().length).equals(1)
			o(initializedModel.bccRecipients().length).equals(0)
			o(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o(model.isConfidential()).equals(true)
			o(model.containsExternalRecipients()).equals(true)
			o(initializedModel.getAttachments().length).equals(0)
		})
	})
	o.spec("Adding and removing recipients", function () {
		o.beforeEach(async function () {
			await model.initWithTemplate({}, "", "", [], false, "")
		})

		o("adding duplicate to-recipient", async function () {
			const recipient = {
				name: "sanchez",
				address: "123@test.com",
				contact: null,
				type: null,
			}
			model.addRecipient(RecipientField.TO, recipient, ResolveMode.Eager)
			const r1 = model.getRecipient(RecipientField.TO, recipient.address)!

			model.addRecipient(RecipientField.TO, recipient, ResolveMode.Eager)

			verify(recipientsModel.resolve(recipient, ResolveMode.Eager), { times: 1 })

			o(model.toRecipients().length).equals(1)
			o(model.ccRecipients().length).equals(0)
			o(model.bccRecipients().length).equals(0)
		})
		o("add different to-recipients", async function () {
			const pablo = {
				name: "pablo",
				address: "pablo94@test.co.uk",
				contact: null,
				type: null,
			}
			const cortez = {
				name: "cortez",
				address: "c.asd@test.net",
				contact: null,
				type: null,
			}
			model.addRecipient(RecipientField.TO, pablo, ResolveMode.Eager)
			model.addRecipient(RecipientField.TO, cortez, ResolveMode.Eager)

			verify(recipientsModel.resolve(pablo, ResolveMode.Eager))
			verify(recipientsModel.resolve(cortez, ResolveMode.Eager))

			o(model.toRecipients().length).equals(2)
			o(model.ccRecipients().length).equals(0)
			o(model.bccRecipients().length).equals(0)
		})
		o("add duplicate recipients to different fields", async function () {
			const recipient = {
				name: "sanchez",
				address: "123@test.com",
				contact: null,
				type: null,
			}
			model.addRecipient(RecipientField.TO, recipient, ResolveMode.Eager)
			model.addRecipient(RecipientField.CC, recipient, ResolveMode.Eager)

			verify(recipientsModel.resolve(recipient, ResolveMode.Eager), { times: 2 })

			o(model.toRecipients().length).equals(1)
			o(model.ccRecipients().length).equals(1)
			o(model.bccRecipients().length).equals(0)
		})
	})
	o.spec("Sending", function () {
		o("completely blank email", async function () {
			const method = MailMethod.NONE
			const getConfirmation = func<() => Promise<boolean>>()
			const e = await assertThrows(UserError, () => model.send(method, getConfirmation))
			o(e?.message).equals(lang.get("noRecipients_msg"))
			verify(getConfirmation(), { times: 0 })
			verify(mailFacade.sendDraft(anything(), anything(), anything()), { times: 0 })
			verify(mailFacade.createDraft(anything()), { times: 0 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })
		})
		o("blank subject no confirm", async function () {
			model.addRecipient(RecipientField.TO, {
				name: "test",
				address: "test@address.com",
				contact: null,
			})

			const method = MailMethod.NONE
			const getConfirmation = func<() => Promise<boolean>>()
			const r = await model.send(method, getConfirmation)
			o(r).equals(false)
			verify(getConfirmation(), { times: 0 })
			verify(mailFacade.sendDraft(anything(), anything(), anything()), { times: 0 })
			verify(mailFacade.createDraft(anything()), { times: 0 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })
		})
		o("confidential missing password", async function () {
			await model.addRecipient(RecipientField.TO, {
				name: "test",
				address: "test@address.com",
				contact: null,
			})
			model.setConfidential(true)
			const method = MailMethod.NONE

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation(anything())).thenResolve(true)

			const e = await assertThrows(UserError, () => model.send(method, getConfirmation))
			o(e?.message).equals(lang.get("noPreSharedPassword_msg"))

			verify(mailFacade.sendDraft(anything(), anything(), anything()), { times: 0 })
			verify(mailFacade.createDraft(anything()), { times: 0 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })
		})
		o("confidential weak password no confirm", async function () {
			const recipient = {
				name: "test",
				address: "test@address.com",
				contact: null,
			}
			await model.initWithTemplate({ to: [recipient] }, "subject", "", [], true, "me@tuta.com", false)
			model.setPassword("test@address.com", "abc")
			o(model.getPassword(recipient.address)).equals("abc")
			const method = MailMethod.NONE

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation(anything())).thenResolve(false)
			const r = await model.send(method, getConfirmation)
			o(r).equals(false)
			verify(mailFacade.sendDraft(anything(), anything(), anything()), { times: 0 })
			verify(mailFacade.createDraft(anything()), { times: 0 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })
		})
		o("confidential weak password confirm", async function () {
			const recipient = {
				name: "test",
				address: "test@address.com",
				contact: null,
			}
			await model.initWithTemplate({ to: [recipient] }, "did you get that thing i sent ya?", "", [], true, "me@tutanota.de", false)
			const password = WEAK_PASSWORD
			model.setPassword("test@address.com", password)
			o(model.getPassword(recipient.address)).equals(password)
			const method = MailMethod.NONE
			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation(anything())).thenResolve(true)

			const r = await model.send(method, getConfirmation)
			o(r).equals(true)

			verify(mailFacade.sendDraft(anything(), anything(), anything()), { times: 1 })
			verify(mailFacade.createDraft(anything()), { times: 1 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })

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
			await model.initWithTemplate({ to: [recipient] }, "subjecttttt", "", [], true, "me@tutanota.de", false)
			const password = STRONG_PASSWORD
			model.setPassword(address, password)
			const method = MailMethod.NONE

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()

			const r = await model.send(method, getConfirmation)
			o(r).equals(true)

			verify(getConfirmation(anything), { times: 0 })

			verify(mailFacade.sendDraft(anything(), anything(), anything()), { times: 1 })
			verify(mailFacade.createDraft(anything()), { times: 1 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })

			const contact = model.getRecipientList(RecipientField.TO)[0].contact!
			o(contact.presharedPassword).equals(password)
		})

		o("when a recipient has an existing contact, and the saved password changes, then the contact will be updated", async function () {
			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()

			const contact = createTestEntity(ContactTypeRef, {
				_id: testIdGenerator.newIdTuple(),
				firstName: "my",
				lastName: "chippie",
				presharedPassword: "weak password",
			})
			await model.initWithTemplate({ to: [] }, "did you get that thing i sent ya?", "no?", [], true, "me@tutanota.de", false)

			await model.addRecipient(RecipientField.TO, {
				name: "chippie",
				address: "chippie@cinco.net",
				contact,
			})

			model.setPassword("chippie@cinco.net", STRONG_PASSWORD)
			await model.send(MailMethod.NONE, getConfirmation)
			verify(entity.update(contact), { times: 1 })
		})
	})

	o.spec("Entity Event Updates", function () {
		let existingContact
		let recipients
		o.before(function () {
			existingContact = createTestEntity(ContactTypeRef, {
				_id: testIdGenerator.newIdTuple(),
				firstName: "james",
				lastName: "hetfield",
			})

			recipients = [
				{
					name: "paul gilbert",
					address: "paul@gmail.com",
					contact: null,
				},
				{
					name: "james hetfield",
					address: "james@tuta.com",
					contact: existingContact,
				},
			]
		})

		o("nonmatching event", async function () {
			await model.handleEntityEvent(downcast(CustomerAccountCreateDataTypeRef))
			await model.handleEntityEvent(downcast(UserTypeRef))
			await model.handleEntityEvent(downcast(CustomerTypeRef))
			await model.handleEntityEvent(downcast(NotificationMailTypeRef))
			await model.handleEntityEvent(downcast(ChallengeTypeRef))
			await model.handleEntityEvent(downcast(MailTypeRef))
			verify(entity.load(anything(), anything(), anything()), { times: 0 })
		})

		o("contact updated email kept", async function () {
			const { app, type } = ContactTypeRef
			const [instanceListId, instanceId] = existingContact._id
			const contactForUpdate = {
				firstName: "newfirstname",
				lastName: "newlastname",
				mailAddresses: [
					createTestEntity(MailAddressTypeRef, {
						address: "james@tuta.com",
					}),
					createTestEntity(MailAddressTypeRef, {
						address: "address2@hotmail.com",
					}),
				],
			}
			when(
				entity.load(
					ContactTypeRef,
					argThat((id) => isSameId(id, existingContact._id)),
				),
			).thenResolve(createContact(Object.assign({ _id: existingContact._id } as Contact, contactForUpdate)))
			await model.initWithTemplate({ to: recipients }, "somb", "", [], true, "a@b.c", false)
			await model.handleEntityEvent({
				application: app,
				type,
				operation: OperationType.UPDATE,
				instanceListId,
				instanceId,
			})
			o(model.allRecipients().length).equals(2)
			const updatedRecipient = model.allRecipients().find((r) => r.contact && isSameId(r.contact._id, existingContact._id))
			o(updatedRecipient && updatedRecipient.name).equals(getContactDisplayName(downcast(contactForUpdate)))
		})
		o("contact updated email removed or changed", async function () {
			const { app, type } = ContactTypeRef
			const [instanceListId, instanceId] = existingContact._id
			const contactForUpdate = {
				firstName: "james",
				lastName: "hetfield",
				mailAddresses: [
					createTestEntity(MailAddressTypeRef, {
						address: "nolongerjames@hotmail.com",
					}),
				],
			}

			when(entity.load(ContactTypeRef, existingContact._id)).thenResolve(
				createContact(
					Object.assign(
						{
							_id: existingContact._id,
						} as Contact,
						contactForUpdate,
					),
				),
			)
			await model.initWithTemplate({ to: recipients }, "b", "c", [], true, "", false)
			await model.handleEntityEvent({
				application: app,
				type,
				operation: OperationType.UPDATE,
				instanceListId,
				instanceId,
			})
			o(model.allRecipients().length).equals(1)
			const updatedContact = model.allRecipients().find((r) => r.contact && isSameId(r.contact._id, existingContact._id))
			o(updatedContact ?? null).equals(null)
		})
		o("contact removed", async function () {
			const { app, type } = ContactTypeRef
			const [instanceListId, instanceId] = existingContact._id
			await model.initWithTemplate({ to: recipients }, "subj", "", [], true, "a@b.c", false)
			await model.handleEntityEvent({
				application: app,
				type,
				operation: OperationType.DELETE,
				instanceListId,
				instanceId,
			})
			o(model.allRecipients().length).equals(1)
			const updatedContact = model.allRecipients().find((r) => r.contact && isSameId(r.contact._id, existingContact._id))
			o(updatedContact == null).equals(true)
		})
		o("too many to recipients dont confirm", async function () {
			const recipients = {
				to: [] as { name: string; address: string }[],
			}

			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.to.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`,
				})
			}

			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = func<(key: TranslationKey) => Promise<boolean>>()
			when(getConfirmation("manyRecipients_msg")).thenResolve(false)

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de", false)
			const hasBeenSent = await model.send(MailMethod.NONE, getConfirmation)
			o(hasBeenSent).equals(false)("nothing was sent")
			verify(getConfirmation("manyRecipients_msg"), { times: 1 })
		})
		o("too many to recipients confirm", async function () {
			const recipients = {
				to: [] as { name: string; address: string }[],
			}

			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.to.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`,
				})
			}

			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = func<(key: TranslationKey) => Promise<boolean>>()
			when(getConfirmation("manyRecipients_msg")).thenResolve(true)

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")

			o(await model.send(MailMethod.NONE, getConfirmation)).equals(true)
			verify(getConfirmation("manyRecipients_msg"), { times: 1 })
		})
		o("too many cc recipients dont confirm", async function () {
			const recipients = {
				cc: [] as { name: string; address: string }[],
			}

			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.cc.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`,
				})
			}

			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = func<(key: TranslationKey) => Promise<boolean>>()
			when(getConfirmation("manyRecipients_msg")).thenResolve(false)

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")
			o(await model.send(MailMethod.NONE, getConfirmation)).equals(false)
			verify(getConfirmation("manyRecipients_msg"), { times: 1 })
		})
		o("too many cc recipients confirm", async function () {
			const recipients = {
				cc: [] as { name: string; address: string }[],
			}

			for (let i = 0; i < TOO_MANY_VISIBLE_RECIPIENTS; ++i) {
				recipients.cc.push({
					name: `person ${i}`,
					address: `person${i}@tutanota.de`,
				})
			}

			const subject = "subyekt"
			const body = "bodie"

			const getConfirmation = func<(key: TranslationKey) => Promise<boolean>>()
			when(getConfirmation("manyRecipients_msg")).thenResolve(true)

			await model.initWithTemplate(recipients, subject, body, [], false, "eggs@tutanota.de")
			o(await model.send(MailMethod.NONE, getConfirmation)).equals(true)
			verify(getConfirmation("manyRecipients_msg"), { times: 1 })
		})
	})
})
