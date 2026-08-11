import o, { verify } from "@tutao/otest"
import {
	ExpandedInboxRule,
	ExpandedInboxRuleTypeRef,
	HeaderTypeRef,
	InboxRuleCondition,
	InboxRuleConditionTypeRef,
	InboxRuleResult,
	InboxRuleResultTypeRef,
	Mail,
	MailAddressTypeRef,
	MailDetails,
	MailDetailsTypeRef,
	MailSet,
	MailSetTypeRef,
	MailTypeRef,
	RecipientsTypeRef,
} from "@tutao/entities/tutanota"
import { InboxRuleConditionType, InboxRuleResultType, MailSetKind } from "../../../../src/entities/tutanota/Utils"
import { createTestEntity } from "../../TestUtils"
import { ExpandedInboxRuleHandler } from "../../../../src/applications/mail-app/mail/model/ExpandedInboxRuleHandler"
import { matchers, object, when } from "testdouble"
import { MailFacade } from "../../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import { LoginController } from "../../../../src/applications/common/api/main/LoginController"
import { MailModel, MoveMode } from "../../../../src/applications/mail-app/mail/model/MailModel"
import { MailboxDetail } from "../../../../src/applications/common/mailFunctionality/MailboxModel"
import { FolderSystem } from "../../../../src/applications/common/api/common/mail/FolderSystem"
import { getElementId } from "../../../../src/platform-kit/meta"
import { UserController } from "../../../../src/applications/common/api/main/UserController"
import { InboxRuleModel } from "../../../../src/applications/mail-app/mail/model/InboxRuleModel"

const { anything } = matchers

