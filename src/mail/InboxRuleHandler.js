//@flow
import {createMoveMailData} from "../api/entities/tutanota/MoveMailData"
import {load, serviceRequestVoid} from "../api/main/Entity"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {InboxRuleType} from "../api/common/TutanotaConstants"
import {isDomainName, isRegularExpression} from "../misc/Formatter"
import {HttpMethod, isSameId} from "../api/common/EntityFunctions"
import {neverNull, noOp} from "../api/common/utils/Utils"
import {assertMainOrNode} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {MailHeadersTypeRef} from "../api/entities/tutanota/MailHeaders"
import {logins} from "../api/main/LoginController"
import {getInboxFolder} from "./MailUtils"
import type {MailboxDetail} from "./MailModel"
import {NotFoundError, PreconditionFailedError} from "../api/common/error/RestError"

assertMainOrNode()


export function getInboxRuleTypeNameMapping(): {value: string, name: string}[] {
	return [
		{value: InboxRuleType.FROM_EQUALS, name: lang.get("inboxRuleSenderEquals_action")},
		{value: InboxRuleType.RECIPIENT_TO_EQUALS, name: lang.get("inboxRuleToRecipientEquals_action")},
		{value: InboxRuleType.RECIPIENT_CC_EQUALS, name: lang.get("inboxRuleCCRecipientEquals_action")},
		{value: InboxRuleType.RECIPIENT_BCC_EQUALS, name: lang.get("inboxRuleBCCRecipientEquals_action")},
		{value: InboxRuleType.SUBJECT_CONTAINS, name: lang.get("inboxRuleSubjectContains_action")},
		{value: InboxRuleType.MAIL_HEADER_CONTAINS, name: lang.get("inboxRuleMailHeaderContains_action")}
	]
}

export function getInboxRuleTypeName(type: string): string {
	let typeNameMapping = getInboxRuleTypeNameMapping().find(t => t.value === type)
	return typeNameMapping != null ? typeNameMapping.name : ""
}

/**
 * Checks the mail for an existing inbox rule and moves the mail to the target folder of the rule.
 * @returns true if a rule matches otherwise false
 */
export function findAndApplyMatchingRule(mailboxDetail: MailboxDetail, mail: Mail): Promise<boolean> {
	if (mail._errors || !mail.unread || !isInboxList(mailboxDetail, mail._id[0])
		|| !logins.getUserController().isPremiumAccount()) {
		return Promise.resolve(false)
	}
	return _findMatchingRule(mail).then(inboxRule => {
		if (inboxRule) {
			let targetFolder = mailboxDetail.folders.find(folder => isSameId(folder._id, neverNull(inboxRule).targetFolder));
			if (targetFolder) {
				let moveMailData = createMoveMailData()
				moveMailData.targetFolder = inboxRule.targetFolder
				moveMailData.mails.push(mail._id)
				// execute move mail in parallel
				serviceRequestVoid(TutanotaService.MoveMailService, HttpMethod.POST, moveMailData).catch(PreconditionFailedError, e => {
					// move mail operation may have been locked by other process
				})
				return true
			} else {
				return false
			}
		} else {
			return false
		}
	})
}

/**
 * Finds the first matching inbox rule for the mail and returns it.
 * export only for testing
 */
export function _findMatchingRule(mail: Mail): Promise<?InboxRule> {
	return Promise.reduce(logins.getUserController().props.inboxRules, (resultInboxRule, inboxRule) => {

		if (resultInboxRule) {
			//console.log("rule matches", resultInboxRule)
			return resultInboxRule
		}
		//console.log("find matching rule", inboxRule.value)
		let ruleType = inboxRule.type;
		if (ruleType === InboxRuleType.FROM_EQUALS) {
			return _checkEmailAddresses([mail.sender], inboxRule)
		} else if (ruleType === InboxRuleType.RECIPIENT_TO_EQUALS) {
			return _checkEmailAddresses(mail.toRecipients, inboxRule)
		} else if (ruleType === InboxRuleType.RECIPIENT_CC_EQUALS) {
			return _checkEmailAddresses(mail.ccRecipients, inboxRule)
		} else if (ruleType === InboxRuleType.RECIPIENT_BCC_EQUALS) {
			return _checkEmailAddresses(mail.bccRecipients, inboxRule)
		} else if (ruleType === InboxRuleType.SUBJECT_CONTAINS) {
			return _checkContainsRule(mail.subject, inboxRule)
		} else if (ruleType === InboxRuleType.MAIL_HEADER_CONTAINS) {
			if (mail.headers) {
				return load(MailHeadersTypeRef, mail.headers)
					.then(mailHeaders => {
						return _checkContainsRule(mailHeaders.headers, inboxRule)
					})
					.catch(NotFoundError, noOp)
			} else {
				return null
			}
		} else {
			return null
		}
	}, null)
}


function _checkContainsRule(value: string, inboxRule: InboxRule): ?InboxRule {
	if (isRegularExpression(inboxRule.value) && _matchesRegularExpression(value, inboxRule)) {
		return inboxRule
	} else if (value.indexOf(inboxRule.value) >= 0) {
		return inboxRule
	} else {
		return null
	}
}

/** export for test. */
export function _matchesRegularExpression(value: string, inboxRule: InboxRule): boolean {
	if (isRegularExpression(inboxRule.value)) {
		let regExp = new RegExp(inboxRule.value.substring(1, inboxRule.value.length - 1));
		return regExp.test(value)
	}
	return false
}

function _checkEmailAddresses(mailAddresses: MailAddress[], inboxRule: InboxRule): ?InboxRule {
	let mailAddress = mailAddresses.find(mailAddress => {
		let cleanMailAddress = mailAddress.address.toLowerCase().trim();
		if (isRegularExpression(inboxRule.value)) {
			return _matchesRegularExpression(cleanMailAddress, inboxRule)
		} else if (isDomainName(inboxRule.value)) {
			let domain = cleanMailAddress.split("@")[1];
			return domain === inboxRule.value
		} else {
			return cleanMailAddress === inboxRule.value
		}
	})
	if (mailAddress) {
		return inboxRule
	} else {
		return null
	}
}

export function isInboxList(mailboxDetail: MailboxDetail, listId: Id) {
	return isSameId(listId, getInboxFolder(mailboxDetail.folders).mails)
}
