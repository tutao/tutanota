import o from "@tutao/otest"
import { InboxRule, InboxRuleTypeRef, Mail, MailAddressTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { InboxRuleConditionType } from "../../../../src/entities/tutanota/Utils"
import { createTestEntity } from "../../TestUtils"
import { _findMatchingRule } from "../../../../src/applications/mail-app/mail/model/LegacyInboxRuleHandler"

o.spec("LegacyInboxRuleHandler", () => {
	o.spec("Test _findMatchingRule", function () {
		o("check FROM_EQUALS is applied to from", async function () {
			const rules: InboxRule[] = [_createRule("sender@tuta.com", InboxRuleConditionType.FROM_EQUALS, ["ruleTarget", "ruleTarget"])]

			const mail = _createMailWithDifferentEnvelopeSender()

			const rule = await _findMatchingRule(this.mailFacade, mail, rules)
			o(rule).notEquals(null)

			if (rule) {
				o(_equalTupels(rule.targetFolder, ["ruleTarget", "ruleTarget"])).equals(true)
			}
		})
		o("check FROM_EQUALS is applied to envelope  sender", async function () {
			const rules: InboxRule[] = [_createRule("differentenvelopsender@something.com", InboxRuleConditionType.FROM_EQUALS, ["ruleTarget", "ruleTarget"])]

			const mail = _createMailWithDifferentEnvelopeSender()

			const rule = await _findMatchingRule(this.mailFacade, mail, rules)
			o(rule).notEquals(null)

			if (rule) {
				o(_equalTupels(rule.targetFolder, ["ruleTarget", "ruleTarget"])).equals(true)
			}
		})

		o("checks all rules independent of excludeFromSpamFilter is true", async function () {
			const subject = "Excluded Rule"
			const rules: InboxRule[] = [
				_createRule(subject, InboxRuleConditionType.SUBJECT_CONTAINS, ["ruleTarget", "ruleTarget"], true),
				_createRule(subject, InboxRuleConditionType.SUBJECT_CONTAINS, ["invalidTarget", "invalidTarget"], false),
			]

			const mail = _createMailWithDifferentEnvelopeSender()
			mail.subject = subject

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

function _createRule(value: string, type?: string, targetFolder?: IdTuple, excludeFromSpamFilter = false): InboxRule {
	let rule = createTestEntity(InboxRuleTypeRef)
	rule.value = value
	rule.type = type ? type : InboxRuleConditionType.SUBJECT_CONTAINS
	rule.targetFolder = targetFolder ? targetFolder : ["empty", "empty"]
	rule.excludeFromSpamFilter = excludeFromSpamFilter
	return rule
}

function _equalTupels(t1: IdTuple, t2: IdTuple): boolean {
	if (t1.length === 2 && t2.length === 2) {
		if (t1[0] !== t2[0] || t1[1] !== t2[1]) {
			return false
		}

		return true
	}

	return false
}
