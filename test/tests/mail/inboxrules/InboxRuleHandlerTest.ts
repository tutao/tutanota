import o from "@tutao/otest"
import {
	_checkContainsRuleCondition,
	_checkEmailAddresses,
	_matchesRegularExpression,
	_shouldApplyRule,
} from "../../../../src/applications/mail-app/mail/model/InboxRuleHandler.js"
import { MailSetTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { MailSetKind, SYSTEM_FOLDERS } from "../../../../src/entities/tutanota/Utils"
import { createTestEntity } from "../../TestUtils"

o.spec("InboxRuleHandler", function () {
	o.spec("_shouldApplyRule", () => {
		o.test("return false when source folder is not INBOX or SPAM", () => {
			const mail = createTestEntity(MailTypeRef)

			// make sure the test is still valid if SYSTEM_FOLDERS have changed
			o.check(SYSTEM_FOLDERS).deepEquals([
				MailSetKind.INBOX,
				MailSetKind.SENT,
				MailSetKind.TRASH,
				MailSetKind.ARCHIVE,
				MailSetKind.SPAM,
				MailSetKind.DRAFT,
				MailSetKind.SCHEDULED,
			])

			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.CUSTOM }), true)).equals(false)
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.SENT }), true)).equals(false)
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.TRASH }), true)).equals(false)
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.ARCHIVE }), true)).equals(false)
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.DRAFT }), true)).equals(false)
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.SCHEDULED }), true)).equals(false)
		})

		o.test("return false when mail is unprocessed and processing state is not ignored", () => {
			const mail = createTestEntity(MailTypeRef, {
				processNeeded: true,
			})
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.INBOX }), false)).equals(false)
		})
		o.test("return true when mail is unprocessed but processing state is ignored", () => {
			const mail = createTestEntity(MailTypeRef, {
				processNeeded: true,
			})
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.INBOX }), true)).equals(true)
		})

		o.test("return false when mail has errors", () => {
			const mail = createTestEntity(MailTypeRef, {
				_errors: {},
			})
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.INBOX }), true)).equals(false)
		})

		o.test("return true when source folder is INBOX or SPAM and mail is processed without errors", () => {
			const mail = createTestEntity(MailTypeRef)
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.INBOX }), true)).equals(true)
			o.check(_shouldApplyRule(mail, createTestEntity(MailSetTypeRef, { folderType: MailSetKind.SPAM }), true)).equals(true)
		})
	})

	o.spec("_checkContainsRuleCondition", () => {
		o.test("works for string condition values", () => {
			o.check(_checkContainsRuleCondition("hello there friend", "ther")).equals(true)
			o.check(_checkContainsRuleCondition("hello there friend", "bye")).equals(false)
		})
		o.test("works for RegEx string condition values", () => {
			o.check(_checkContainsRuleCondition("hello there friend", "/friend$/")).equals(true)
			o.check(_checkContainsRuleCondition("hello there friend", "/^friend/")).equals(false)
		})
	})

	o.spec("_checkEmailAddresses", () => {
		const mailAddresses = ["address1@tuta.com", "address2@tuta.com"]

		o.test("works for email address condition values", () => {
			o.check(_checkEmailAddresses(mailAddresses, "address1@tuta.com")).equals(true)
			o.check(_checkEmailAddresses(mailAddresses, "address2@tuta.com")).equals(true)
			o.check(_checkEmailAddresses(mailAddresses, "address3@tuta.com")).equals(false)
		})
		o.test("works for RegEx string condition values", () => {
			o.check(_checkEmailAddresses(mailAddresses, "/^addr/")).equals(true)
			o.check(_checkEmailAddresses(mailAddresses, "/com$/")).equals(true)
			o.check(_checkEmailAddresses(mailAddresses, "/^mail/")).equals(false)
		})
		o.test("works for domain condition values", () => {
			o.check(_checkEmailAddresses(mailAddresses, "tuta.com")).equals(true)
			o.check(_checkEmailAddresses(mailAddresses, "tutanota.com")).equals(false)
		})
	})

	o.spec("Test _matchesRegularExpression", function () {
		o.test(" check invalid regular expressions", function () {
			o.check(_matchesRegularExpression("", "")).equals(false)
			o.check(_matchesRegularExpression("1", "1")).equals(false)
			o.check(_matchesRegularExpression("$", "$")).equals(false)
		})
		o.test(" check regular expressions", function () {
			let regExRuleEmpty = "//"

			o.check(_matchesRegularExpression("", regExRuleEmpty)).equals(true)
			o.check(_matchesRegularExpression(" ", regExRuleEmpty)).equals(true)

			let regExRule123 = "/123/"

			o.check(_matchesRegularExpression("123", regExRule123)).equals(true)
			o.check(_matchesRegularExpression("01234", regExRule123)).equals(true)
			o.check(_matchesRegularExpression("0124", regExRule123)).equals(false)

			let regExRuleCharacterClass = "/[1]+/"

			o.check(_matchesRegularExpression("1", regExRuleCharacterClass)).equals(true)
			o.check(_matchesRegularExpression("1111111", regExRuleCharacterClass)).equals(true)
			o.check(_matchesRegularExpression("1211111", regExRuleCharacterClass)).equals(true)
			o.check(_matchesRegularExpression("22", regExRuleCharacterClass)).equals(false)

			let regExRuleEscaped = "/\\[1\\]/"

			o.check(_matchesRegularExpression("[1]", regExRuleEscaped)).equals(true)
			o.check(_matchesRegularExpression("[1", regExRuleEscaped)).equals(false)
		})
		o.test("check case insensitivity", function () {
			let regExRuleLowerCase = "/hey/"

			o.check(_matchesRegularExpression("hey", regExRuleLowerCase)).equals(true)
			o.check(_matchesRegularExpression("HEY", regExRuleLowerCase)).equals(false)

			let regExRuleUpperCase = "/HEY/"

			o.check(_matchesRegularExpression("hey", regExRuleUpperCase)).equals(false)
			o.check(_matchesRegularExpression("HEY", regExRuleUpperCase)).equals(true)
		})
		o.test("check regular expression with flags", function () {
			let regExRuleWithFlagsLowerCase = "/hey/i"

			o.check(_matchesRegularExpression("hey", regExRuleWithFlagsLowerCase)).equals(true)
			o.check(_matchesRegularExpression("HEY", regExRuleWithFlagsLowerCase)).equals(true)
			o.check(_matchesRegularExpression("hEy", regExRuleWithFlagsLowerCase)).equals(true)

			let regExRuleWithFlagsUpperCase = "/HEY/i"

			o.check(_matchesRegularExpression("hey", regExRuleWithFlagsUpperCase)).equals(true)
			o.check(_matchesRegularExpression("HEY", regExRuleWithFlagsUpperCase)).equals(true)
		})
	})
})
