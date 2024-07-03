import o from "@tutao/otest"
import { _findMatchingRule, _matchesRegularExpression } from "../../../src/mail-app/mail/model/InboxRuleHandler.js"
import type { InboxRule, Mail } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { InboxRuleTypeRef, MailAddressTypeRef, MailTypeRef } from "../../../src/common/api/entities/tutanota/TypeRefs.js"
import { EntityRestClientMock } from "../api/worker/rest/EntityRestClientMock.js"
import { EntityClient } from "../../../src/common/api/common/EntityClient.js"
import { InboxRuleType } from "../../../src/common/api/common/TutanotaConstants.js"
import { createTestEntity } from "../TestUtils.js"

o.spec("InboxRuleHandlerTest", function () {
	o.spec("Test _matchesRegularExpression", function () {
		o(" check invalid regular expressions", function () {
			o(_matchesRegularExpression("", _createRule(""))).equals(false)
			o(_matchesRegularExpression("1", _createRule("1"))).equals(false)
			o(_matchesRegularExpression("$", _createRule("$"))).equals(false)
		})
		o(" check regular expressions", function () {
			let regExRuleEmpty = _createRule("//")

			o(_matchesRegularExpression("", regExRuleEmpty)).equals(true)
			o(_matchesRegularExpression(" ", regExRuleEmpty)).equals(true)

			let regExRule123 = _createRule("/123/")

			o(_matchesRegularExpression("123", regExRule123)).equals(true)
			o(_matchesRegularExpression("01234", regExRule123)).equals(true)
			o(_matchesRegularExpression("0124", regExRule123)).equals(false)

			let regExRuleCharacterClass = _createRule("/[1]+/")

			o(_matchesRegularExpression("1", regExRuleCharacterClass)).equals(true)
			o(_matchesRegularExpression("1111111", regExRuleCharacterClass)).equals(true)
			o(_matchesRegularExpression("1211111", regExRuleCharacterClass)).equals(true)
			o(_matchesRegularExpression("22", regExRuleCharacterClass)).equals(false)

			let regExRuleEscaped = _createRule("/\\[1\\]/")

			o(_matchesRegularExpression("[1]", regExRuleEscaped)).equals(true)
			o(_matchesRegularExpression("[1", regExRuleEscaped)).equals(false)
		})
		o("check case insensitivity", function () {
			let regExRuleLowerCase = _createRule("/hey/")

			o(_matchesRegularExpression("hey", regExRuleLowerCase)).equals(true)
			o(_matchesRegularExpression("HEY", regExRuleLowerCase)).equals(false)

			let regExRuleUpperCase = _createRule("/HEY/")

			o(_matchesRegularExpression("hey", regExRuleUpperCase)).equals(false)
			o(_matchesRegularExpression("HEY", regExRuleUpperCase)).equals(true)
		})
		o("check regular expression with flags", function () {
			let regExRuleWithFlagsLowerCase = _createRule("/hey/i")

			o(_matchesRegularExpression("hey", regExRuleWithFlagsLowerCase)).equals(true)
			o(_matchesRegularExpression("HEY", regExRuleWithFlagsLowerCase)).equals(true)
			o(_matchesRegularExpression("hEy", regExRuleWithFlagsLowerCase)).equals(true)

			let regExRuleWithFlagsUpperCase = _createRule("/HEY/i")

			o(_matchesRegularExpression("hey", regExRuleWithFlagsUpperCase)).equals(true)
			o(_matchesRegularExpression("HEY", regExRuleWithFlagsUpperCase)).equals(true)
		})
	})
	o.spec("Test _findMatchingRule", function () {
		const restClient: EntityRestClientMock = new EntityRestClientMock()
		const entityClient = new EntityClient(restClient)
		o("check FROM_EQUALS is applied to from", async function () {
			const rules: InboxRule[] = [_createRule("sender@tuta.com", InboxRuleType.FROM_EQUALS, ["ruleTarget", "ruleTarget"])]

			const mail = _createMailWithDifferentEnvelopeSender()

			const rule = await _findMatchingRule(this.mailFacade, mail, rules)
			o(rule).notEquals(null)

			if (rule) {
				o(_equalTupels(rule.targetFolder, ["ruleTarget", "ruleTarget"])).equals(true)
			}
		})
		o("check FROM_EQUALS is applied to envelope  sender", async function () {
			const rules: InboxRule[] = [_createRule("differentenvelopsender@something.com", InboxRuleType.FROM_EQUALS, ["ruleTarget", "ruleTarget"])]

			const mail = _createMailWithDifferentEnvelopeSender()

			const rule = await _findMatchingRule(this.mailFacade, mail, rules)
			o(rule).notEquals(null)

			if (rule) {
				o(_equalTupels(rule.targetFolder, ["ruleTarget", "ruleTarget"])).equals(true)
			}
		})
	})
})

function _createMailWithDifferentEnvelopeSender(): Mail {
	let mail = createTestEntity(MailTypeRef)
	let sender = createTestEntity(MailAddressTypeRef)
	sender.address = "sender@tuta.com"
	mail.sender = sender
	mail.differentEnvelopeSender = "differentenvelopsender@something.com"
	return mail
}

function _createRule(value: string, type?: string, targetFolder?: IdTuple): InboxRule {
	let rule = createTestEntity(InboxRuleTypeRef)
	rule.value = value
	rule.type = type ? type : InboxRuleType.SUBJECT_CONTAINS
	rule.targetFolder = targetFolder ? targetFolder : ["empty", "empty"]
	return rule
}

function _equalTupels(t1: IdTuple, t2: IdTuple): boolean {
	if (t1.length === 2 && t2.length == 2) {
		if (t1[0] !== t2[0] || t1[1] !== t2[1]) {
			return false
		}

		return true
	}

	return false
}
