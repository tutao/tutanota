import o, { assertThrows, verify } from "@tutao/otest"
// @ts-ignore[untyped-import]
import en from "../../../src/mail-app/translations/en.js"
import type { UserController } from "../../../src/common/api/main/UserController.js"
import type { LoginController } from "../../../src/common/api/main/LoginController.js"
import { isSameId, sysTypeRefs, tutanotaTypeRefs } from "@tutao/typerefs"
import { downcast, isSameTypeRef } from "@tutao/utils"
import { MailMethod } from "../../../src/app-env"
import { lang, TranslationKey } from "../../../src/common/misc/LanguageViewModel.js"
import { EventController } from "../../../src/common/api/main/EventController.js"
import { UserError } from "../../../src/common/api/main/UserError.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { MailFacade } from "../../../src/common/api/worker/facades/lazy/MailFacade.js"
import { func, instance, matchers, object, replace, when } from "testdouble"
import { RecipientsModel } from "../../../src/common/api/main/RecipientsModel"
import { ResolvableRecipientMock } from "./ResolvableRecipientMock.js"
import { createTestEntity } from "../TestUtils.js"
import { ContactModel } from "../../../src/common/contactsFunctionality/ContactModel.js"
import { MailboxDetail, MailboxModel } from "../../../src/common/mailFunctionality/MailboxModel.js"
import { SendMailModel, TOO_MANY_VISIBLE_RECIPIENTS } from "../../../src/common/mailFunctionality/SendMailModel.js"
import { RecipientField } from "../../../src/common/mailFunctionality/SharedMailUtils.js"
import { getContactDisplayName } from "../../../src/common/contactsFunctionality/ContactUtils.js"
import { ConfigurationDatabase } from "../../../src/common/api/worker/facades/lazy/ConfigurationDatabase"
import { SyncTracker } from "../../../src/common/api/main/SyncTracker"
import { DateProvider } from "../../../src/common/api/common/DateProvider"
import { ProgrammingError } from "../../../src/common/api/common/error/ProgrammingError"
import { noPatchesAndInstance } from "../api/worker/EventBusClientTest"
import { ConversationType, GroupType, OperationType } from "../../../src/app-env"

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