o.spec("ExpandedInboxRuleHandler", () => {
	let ruleHandler: ExpandedInboxRuleHandler
	let mailFacade: MailFacade
	let logins: LoginController
	let mailModel: MailModel
	let inboxRuleModel: InboxRuleModel

	o.beforeEach(() => {
		mailFacade = object()
		logins = object()
		mailModel = object<MailModel>()
		inboxRuleModel = object()

		ruleHandler = new ExpandedInboxRuleHandler(mailFacade, logins, mailModel, inboxRuleModel)
	})

	o.test("return null when user has a free account", async () => {
		const inboxFolder = createTestEntity(MailSetTypeRef, {
			_id: ["listId", "inboxFolderId"],
			folderType: MailSetKind.INBOX,
		})
		const mail = _createMailWithDifferentEnvelopeSender({ subject: "test subject", sets: [inboxFolder._id] })
		const userController: UserController = object()
		when(logins.getUserController()).thenReturn(userController)
		when(userController.isPaidAccount()).thenReturn(false)

		const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
		o.check(foundRule).equals(null)
	})

	o.spec("findMatchingInboxRule", () => {
		let userController: UserController
		const inboxFolder = createTestEntity(MailSetTypeRef, {
			_id: ["listId", "inboxFolderId"],
			folderType: MailSetKind.INBOX,
		})

		o.beforeEach(() => {
			userController = object()
			when(logins.getUserController()).thenReturn(userController)
			when(userController.isPaidAccount()).thenReturn(true)
		})

		o.test("return matching rule when there is one", async () => {
			const rule = _createRule([_createRuleCondition(InboxRuleConditionType.SUBJECT_CONTAINS, "test")], [])
			const mail = _createMailWithDifferentEnvelopeSender({ subject: "test subject", sets: [inboxFolder._id] })

			const rules = [
				_createRule([_createRuleCondition(InboxRuleConditionType.FROM_EQUALS, "someone@tuta.com")], []),
				rule,
				_createRule([_createRuleCondition(InboxRuleConditionType.RECIPIENT_CC_EQUALS, "someonecc@tuta.com")], []),
			]

			when(inboxRuleModel.getOrderedInboxRules()).thenResolve(rules)

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})

		o.test("sender is checked for FROM_EQUALS condition and matching rule is found", async () => {
			const rule = _createRule(
				[_createRuleCondition(InboxRuleConditionType.FROM_EQUALS, "sender@tuta.com")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender()
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})

		o.test("differentEnvelopeSender is checked for FROM_EQUALS condition and matching rule is found", async () => {
			const rule = _createRule(
				[_createRuleCondition(InboxRuleConditionType.FROM_EQUALS, "differentenvelopsender@something.com")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender()
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})

		o.test("matching rule for RECIPIENT_TO_EQUALS condition is found", async () => {
			const rule = _createRule(
				[_createRuleCondition(InboxRuleConditionType.RECIPIENT_TO_EQUALS, "to-recipient@tuta.com")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender()
			const mailDetails = _createMailDetails()

			when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})

		o.test("matching rule for RECIPIENT_CC_EQUALS condition is found", async () => {
			const rule = _createRule(
				[_createRuleCondition(InboxRuleConditionType.RECIPIENT_CC_EQUALS, "cc-recipient@tuta.com")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender()
			const mailDetails = _createMailDetails()

			when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})

		o.test("matching rule for RECIPIENT_BCC_EQUALS condition is found", async () => {
			const rule = _createRule(
				[_createRuleCondition(InboxRuleConditionType.RECIPIENT_BCC_EQUALS, "bcc-recipient@tuta.com")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender()
			const mailDetails = _createMailDetails()

			when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})

		o.test("matching rule for SUBJECT_CONTAINS condition is found", async () => {
			const rule = _createRule(
				[_createRuleCondition(InboxRuleConditionType.SUBJECT_CONTAINS, "fri")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender({ subject: "hello friend" })
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})
		o.test("matching rule for SUBJECT_CONTAINS condition is found when value is a RegEx string", async () => {
			const rule = _createRule(
				[_createRuleCondition(InboxRuleConditionType.SUBJECT_CONTAINS, "/end$/")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender({ subject: "hello friend" })
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})

		o.test("matching rule for MAIL_HEADER_CONTAINS condition is found", async () => {
			const rule = _createRule(
				[_createRuleCondition(InboxRuleConditionType.MAIL_HEADER_CONTAINS, "X-Some-ID")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender()
			const mailDetails = _createMailDetails({
				headers: createTestEntity(HeaderTypeRef, {
					headers: "...\nX-Some-ID: 123\n...",
				}),
			})

			when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})
		o.test("no rule is found for MAIL_HEADER_CONTAINS condition and mail without headers", async () => {
			const rule = _createRule(
				[_createRuleCondition(InboxRuleConditionType.MAIL_HEADER_CONTAINS, "X-Some-ID")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender()
			const mailDetails = _createMailDetails()

			when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).equals(null)
		})

		o.spec("findMatchingInboxRule_attachment_conditions", () => {
			const ruleHas = _createRule(
				[_createRuleCondition(InboxRuleConditionType.HAS_ATTACHMENT, "")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)

			const ruleHasNot = _createRule(
				[_createRuleCondition(InboxRuleConditionType.HAS_NO_ATTACHMENT, "")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)

			const mailWithAttachments = _createMailWithDifferentEnvelopeSender({ attachments: [["a", "b"]] })
			const mailWithoutAttachments = _createMailWithDifferentEnvelopeSender({ attachments: [] })

			const mailDetails = _createMailDetails()

			o.test("matching rule for HAS_NO_ATTACHMENT, mail without attachments", async () => {
				when(mailFacade.loadMailDetailsBlob(mailWithoutAttachments)).thenResolve(mailDetails)
				when(inboxRuleModel.getOrderedInboxRules()).thenResolve([ruleHasNot])

				const foundRule = await ruleHandler.findMatchingInboxRule(mailWithoutAttachments, inboxFolder, true)
				o.check(foundRule).equals(ruleHasNot)
			})

			o.test("matching no rule for HAS_NO_ATTACHMENT, mail with one attachment", async () => {
				when(mailFacade.loadMailDetailsBlob(mailWithAttachments)).thenResolve(mailDetails)
				when(inboxRuleModel.getOrderedInboxRules()).thenResolve([ruleHasNot])

				const foundRule = await ruleHandler.findMatchingInboxRule(mailWithAttachments, inboxFolder, true)
				o.check(foundRule).equals(null)
			})

			o.test("matching no rule for HAS_ATTACHMENT, mail without attachments", async () => {
				when(mailFacade.loadMailDetailsBlob(mailWithoutAttachments)).thenResolve(mailDetails)
				when(inboxRuleModel.getOrderedInboxRules()).thenResolve([ruleHas])

				const foundRule = await ruleHandler.findMatchingInboxRule(mailWithoutAttachments, inboxFolder, true)
				o.check(foundRule).equals(null)
			})

			o.test("matching rule for HAS_ATTACHMENT, mail with one attachment", async () => {
				when(mailFacade.loadMailDetailsBlob(mailWithAttachments)).thenResolve(mailDetails)
				when(inboxRuleModel.getOrderedInboxRules()).thenResolve([ruleHas])

				const foundRule = await ruleHandler.findMatchingInboxRule(mailWithAttachments, inboxFolder, true)
				o.check(foundRule).equals(ruleHas)
			})
		})

		o.test("matching rule for multiple conditions is found", async () => {
			const rule = _createRule(
				[
					_createRuleCondition(InboxRuleConditionType.SUBJECT_CONTAINS, "fri"),
					_createRuleCondition(InboxRuleConditionType.RECIPIENT_TO_EQUALS, "to-recipient@tuta.com"),
					_createRuleCondition(InboxRuleConditionType.RECIPIENT_CC_EQUALS, "cc-recipient@tuta.com"),
					_createRuleCondition(InboxRuleConditionType.MAIL_HEADER_CONTAINS, "X-Some-ID"),
				],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender({ subject: "hello friend" })
			const mailDetails = _createMailDetails({
				headers: createTestEntity(HeaderTypeRef, {
					headers: "...\nX-Some-ID: 123\n...",
				}),
			})

			when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(rule)
		})
		o.test("no rule is found for multiple conditions when not all conditions are met", async () => {
			const rule = _createRule(
				[
					_createRuleCondition(InboxRuleConditionType.SUBJECT_CONTAINS, "fri"),
					_createRuleCondition(InboxRuleConditionType.RECIPIENT_TO_EQUALS, "to-recipient@tuta.com"),
					_createRuleCondition(InboxRuleConditionType.RECIPIENT_CC_EQUALS, "non-matching-cc@tuta.com"),
					_createRuleCondition(InboxRuleConditionType.MAIL_HEADER_CONTAINS, "X-Some-ID"),
				],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender({ subject: "hello friend" })
			const mailDetails = _createMailDetails({
				headers: createTestEntity(HeaderTypeRef, {
					headers: "...\nX-Some-ID: 123\n...",
				}),
			})

			when(mailFacade.loadMailDetailsBlob(mail)).thenResolve(mailDetails)
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).deepEquals(null)
		})

		o.test("no rule is found for an unknown condition", async () => {
			const rule = _createRule(
				// @ts-ignore
				[_createRuleCondition("UNKNOWN_CONDITION", "something")],
				[_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])],
			)
			const mail = _createMailWithDifferentEnvelopeSender()
			when(inboxRuleModel.getOrderedInboxRules()).thenResolve([rule])

			const foundRule = await ruleHandler.findMatchingInboxRule(mail, inboxFolder, true)
			o.check(foundRule).equals(null)
		})
	})

	o.spec("getMoveResultValue", () => {
		o.test("return null when inbox rule does not have a MOVE result", async () => {
			const rule = _createRule([], [_createRuleResult(InboxRuleResultType.READ, null)])
			const moveResultValue = await ruleHandler.getMoveResultValue(rule, object<MailboxDetail>())
			o.check(moveResultValue).equals(null)
		})

		o.test("return target folder when inbox rule has a MOVE result", async () => {
			const moveTargetFolder = createTestEntity(MailSetTypeRef, {
				_id: ["listId", "folderId"],
				folderType: MailSetKind.CUSTOM,
			})
			const rule = _createRule([], [_createRuleResult(InboxRuleResultType.MOVE, moveTargetFolder._id)])

			const folders = object<FolderSystem>()
			when(folders.getFolderById(getElementId(moveTargetFolder))).thenReturn(moveTargetFolder)
			when(mailModel.getMailboxFoldersForId(anything())).thenResolve(folders)

			const moveResultValue = await ruleHandler.getMoveResultValue(rule, object<MailboxDetail>())

			o.check(moveResultValue).deepEquals(moveTargetFolder)
		})
	})

	o.spec("getLabelResultValue", () => {
		// FIXME
	})

	o.spec("getReadResultValue", () => {
		o.test("return true when rule has a READ result", () => {
			const rule = _createRule([], [_createRuleResult(InboxRuleResultType.READ, null)])
			o.check(ruleHandler.getReadResultValue(rule)).equals(true)
		})
		o.test("return false when rule does not have a READ result", () => {
			const rule = _createRule([], [_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])])
			o.check(ruleHandler.getReadResultValue(rule)).equals(false)
		})
	})

	o.spec("getExcludeSpamResultValue", () => {
		o.test("return true when inbox rule has an EXCLUDE_SPAM result", () => {
			const rule = _createRule([], [_createRuleResult(InboxRuleResultType.EXCLUDE_SPAM, null)])
			o.check(ruleHandler.getExcludeSpamResultValue(rule)).equals(true)
		})
		o.test("return false when inbox rule does not have EXCLUDE_SPAM result", () => {
			const rule = _createRule([], [_createRuleResult(InboxRuleResultType.MOVE, ["listId", "folderId"])])
			o.check(ruleHandler.getExcludeSpamResultValue(rule)).equals(false)
		})
	})

	o.spec("applyInboxRules", () => {
		let mailOne: Mail
		let mailTwo: Mail
		let moveTargetFolder: MailSet
		let moveTargetFolderTwo: MailSet
		let rule: ExpandedInboxRule
		let ruleTwo: ExpandedInboxRule
		let folders: FolderSystem

		o.beforeEach(() => {
			mailOne = _createMailWithDifferentEnvelopeSender({ subject: "hello friend" })
			mailTwo = _createMailWithDifferentEnvelopeSender({ subject: "hello friend 2" })

			moveTargetFolder = createTestEntity(MailSetTypeRef, {
				_id: ["listId", "folderId"],
				folderType: MailSetKind.CUSTOM,
			})
			moveTargetFolderTwo = createTestEntity(MailSetTypeRef, {
				_id: ["listId", "folder2Id"],
				folderType: MailSetKind.CUSTOM,
			})

			folders = object<FolderSystem>()
			when(folders.getFolderById(moveTargetFolder._id[1])).thenReturn(moveTargetFolder)
			when(folders.getFolderById(moveTargetFolderTwo._id[1])).thenReturn(moveTargetFolderTwo)
			when(mailModel.getMailboxFoldersForId(anything())).thenResolve(folders)

			rule = _createRule([], [_createRuleResult(InboxRuleResultType.MOVE, moveTargetFolder._id)])
			ruleTwo = _createRule([], [_createRuleResult(InboxRuleResultType.MOVE, moveTargetFolderTwo._id)])
		})

		o.test("moveMails is called once when multiple mails are moved to the same folder", async () => {
			const matchedList = [
				{ mail: mailOne, inboxRule: rule },
				{ mail: mailTwo, inboxRule: rule },
			]

			await ruleHandler.applyRules(matchedList, object<MailboxDetail>())

			verify(mailModel.moveMails([mailOne._id, mailTwo._id], moveTargetFolder, MoveMode.Mails), { times: 1 })
			// Also check that markMails is not called, since no mails are being marked read
			verify(mailModel.markMails(anything(), anything()), { times: 0 })
		})

		o.test("moveMails is called twice when mails are moved to different folders", async () => {
			const matchedList = [
				{ mail: mailOne, inboxRule: rule },
				{ mail: mailTwo, inboxRule: ruleTwo },
			]

			await ruleHandler.applyRules(matchedList, object<MailboxDetail>())

			verify(mailModel.moveMails([mailOne._id], moveTargetFolder, MoveMode.Mails), { times: 1 })
			verify(mailModel.moveMails([mailTwo._id], moveTargetFolderTwo, MoveMode.Mails), { times: 1 })
		})

		o.test("exclude moveMails is respected", async () => {
			const matchedList = [
				{ mail: mailOne, inboxRule: rule },
				{ mail: mailTwo, inboxRule: rule },
			]

			await ruleHandler.applyRules(matchedList, object<MailboxDetail>(), true)

			verify(mailModel.moveMails(anything(), anything(), anything()), { times: 0 })
		})

		o.test("all mails are mark read together", async () => {
			const readRule = _createRule([], [_createRuleResult(InboxRuleResultType.READ, null)])

			const mailOne = _createMailWithDifferentEnvelopeSender({ subject: "hello friend" })
			const mailTwo = _createMailWithDifferentEnvelopeSender({ subject: "hello friend 2" })

			const matchedList = [
				{ mail: mailOne, inboxRule: readRule },
				{ mail: mailTwo, inboxRule: readRule },
			]

			await ruleHandler.applyRules(matchedList, object<MailboxDetail>())

			verify(mailModel.markMails([mailOne._id, mailTwo._id], false), { times: 1 })
			// check that move is not called
			verify(mailModel.moveMails(anything(), anything(), anything()), { times: 0 })
		})

		o.test("all results on a rule are applied", async () => {
			const multiRule = _createRule(
				[],
				[_createRuleResult(InboxRuleResultType.MOVE, moveTargetFolder._id), _createRuleResult(InboxRuleResultType.READ, null)],
			)

			const matchedList = [{ mail: mailOne, inboxRule: multiRule }]

			await ruleHandler.applyRules(matchedList, object<MailboxDetail>())

			verify(mailModel.moveMails([mailOne._id], moveTargetFolder, MoveMode.Mails), { times: 1 })
			verify(mailModel.markMails([mailOne._id], false), { times: 1 })
		})
	})
})

function _createMailWithDifferentEnvelopeSender(values?: Partial<Mail>): Mail {
	return createTestEntity(MailTypeRef, {
		differentEnvelopeSender: "differentenvelopsender@something.com",
		sender: createTestEntity(MailAddressTypeRef, {
			address: "sender@tuta.com",
		}),
		...values,
	})
}

function _createMailDetails(values?: Partial<MailDetails>): MailDetails {
	return createTestEntity(MailDetailsTypeRef, {
		recipients: createTestEntity(RecipientsTypeRef, {
			toRecipients: [
				createTestEntity(MailAddressTypeRef, {
					address: "to-recipient@tuta.com",
				}),
			],
			ccRecipients: [
				createTestEntity(MailAddressTypeRef, {
					address: "cc-recipient@tuta.com",
				}),
			],
			bccRecipients: [
				createTestEntity(MailAddressTypeRef, {
					address: "bcc-recipient@tuta.com",
				}),
			],
		}),
		...values,
	})
}

function _createRuleCondition(type: InboxRuleConditionType, value: InboxRuleCondition["value"]): InboxRuleCondition {
	return createTestEntity(InboxRuleConditionTypeRef, {
		type,
		value,
	})
}

function _createRuleResult(type: InboxRuleResultType, value: InboxRuleResult["value"] = null): InboxRuleResult {
	return createTestEntity(InboxRuleResultTypeRef, {
		type,
		value,
	})
}

function _createRule(conditions: InboxRuleCondition[], results: InboxRuleResult[], name?: string): ExpandedInboxRule {
	return createTestEntity(ExpandedInboxRuleTypeRef, {
		name: name ?? "no-name",
		conditions,
		results,
	})
}
