// @flow
import o from "ospec/ospec.js"
import {_matchesRegularExpression} from "../../../src/mail/InboxRuleHandler"
import {createInboxRule} from "../../../src/api/entities/tutanota/InboxRule"

o.spec("InboxRuleHandlerTest", function () {
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
})


function _createRule(value: string): InboxRule {
	let rule = createInboxRule()
	rule.value = value
	return rule
}
