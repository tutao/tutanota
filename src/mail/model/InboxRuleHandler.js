//@flow
import type {MoveMailData} from "../../api/entities/tutanota/MoveMailData"
import {createMoveMailData} from "../../api/entities/tutanota/MoveMailData"
import {TutanotaService} from "../../api/entities/tutanota/Services"
import {InboxRuleType, MAX_NBR_MOVE_DELETE_MAIL_SERVICE} from "../../api/common/TutanotaConstants"
import {isDomainName, isRegularExpression} from "../../misc/FormatValidator"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {debounce, getMailHeaders, noOp} from "../../api/common/utils/Utils"
import {assertMainOrNode} from "../../api/common/Env"
import {lang} from "../../misc/LanguageViewModel"
import {MailHeadersTypeRef} from "../../api/entities/tutanota/MailHeaders"
import {logins} from "../../api/main/LoginController"
import type {MailboxDetail} from "./MailModel"
import {LockedError, NotFoundError, PreconditionFailedError} from "../../api/common/error/RestError"
import type {Mail} from "../../api/entities/tutanota/Mail"
import type {InboxRule} from "../../api/entities/tutanota/InboxRule"
import type {MailAddress} from "../../api/entities/tutanota/MailAddress"
import type {SelectorItemList} from "../../gui/base/DropDownSelectorN"
import {splitInChunks} from "../../api/common/utils/ArrayUtils"
import {EntityClient} from "../../api/common/EntityClient"
import type {WorkerClient} from "../../api/main/WorkerClient"
import {getElementId, getListId, isSameId} from "../../api/common/utils/EntityUtils";
import {getInboxFolder} from "./MailUtils"

assertMainOrNode()

const moveMailDataPerFolder: MoveMailData[] = []
const DEBOUNCE_FIRST_MOVE_MAIL_REQUEST_MS = 200
let applyingRules = false // used to avoid concurrent application of rules (-> requests to locked service)

function sendMoveMailRequest(worker: WorkerClient): Promise<void> {
	if (moveMailDataPerFolder.length) {
		const moveToTargetFolder = moveMailDataPerFolder.shift()
		const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, moveToTargetFolder.mails)
		return Promise.each(mailChunks, mailChunk => {
			moveToTargetFolder.mails = mailChunk
			return worker.serviceRequest(TutanotaService.MoveMailService, HttpMethod.POST, moveToTargetFolder)
		}).catch(LockedError, e => { //LockedError should no longer be thrown!?!
			console.log("moving mail failed", e, moveToTargetFolder)
		}).catch(PreconditionFailedError, e => {
			// move mail operation may have been locked by other process
			console.log("moving mail failed", e, moveToTargetFolder)
		}).finally(() => {
			return sendMoveMailRequest(worker)
		})
	} else {
		//We are done and unlock for future requests
		return Promise.resolve()
	}
}

// We throttle the moveMail requests to a rate of 50ms
// Each target folder requires one request
const applyMatchingRules = debounce(DEBOUNCE_FIRST_MOVE_MAIL_REQUEST_MS, (worker: WorkerClient) => {
	if (applyingRules) return
	// We lock to avoid concurrent requests
	applyingRules = true
	sendMoveMailRequest(worker).finally(() => {
		applyingRules = false
	})
})

export function getInboxRuleTypeNameMapping(): SelectorItemList<string> {
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
export function findAndApplyMatchingRule(worker: WorkerClient, entityClient: EntityClient, mailboxDetail: MailboxDetail, mail: Mail,
                                         applyRulesOnServer: boolean): Promise<?IdTuple> {
	if (mail._errors || !mail.unread || !isInboxList(mailboxDetail, getListId(mail))
		|| !logins.getUserController().isPremiumAccount()) {
		return Promise.resolve(null)
	}
	return _findMatchingRule(entityClient, mail).then(inboxRule => {
		if (inboxRule) {
			let targetFolder = mailboxDetail.folders.filter(folder => folder !== getInboxFolder(mailboxDetail.folders))
			                                .find(folder => isSameId(folder._id, inboxRule.targetFolder))
			if (targetFolder) {
				if (applyRulesOnServer) {
					let moveMailData = moveMailDataPerFolder.find(folderMoveMailData => isSameId(folderMoveMailData.targetFolder, inboxRule.targetFolder))
					if (moveMailData) {
						moveMailData.mails.push(mail._id)
					} else {
						moveMailData = createMoveMailData()
						moveMailData.targetFolder = inboxRule.targetFolder
						moveMailData.mails.push(mail._id)
						moveMailDataPerFolder.push(moveMailData)
					}
					applyMatchingRules(worker)
				}
				return [targetFolder.mails, getElementId(mail)]
			} else {
				return null
			}
		} else {
			return null
		}
	})
}

/**
 * Finds the first matching inbox rule for the mail and returns it.
 * export only for testing
 */
export function _findMatchingRule(entityClient: EntityClient, mail: Mail): Promise<?InboxRule> {
	return Promise.reduce(logins.getUserController().props.inboxRules, (resultInboxRule, inboxRule) => {

		if (resultInboxRule) {
			//console.log("rule matches", resultInboxRule)
			return resultInboxRule
		}
		// console.log("find matching rule", inboxRule.value)
		let ruleType = inboxRule.type;
		try {
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
					return entityClient.load(MailHeadersTypeRef, mail.headers)
						.then(mailHeaders => {
							return _checkContainsRule(getMailHeaders(mailHeaders), inboxRule)
						})
						.catch(NotFoundError, noOp)
						.catch(e => {
							// Does the outer catch already handle this case?
							console.error("Error processing inbox rule:", e.message)
							return null
						})
				}
			}
		} catch (e) {
			console.error("Error processing inbox rule:", e.message)
		}

		return null
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
		let flags = inboxRule.value.replace(/.*\/([gimsuy]*)$/, '$1');
		let pattern = inboxRule.value.replace(new RegExp('^/(.*?)/' + flags + '$'), '$1');
		let regExp = new RegExp(pattern, flags);
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

export function isInboxList(mailboxDetail: MailboxDetail, listId: Id): boolean {
	return isSameId(listId, getInboxFolder(mailboxDetail.folders).mails)
}