o.spec("SendMailModel", () => {
	o.before(() => {
		// we need lang initialized because the SendMailModel constructor requires some translation
		lang.init(en)
	})

	let mailboxModel: MailboxModel, entity: EntityClient, mailFacade: MailFacade, recipientsModel: RecipientsModel

	let model: SendMailModel
	let userController: UserController
	let db: ConfigurationDatabase
	let syncTracker: SyncTracker
	let now: number

	o.beforeEach(() => {
		now = 0
		entity = instance(EntityClient)
		when(
			entity.loadRoot(
				argThat((typeRef) => isSameTypeRef(typeRef, tutanotaTypeRefs.ContactListTypeRef)),
				anything(),
			),
		).thenDo(() => ({ contacts: testIdGenerator.newId() }))
		when(entity.load(anything(), anything(), anything())).thenDo((typeRef, id, params) => ({
			_type: typeRef,
			_id: id,
		}))

		mailboxModel = instance(MailboxModel)

		const contactModel = object<ContactModel>()
		when(contactModel.getContactListId()).thenResolve("contactListId")
		when(contactModel.searchForContact(anything())).thenResolve(null)

		mailFacade = instance(MailFacade)
		when(mailFacade.createDraft(anything())).thenDo(() => createTestEntity(tutanotaTypeRefs.MailTypeRef))
		when(mailFacade.updateDraft(anything())).thenDo(() => createTestEntity(tutanotaTypeRefs.MailTypeRef))
		when(mailFacade.getRecipientKeyData(anything())).thenResolve(null)
		when(mailFacade.getAttachmentIds(anything())).thenResolve([])
		when(mailFacade.sendDraft(anything(), anything(), anything(), anything(), anything())).thenResolve(
			createTestEntity(tutanotaTypeRefs.SendDraftReturnTypeRef),
		)

		const tutanotaProperties = createTestEntity(tutanotaTypeRefs.TutanotaPropertiesTypeRef, {
			defaultSender: DEFAULT_SENDER_FOR_TESTING,
			defaultUnconfidential: true,
			notificationMailLanguage: "en",
			noAutomaticContacts: false,
		})
		const user = createTestEntity(sysTypeRefs.UserTypeRef, {
			userGroup: createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
				_id: testIdGenerator.newId(),
				group: testIdGenerator.newId(),
			}),
			memberships: [
				createTestEntity(sysTypeRefs.GroupMembershipTypeRef, {
					_id: testIdGenerator.newId(),
					groupType: GroupType.Contact,
				}),
			],
		})

		userController = object<UserController>()
		replace(userController, "user", user)
		replace(userController, "props", tutanotaProperties)
		when(userController.reloadCustomer()).thenResolve(createTestEntity(sysTypeRefs.CustomerTypeRef))

		const loginController = object<LoginController>()
		when(loginController.isInternalUserLoggedIn()).thenReturn(true)
		when(loginController.getUserController()).thenReturn(userController)

		const eventController = instance(EventController)

		const mailboxDetails: MailboxDetail = {
			mailbox: createTestEntity(tutanotaTypeRefs.MailBoxTypeRef),
			mailGroupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {
				mailAddress: "mailgroup@addre.ss",
			}),
			mailGroup: createTestEntity(sysTypeRefs.GroupTypeRef),
			mailboxGroupRoot: createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef),
		}

		recipientsModel = instance(RecipientsModel)
		when(recipientsModel.initialize(anything())).thenDo((recipient) => {
			return new ResolvableRecipientMock(recipient.address, recipient.name, recipient.contact, recipient.type, [INTERNAL_RECIPIENT_1.address], [], user)
		})

		db = object()
		syncTracker = object()

		const dateProvider: DateProvider = {
			now(): number {
				return now
			},
			timeZone(): string {
				throw new ProgrammingError("timeZone was called when it shouldn't have")
			},
		}

		const mailboxProperties = createTestEntity(tutanotaTypeRefs.MailboxPropertiesTypeRef)
		model = new SendMailModel(
			mailFacade,
			entity,
			loginController,
			mailboxModel,
			contactModel,
			eventController,
			mailboxDetails,
			recipientsModel,
			dateProvider,
			mailboxProperties,
			db,

			async (mail: tutanotaTypeRefs.Mail) => {
				return false
			},
			syncTracker,
			object(),
		)

		replace(model, "getDefaultSender", () => DEFAULT_SENDER_FOR_TESTING)
	})

	o.spec("initialization", () => {
		o.test("initWithTemplate empty", async () => {
			await model.initWithTemplate({}, "", "", [], false)
			o.check(model.getConversationType()).equals(ConversationType.NEW)
			o.check(model.getSubject()).equals("")
			o.check(model.getBody()).equals("")
			o.check(model.getDraft()).equals(null)
			o.check(model.allRecipients().length).equals(0)
			o.check(model.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o.check(model.isConfidential()).equals(true)
			o.check(model.containsExternalRecipients()).equals(false)
			o.check(model.getAttachments().length).equals(0)
			o.check(model.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
		o.test("initWithTemplate data", async () => {
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
			o.check(initializedModel.getConversationType()).equals(ConversationType.NEW)
			o.check(initializedModel.getSubject()).equals(SUBJECT_LINE_1)
			o.check(initializedModel.getBody()).equals(BODY_TEXT_1)
			o.check(initializedModel.getDraft()).equals(null)
			o.check(initializedModel.allRecipients().length).equals(1)
			o.check(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o.check(model.isConfidential()).equals(true)
			o.check(model.containsExternalRecipients()).equals(false)
			o.check(initializedModel.getAttachments().length).equals(0)
			o.check(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
		o.test("initWithTemplate duplicated recipients", async () => {
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
			o.check(initializedModel.getConversationType()).equals(ConversationType.NEW)
			o.check(initializedModel.getSubject()).equals(SUBJECT_LINE_1)
			o.check(initializedModel.getBody()).equals(BODY_TEXT_1)
			o.check(initializedModel.getDraft()).equals(null)
			o.check(initializedModel.allRecipients().length).equals(1)
			o.check(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o.check(model.isConfidential()).equals(true)
			o.check(model.containsExternalRecipients()).equals(false)
			o.check(initializedModel.getAttachments().length).equals(0)
			o.check(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
		o.test("initWithDraft with blank data", async () => {
			const conversationEntryId = testIdGenerator.newIdTuple()
			const draft = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
				confidential: false,
				sender: createTestEntity(tutanotaTypeRefs.MailAddressTypeRef),
				subject: "",
				conversationEntry: conversationEntryId,
			})
			const draftDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				recipients: createTestEntity(tutanotaTypeRefs.RecipientsTypeRef),
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, {
					text: BODY_TEXT_1,
				}),
			})
			const conversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
				_id: conversationEntryId,
				mail: draft._id,
				conversationType: ConversationType.REPLY,
			})

			const initializedModel = await model.initWithDraft(draft, draftDetails, conversationEntry, [], new Map())
			o.check(initializedModel.getConversationType()).equals(ConversationType.REPLY)
			o.check(initializedModel.getSubject()).equals(draft.subject)
			o.check(initializedModel.getBody()).equals(BODY_TEXT_1)
			o.check(initializedModel.getDraft()).equals(draft)
			o.check(initializedModel.allRecipients().length).equals(0)
			o.check(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o.check(model.isConfidential()).equals(true)
			o.check(model.containsExternalRecipients()).equals(false)
			o.check(initializedModel.getAttachments().length).equals(0)
			o.check(initializedModel.hasMailChanged()).equals(false)("initialization should not flag mail changed")
		})
		o.test("initWithDraft with some data", async () => {
			const conversationEntryId = testIdGenerator.newIdTuple()
			const draft = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
				confidential: true,
				sender: createTestEntity(tutanotaTypeRefs.MailAddressTypeRef),
				subject: SUBJECT_LINE_1,
				conversationEntry: conversationEntryId,
			})
			const conversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
				_id: conversationEntryId,
				mail: draft._id,
				conversationType: ConversationType.FORWARD,
			})
			const recipients = createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
				toRecipients: [
					createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
						address: "",
					}),
					createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
						address: EXTERNAL_ADDRESS_1,
					}),
				],
				ccRecipients: [
					createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
						address: EXTERNAL_ADDRESS_2,
					}),
				],
			})
			const draftDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				recipients,
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { text: BODY_TEXT_1 }),
			})

			const initializedModel = await model.initWithDraft(draft, draftDetails, conversationEntry, [], new Map())
			o.check(initializedModel.getConversationType()).equals(ConversationType.FORWARD)
			o.check(initializedModel.getSubject()).equals(draft.subject)
			o.check(initializedModel.getBody()).equals(BODY_TEXT_1)
			o.check(initializedModel.getDraft()).equals(draft)
			o.check(initializedModel.allRecipients().length).equals(2)("Only MailAddresses with a valid address will be accepted as recipients")
			o.check(initializedModel.toRecipients().length).equals(1)
			o.check(initializedModel.ccRecipients().length).equals(1)
			o.check(initializedModel.bccRecipients().length).equals(0)
			o.check(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
			o.check(model.isConfidential()).equals(true)
			o.check(model.containsExternalRecipients()).equals(true)
			o.check(initializedModel.getAttachments().length).equals(0)
		})
		o.test("initWithDraft with shared mailbox mailAddress as sender", async () => {
			const conversationEntryId = testIdGenerator.newIdTuple()
			const draft = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
				sender: createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "shared-mailbox@addre.ss",
				}),
				subject: SUBJECT_LINE_1,
				conversationEntry: conversationEntryId,
			})
			const conversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
				_id: conversationEntryId,
				mail: draft._id,
				conversationType: ConversationType.NEW,
			})
			const recipients = createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
				toRecipients: [createTestEntity(tutanotaTypeRefs.MailAddressTypeRef)],
			})
			const draftDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				recipients,
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { text: BODY_TEXT_1 }),
			})

			const mailboxDetails: MailboxDetail = {
				mailbox: createTestEntity(tutanotaTypeRefs.MailBoxTypeRef),
				mailGroupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {
					mailAddress: "shared-mailbox@addre.ss",
				}),
				mailGroup: createTestEntity(sysTypeRefs.GroupTypeRef),
				mailboxGroupRoot: createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef),
			}
			replace(model, "mailboxDetails", mailboxDetails)

			const initializedModel = await model.initWithDraft(draft, draftDetails, conversationEntry, [], new Map())
			o.check(initializedModel.getSender()).equals("shared-mailbox@addre.ss")
		})
		o.test("initWithDraft with user's primary alias as sender", async () => {
			const conversationEntryId = testIdGenerator.newIdTuple()
			const draft = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
				sender: createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "primary-alias@tutanota.de",
				}),
				subject: SUBJECT_LINE_1,
				conversationEntry: conversationEntryId,
			})
			const conversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
				_id: conversationEntryId,
				mail: draft._id,
				conversationType: ConversationType.NEW,
			})
			const recipients = createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
				toRecipients: [createTestEntity(tutanotaTypeRefs.MailAddressTypeRef)],
			})
			const draftDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				recipients,
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { text: BODY_TEXT_1 }),
			})

			const mailboxDetails: MailboxDetail = {
				mailbox: createTestEntity(tutanotaTypeRefs.MailBoxTypeRef),
				mailGroupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {
					mailAddress: "primary-alias@tutanota.de",
				}),
				mailGroup: createTestEntity(sysTypeRefs.GroupTypeRef, {
					user: "user-id",
				}),
				mailboxGroupRoot: createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef),
			}
			replace(model, "mailboxDetails", mailboxDetails)
			replace(userController, "userGroupInfo", mailboxDetails.mailGroupInfo)

			const initializedModel = await model.initWithDraft(draft, draftDetails, conversationEntry, [], new Map())
			o.check(initializedModel.getSender()).equals("primary-alias@tutanota.de")
		})
		o.test("initWithDraft with enabled alias as sender", async () => {
			const conversationEntryId = testIdGenerator.newIdTuple()
			const draft = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
				sender: createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "enabled-alias@tutanota.de",
				}),
				subject: SUBJECT_LINE_1,
				conversationEntry: conversationEntryId,
			})
			const conversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
				_id: conversationEntryId,
				mail: draft._id,
				conversationType: ConversationType.NEW,
			})
			const recipients = createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
				toRecipients: [createTestEntity(tutanotaTypeRefs.MailAddressTypeRef)],
			})
			const draftDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				recipients,
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { text: BODY_TEXT_1 }),
			})

			const mailboxDetails: MailboxDetail = {
				mailbox: createTestEntity(tutanotaTypeRefs.MailBoxTypeRef),
				mailGroupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {
					mailAddress: "primary-alias@tutanota.de",
					mailAddressAliases: [
						createTestEntity(sysTypeRefs.MailAddressAliasTypeRef, {
							mailAddress: "enabled-alias@tutanota.de",
							enabled: true,
						}),
					],
				}),
				mailGroup: createTestEntity(sysTypeRefs.GroupTypeRef, {
					user: "user-id",
				}),
				mailboxGroupRoot: createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef),
			}
			replace(model, "mailboxDetails", mailboxDetails)
			replace(userController, "userGroupInfo", mailboxDetails.mailGroupInfo)

			const initializedModel = await model.initWithDraft(draft, draftDetails, conversationEntry, [], new Map())
			o.check(initializedModel.getSender()).equals("enabled-alias@tutanota.de")
		})
		o.test("initWithDraft with deactivated alias as sender", async () => {
			const conversationEntryId = testIdGenerator.newIdTuple()
			const draft = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
				sender: createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "deactivated-alias@tutanota.de",
				}),
				subject: SUBJECT_LINE_1,
				conversationEntry: conversationEntryId,
			})
			const conversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
				_id: conversationEntryId,
				mail: draft._id,
				conversationType: ConversationType.NEW,
			})
			const recipients = createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
				toRecipients: [createTestEntity(tutanotaTypeRefs.MailAddressTypeRef)],
			})
			const draftDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				recipients,
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { text: BODY_TEXT_1 }),
			})

			const mailboxDetails: MailboxDetail = {
				mailbox: createTestEntity(tutanotaTypeRefs.MailBoxTypeRef),
				mailGroupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef, {
					mailAddressAliases: [
						createTestEntity(sysTypeRefs.MailAddressAliasTypeRef, {
							mailAddress: "deactivated-alias@tutanota.de",
							enabled: false,
						}),
					],
				}),
				mailGroup: createTestEntity(sysTypeRefs.GroupTypeRef, {
					user: "user-id",
				}),
				mailboxGroupRoot: createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef),
			}
			replace(model, "mailboxDetails", mailboxDetails)
			replace(userController, "userGroupInfo", mailboxDetails.mailGroupInfo)

			const initializedModel = await model.initWithDraft(draft, draftDetails, conversationEntry, [], new Map())
			o.check(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
		})
		o.test("initWithDraft with deleted custom domain alias as sender", async () => {
			const conversationEntryId = testIdGenerator.newIdTuple()
			const draft = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
				sender: createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
					address: "deleted-alias@custom.domain",
				}),
				subject: SUBJECT_LINE_1,
				conversationEntry: conversationEntryId,
			})
			const conversationEntry = createTestEntity(tutanotaTypeRefs.ConversationEntryTypeRef, {
				_id: conversationEntryId,
				mail: draft._id,
				conversationType: ConversationType.NEW,
			})
			const recipients = createTestEntity(tutanotaTypeRefs.RecipientsTypeRef, {
				toRecipients: [createTestEntity(tutanotaTypeRefs.MailAddressTypeRef)],
			})
			const draftDetails = createTestEntity(tutanotaTypeRefs.MailDetailsTypeRef, {
				recipients,
				body: createTestEntity(tutanotaTypeRefs.BodyTypeRef, { text: BODY_TEXT_1 }),
			})

			const mailboxDetails: MailboxDetail = {
				mailbox: createTestEntity(tutanotaTypeRefs.MailBoxTypeRef),
				mailGroupInfo: createTestEntity(sysTypeRefs.GroupInfoTypeRef),
				mailGroup: createTestEntity(sysTypeRefs.GroupTypeRef, {
					user: "user-id",
				}),
				mailboxGroupRoot: createTestEntity(tutanotaTypeRefs.MailboxGroupRootTypeRef),
			}
			replace(model, "mailboxDetails", mailboxDetails)
			replace(userController, "userGroupInfo", mailboxDetails.mailGroupInfo)

			const initializedModel = await model.initWithDraft(draft, draftDetails, conversationEntry, [], new Map())
			o.check(initializedModel.getSender()).equals(DEFAULT_SENDER_FOR_TESTING)
		})
	})

	o.spec("Adding and removing recipients", () => {
		o.beforeEach(async () => {
			await model.initWithTemplate({}, "", "", [], false, "")
		})

		o.test("adding duplicate to-recipient", async () => {
			const recipient = {
				name: "sanchez",
				address: "123@test.com",
				contact: null,
				type: null,
			}
			model.addRecipient(RecipientField.TO, recipient)
			const r1 = model.getRecipient(RecipientField.TO, recipient.address)!

			model.addRecipient(RecipientField.TO, recipient)

			verify(recipientsModel.initialize(recipient), { times: 1 })

			o.check(model.toRecipients().length).equals(1)
			o.check(model.ccRecipients().length).equals(0)
			o.check(model.bccRecipients().length).equals(0)
		})
		o.test("add different to-recipients", async () => {
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
			model.addRecipient(RecipientField.TO, pablo)
			model.addRecipient(RecipientField.TO, cortez)

			verify(recipientsModel.initialize(pablo))
			verify(recipientsModel.initialize(cortez))

			o.check(model.toRecipients().length).equals(2)
			o.check(model.ccRecipients().length).equals(0)
			o.check(model.bccRecipients().length).equals(0)
		})
		o.test("add duplicate recipients to different fields", async () => {
			const recipient = {
				name: "sanchez",
				address: "123@test.com",
				contact: null,
				type: null,
			}
			model.addRecipient(RecipientField.TO, recipient)
			model.addRecipient(RecipientField.CC, recipient)

			verify(recipientsModel.initialize(recipient), { times: 2 })

			o.check(model.toRecipients().length).equals(1)
			o.check(model.ccRecipients().length).equals(1)
			o.check(model.bccRecipients().length).equals(0)
		})
	})
	o.spec("Sending", () => {
		o.test("completely blank email", async () => {
			const method = MailMethod.NONE
			const getConfirmation = func<() => Promise<boolean>>()
			const e = await assertThrows(UserError, () => model.send(method, getConfirmation))
			o.check(e?.message).equals(lang.get("noRecipients_msg"))
			verify(getConfirmation(), { times: 0 })
			verify(mailFacade.sendDraft(anything(), anything(), anything(), anything(), false), { times: 0 })
			verify(mailFacade.createDraft(anything()), { times: 0 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })
		})
		o.test("blank subject no confirm", async () => {
			model.addRecipient(RecipientField.TO, {
				name: "test",
				address: "test@address.com",
				contact: null,
			})

			const method = MailMethod.NONE
			const getConfirmation = func<() => Promise<boolean>>()
			const r = await model.send(method, getConfirmation)
			o.check(r.success).equals(false)
			verify(getConfirmation(), { times: 0 })
			verify(mailFacade.sendDraft(anything(), anything(), anything(), anything(), false), { times: 0 })
			verify(mailFacade.createDraft(anything()), { times: 0 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })
		})
		o.test("confidential missing password", async () => {
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
			o.check(e?.message).equals(lang.get("noPreSharedPassword_msg"))

			verify(mailFacade.sendDraft(anything(), anything(), anything(), anything(), false), { times: 0 })
			verify(mailFacade.createDraft(anything()), { times: 0 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })
		})
		o.test("confidential weak password no confirm", async () => {
			const recipient = {
				name: "test",
				address: "test@address.com",
				contact: null,
			}
			await model.initWithTemplate({ to: [recipient] }, "subject", "", [], true, "me@tuta.com", false)
			model.setPassword("test@address.com", "abc")
			o.check(model.getPassword(recipient.address)).equals("abc")
			const method = MailMethod.NONE

			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation(anything())).thenResolve(false)
			const r = await model.send(method, getConfirmation)
			o.check(r.success).equals(false)
			verify(mailFacade.sendDraft(anything(), anything(), anything(), anything(), false), { times: 0 })
			verify(mailFacade.createDraft(anything()), { times: 0 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })
		})
		o.test("confidential weak password confirm", async () => {
			const recipient = {
				name: "test",
				address: "test@address.com",
				contact: null,
			}
			await model.initWithTemplate({ to: [recipient] }, "did you get that thing i sent ya?", "", [], true, "me@tutanota.de", false)
			const password = WEAK_PASSWORD
			model.setPassword("test@address.com", password)
			o.check(model.getPassword(recipient.address)).equals(password)
			const method = MailMethod.NONE
			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()
			when(getConfirmation(anything())).thenResolve(true)

			const r = await model.send(method, getConfirmation)
			o.check(r.success).equals(true)

			verify(mailFacade.sendDraft(anything(), anything(), anything(), anything(), false), { times: 1 })
			verify(mailFacade.createDraft(anything()), { times: 1 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })

			const contact = model.getRecipientList(RecipientField.TO)[0].contact!
			o.check(contact.presharedPassword).equals(password)
		})

		o.test("correct password will be returned from getPassword after calling setPassword", () => {
			model.setPassword("address1", "password1")
			model.setPassword("address2", "password2")

			o.check(model.getPassword("address2")).equals("password2")
			o.check(model.getPassword("address1")).equals("password1")
		})

		o.test("confidential strong password", async () => {
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
			o.check(r.success).equals(true)

			verify(getConfirmation(anything), { times: 0 })

			verify(mailFacade.sendDraft(anything(), anything(), anything(), anything(), false), { times: 1 })
			verify(mailFacade.createDraft(anything()), { times: 1 })
			verify(mailFacade.updateDraft(anything()), { times: 0 })

			const contact = model.getRecipientList(RecipientField.TO)[0].contact!
			o.check(contact.presharedPassword).equals(password)
		})

		o.test("when a recipient has an existing contact, and the saved password changes, then the contact will be updated", async () => {
			const getConfirmation = func<(TranslationKey) => Promise<boolean>>()

			const contact = createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
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

	o.spec("Entity Event Updates", () => {
		let existingContact
		let recipients
		o.before(() => {
			existingContact = createTestEntity(tutanotaTypeRefs.ContactTypeRef, {
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

		o.test("nonmatching event", async () => {
			await model.handleEntityEvent({
				typeRef: sysTypeRefs.UserTypeRef,
				operation: OperationType.CREATE,
				instanceListId: null,
				instanceId: "",
				...noPatchesAndInstance,
			})
			await model.handleEntityEvent({
				typeRef: sysTypeRefs.CustomerTypeRef,
				operation: OperationType.CREATE,
				instanceListId: null,
				instanceId: "",
				...noPatchesAndInstance,
			})
			await model.handleEntityEvent({
				typeRef: tutanotaTypeRefs.NotificationMailTypeRef,
				operation: OperationType.CREATE,
				instanceListId: null,
				instanceId: "",
				...noPatchesAndInstance,
			})
			await model.handleEntityEvent({
				typeRef: sysTypeRefs.ChallengeTypeRef,
				operation: OperationType.CREATE,
				instanceListId: null,
				instanceId: "",
				...noPatchesAndInstance,
			})
			await model.handleEntityEvent({
				typeRef: tutanotaTypeRefs.MailTypeRef,
				operation: OperationType.CREATE,
				instanceListId: "mail-list-id",
				instanceId: "",
				...noPatchesAndInstance,
			})
			verify(entity.load(anything(), anything(), anything()), { times: 0 })
		})

		o.test("contact updated email kept", async () => {
			const [instanceListId, instanceId] = existingContact._id
			const contactForUpdate = {
				firstName: "newfirstname",
				lastName: "newlastname",
				mailAddresses: [
					createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
						address: "james@tuta.com",
					}),
					createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
						address: "address2@hotmail.com",
					}),
				],
			}
			when(
				entity.load(
					tutanotaTypeRefs.ContactTypeRef,
					argThat((id) => isSameId(id, existingContact._id)),
				),
			).thenResolve(tutanotaTypeRefs.createContact(Object.assign({ _id: existingContact._id } as tutanotaTypeRefs.Contact, contactForUpdate)))
			await model.initWithTemplate({ to: recipients }, "somb", "", [], true, "a@b.c", false)
			await model.handleEntityEvent({
				typeRef: tutanotaTypeRefs.ContactTypeRef,
				operation: OperationType.UPDATE,
				instanceListId,
				instanceId,
				...noPatchesAndInstance,
			})
			o.check(model.allRecipients().length).equals(2)
			const updatedRecipient = model.allRecipients().find((r) => r.contact && isSameId(r.contact._id, existingContact._id))
			o.check(updatedRecipient && updatedRecipient.name).equals(getContactDisplayName(downcast(contactForUpdate)))
		})
		o.test("contact updated email removed or changed", async () => {
			const [instanceListId, instanceId] = existingContact._id
			const contactForUpdate = {
				firstName: "james",
				lastName: "hetfield",
				mailAddresses: [
					createTestEntity(tutanotaTypeRefs.MailAddressTypeRef, {
						address: "nolongerjames@hotmail.com",
					}),
				],
			}

			when(entity.load(tutanotaTypeRefs.ContactTypeRef, existingContact._id)).thenResolve(
				tutanotaTypeRefs.createContact(
					Object.assign(
						{
							_id: existingContact._id,
						} as tutanotaTypeRefs.Contact,
						contactForUpdate,
					),
				),
			)
			await model.initWithTemplate({ to: recipients }, "b", "c", [], true, "", false)
			await model.handleEntityEvent({
				typeRef: tutanotaTypeRefs.ContactTypeRef,
				operation: OperationType.UPDATE,
				instanceListId,
				instanceId,
				...noPatchesAndInstance,
			})
			o.check(model.allRecipients().length).equals(1)
			const updatedContact = model.allRecipients().find((r) => r.contact && isSameId(r.contact._id, existingContact._id))
			o.check(updatedContact ?? null).equals(null)
		})
		o.test("contact removed", async () => {
			const [instanceListId, instanceId] = existingContact._id
			await model.initWithTemplate({ to: recipients }, "subj", "", [], true, "a@b.c", false)
			await model.handleEntityEvent({
				typeRef: tutanotaTypeRefs.ContactTypeRef,
				operation: OperationType.DELETE,
				instanceListId,
				instanceId,
				...noPatchesAndInstance,
			})
			o.check(model.allRecipients().length).equals(1)
			const updatedContact = model.allRecipients().find((r) => r.contact && isSameId(r.contact._id, existingContact._id))
			o.check(updatedContact == null).equals(true)
		})
		o.test("too many to recipients dont confirm", async () => {
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
			o.check(hasBeenSent.success).equals(false)("nothing was sent")
			verify(getConfirmation("manyRecipients_msg"), { times: 1 })
		})
		o.test("too many to recipients confirm", async () => {
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

			o.check((await model.send(MailMethod.NONE, getConfirmation)).success).equals(true)
			verify(getConfirmation("manyRecipients_msg"), { times: 1 })
		})
		o.test("too many cc recipients dont confirm", async () => {
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
			o.check((await model.send(MailMethod.NONE, getConfirmation)).success).equals(false)
			verify(getConfirmation("manyRecipients_msg"), { times: 1 })
		})
		o.test("too many cc recipients confirm", async () => {
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
			o.check((await model.send(MailMethod.NONE, getConfirmation)).success).equals(true)
			verify(getConfirmation("manyRecipients_msg"), { times: 1 })
		})
		o.spec("mail draft update", () => {
			const draftListId = "some draft list id"
			const draftElementId = "some draft element id"

			o.beforeEach(() => {
				model.draft = createTestEntity(tutanotaTypeRefs.MailTypeRef, {
					mailDetailsDraft: [draftListId, draftElementId],
				})
			})

			o.spec("non matching", () => {
				o.test("different id", async () => {
					model._draftSavedRecently = false
					model.setMailSavedAt(1000)
					model.setMailRemotelyUpdatedAt(1000)
					now = 1234

					await model.handleEntityEvent({
						typeRef: tutanotaTypeRefs.MailDetailsDraftTypeRef,
						operation: OperationType.UPDATE,
						instanceListId: draftListId,
						instanceId: `not ${draftElementId}`,
						...noPatchesAndInstance,
					})

					o.check(model.getMailRemotelyUpdatedAt()).equals(1000)
					o.check(model.hasDraftDataChangedOnServer()).equals(false)

					verify(db.setAutosavedDraftData(matchers.anything()), { times: 0 })
				})
				o.test("no draft", async () => {
					model.draft = null
					model._draftSavedRecently = false
					model.setMailSavedAt(0)
					model.setMailRemotelyUpdatedAt(0)
					now = 1234

					await model.handleEntityEvent({
						typeRef: tutanotaTypeRefs.MailDetailsDraftTypeRef,
						operation: OperationType.UPDATE,
						instanceListId: draftListId,
						instanceId: draftElementId,
						...noPatchesAndInstance,
					})

					o.check(model.getMailRemotelyUpdatedAt()).equals(0)
					o.check(model.hasDraftDataChangedOnServer()).equals(false)

					verify(db.setAutosavedDraftData(matchers.anything()), { times: 0 })
				})
			})

			o.test("matching, recently saved", async () => {
				model._draftSavedRecently = true
				model.setMailSavedAt(1000)
				model.setMailRemotelyUpdatedAt(1000)
				now = 1234
				await model.handleEntityEvent({
					typeRef: tutanotaTypeRefs.MailDetailsDraftTypeRef,
					operation: OperationType.UPDATE,
					instanceListId: draftListId,
					instanceId: draftElementId,
					...noPatchesAndInstance,
				})
				o.check(model._draftSavedRecently).equals(false)
				o.check(model.getMailRemotelyUpdatedAt()).equals(1000)
				o.check(model.hasDraftDataChangedOnServer()).equals(false)

				verify(db.setAutosavedDraftData(matchers.anything()), { times: 0 })
			})

			o.test("matching, not recently saved", async () => {
				model._draftSavedRecently = false
				model.setMailSavedAt(1000)
				model.setMailRemotelyUpdatedAt(1000)
				model.setBody("we changed the body")
				now = 1234
				await model.handleEntityEvent({
					typeRef: tutanotaTypeRefs.MailDetailsDraftTypeRef,
					operation: OperationType.UPDATE,
					instanceListId: draftListId,
					instanceId: draftElementId,
					...noPatchesAndInstance,
				})
				o.check(model.getMailRemotelyUpdatedAt()).equals(1234)
				o.check(model.hasDraftDataChangedOnServer()).equals(true)

				verify(db.setAutosavedDraftData(matchers.anything()), { times: 1 })
			})
		})
	})
})
