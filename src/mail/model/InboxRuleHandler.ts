import type { InboxRule, Mail, MoveMailData } from "../../api/entities/tutanota/TypeRefs.js"
import { createMoveMailData } from "../../api/entities/tutanota/TypeRefs.js"
import { InboxRuleType, MailFolderType, MAX_NBR_MOVE_DELETE_MAIL_SERVICE } from "../../api/common/TutanotaConstants"
import { isDomainName, isRegularExpression } from "../../misc/FormatValidator"
import { assertNotNull, asyncFind, debounce, ofClass, promiseMap, splitInChunks } from "@tutao/tutanota-utils"
import { lang } from "../../misc/LanguageViewModel"
import type { MailboxDetail } from "./MailModel"
import { LockedError, PreconditionFailedError } from "../../api/common/error/RestError"
import type { SelectorItemList } from "../../gui/base/DropDownSelector.js"
import { getElementId, getListId, isSameId } from "../../api/common/utils/EntityUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { MailFacade } from "../../api/worker/facades/lazy/MailFacade.js"
import { assertSystemFolderOfType } from "../../api/common/mail/CommonMailUtils.js"
import { LoginController } from "../../api/main/LoginController.js"
import { getMailHeaders } from "./MailUtils.js"

assertMainOrNode()
const moveMailDataPerFolder: MoveMailData[] = []
const DEBOUNCE_FIRST_MOVE_MAIL_REQUEST_MS = 200
let applyingRules = false // used to avoid concurrent application of rules (-> requests to locked service)

async function sendMoveMailRequest(mailFacade: MailFacade): Promise<void> {
	if (moveMailDataPerFolder.length) {
		const moveToTargetFolder = assertNotNull(moveMailDataPerFolder.shift())
		const mailChunks = splitInChunks(MAX_NBR_MOVE_DELETE_MAIL_SERVICE, moveToTargetFolder.mails)
		await promiseMap(mailChunks, (mailChunk) => {
			moveToTargetFolder.mails = mailChunk
			return mailFacade.moveMails(mailChunk, moveToTargetFolder.targetFolder)
		})
			.catch(
				ofClass(LockedError, (e) => {
					//LockedError should no longer be thrown!?!
					console.log("moving mail failed", e, moveToTargetFolder)
				}),
			)
			.catch(
				ofClass(PreconditionFailedError, (e) => {
					// move mail operation may have been locked by other process
					console.log("moving mail failed", e, moveToTargetFolder)
				}),
			)
			.finally(() => {
				return sendMoveMailRequest(mailFacade)
			})
	} //We are done and unlock for future requests
}

// We throttle the moveMail requests to a rate of 50ms
// Each target folder requires one request
const applyMatchingRules = debounce(DEBOUNCE_FIRST_MOVE_MAIL_REQUEST_MS, (mailFacade: MailFacade) => {
	if (applyingRules) return
	// We lock to avoid concurrent requests
	applyingRules = true
	sendMoveMailRequest(mailFacade).finally(() => {
		applyingRules = false
	})
})

export function getInboxRuleTypeNameMapping(): SelectorItemList<string> {
	return [
		{
			value: InboxRuleType.FROM_EQUALS,
			name: lang.get("inboxRuleSenderEquals_action"),
		},
		{
			value: InboxRuleType.RECIPIENT_TO_EQUALS,
			name: lang.get("inboxRuleToRecipientEquals_action"),
		},
		{
			value: InboxRuleType.RECIPIENT_CC_EQUALS,
			name: lang.get("inboxRuleCCRecipientEquals_action"),
		},
		{
			value: InboxRuleType.RECIPIENT_BCC_EQUALS,
			name: lang.get("inboxRuleBCCRecipientEquals_action"),
		},
		{
			value: InboxRuleType.SUBJECT_CONTAINS,
			name: lang.get("inboxRuleSubjectContains_action"),
		},
		{
			value: InboxRuleType.MAIL_HEADER_CONTAINS,
			name: lang.get("inboxRuleMailHeaderContains_action"),
		},
	]
}

export function getInboxRuleTypeName(type: string): string {
	let typeNameMapping = getInboxRuleTypeNameMapping().find((t) => t.value === type)
	return typeNameMapping != null ? typeNameMapping.name : ""
}

export class InboxRuleHandler {
	constructor(private readonly mailFacade: MailFacade, private readonly logins: LoginController) {}

	/**
	 * Checks the mail for an existing inbox rule and moves the mail to the target folder of the rule.
	 * @returns true if a rule matches otherwise false
	 */
	async findAndApplyMatchingRule(mailboxDetail: MailboxDetail, mail: Mail, applyRulesOnServer: boolean): Promise<IdTuple | null> {
		if (mail._errors || !mail.unread || !isInboxList(mailboxDetail, getListId(mail)) || !this.logins.getUserController().isPremiumAccount()) {
			return null
		}

		const inboxRule = await _findMatchingRule(this.mailFacade, mail, this.logins.getUserController().props.inboxRules)
		if (inboxRule) {
			let targetFolder = mailboxDetail.folders.getFolderById(inboxRule.targetFolder)

			if (targetFolder && targetFolder.folderType !== MailFolderType.INBOX) {
				if (applyRulesOnServer) {
					let moveMailData = moveMailDataPerFolder.find((folderMoveMailData) => isSameId(folderMoveMailData.targetFolder, inboxRule.targetFolder))

					if (moveMailData) {
						moveMailData.mails.push(mail._id)
					} else {
						moveMailData = createMoveMailData({
							targetFolder: inboxRule.targetFolder,
							mails: [mail._id],
						})
						moveMailDataPerFolder.push(moveMailData)
					}

					applyMatchingRules(this.mailFacade)
				}

				return [targetFolder.mails, getElementId(mail)]
			} else {
				return null
			}
		} else {
			return null
		}
	}
}

/**
 * Finds the first matching inbox rule for the mail and returns it.
 * export only for testing
 */
export async function _findMatchingRule(mailFacade: MailFacade, mail: Mail, rules: InboxRule[]): Promise<InboxRule | null> {
	return asyncFind(rules, (rule) => checkInboxRule(mailFacade, mail, rule)).then((v) => v ?? null)
}

async function checkInboxRule(mailFacade: MailFacade, mail: Mail, inboxRule: InboxRule): Promise<boolean> {
	const ruleType = inboxRule.type
	try {
		if (ruleType === InboxRuleType.FROM_EQUALS) {
			let mailAddresses = [mail.sender.address]

			if (mail.differentEnvelopeSender) {
				mailAddresses.push(mail.differentEnvelopeSender)
			}

			return _checkEmailAddresses(mailAddresses, inboxRule)
		} else if (ruleType === InboxRuleType.RECIPIENT_TO_EQUALS) {
			const toRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.toRecipients
			return _checkEmailAddresses(
				toRecipients.map((m) => m.address),
				inboxRule,
			)
		} else if (ruleType === InboxRuleType.RECIPIENT_CC_EQUALS) {
			const ccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.ccRecipients
			return _checkEmailAddresses(
				ccRecipients.map((m) => m.address),
				inboxRule,
			)
		} else if (ruleType === InboxRuleType.RECIPIENT_BCC_EQUALS) {
			const bccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.bccRecipients
			return _checkEmailAddresses(
				bccRecipients.map((m) => m.address),
				inboxRule,
			)
		} else if (ruleType === InboxRuleType.SUBJECT_CONTAINS) {
			return _checkContainsRule(mail.subject, inboxRule)
		} else if (ruleType === InboxRuleType.MAIL_HEADER_CONTAINS) {
			const details = await mailFacade.loadMailDetailsBlob(mail)
			if (details.headers != null) {
				return _checkContainsRule(getMailHeaders(details.headers), inboxRule)
			} else {
				return false
			}
		} else {
			console.warn("Unknown rule type: ", inboxRule.type)
			return false
		}
	} catch (e) {
		console.error("Error processing inbox rule:", e.message)
		return false
	}
}

function _checkContainsRule(value: string, inboxRule: InboxRule): boolean {
	return (isRegularExpression(inboxRule.value) && _matchesRegularExpression(value, inboxRule)) || value.includes(inboxRule.value)
}

/** export for test. */
export function _matchesRegularExpression(value: string, inboxRule: InboxRule): boolean {
	if (isRegularExpression(inboxRule.value)) {
		let flags = inboxRule.value.replace(/.*\/([gimsuy]*)$/, "$1")
		let pattern = inboxRule.value.replace(new RegExp("^/(.*?)/" + flags + "$"), "$1")
		let regExp = new RegExp(pattern, flags)
		return regExp.test(value)
	}

	return false
}

function _checkEmailAddresses(mailAddresses: string[], inboxRule: InboxRule): boolean {
	const mailAddress = mailAddresses.find((mailAddress) => {
		let cleanMailAddress = mailAddress.toLowerCase().trim()

		if (isRegularExpression(inboxRule.value)) {
			return _matchesRegularExpression(cleanMailAddress, inboxRule)
		} else if (isDomainName(inboxRule.value)) {
			let domain = cleanMailAddress.split("@")[1]
			return domain === inboxRule.value
		} else {
			return cleanMailAddress === inboxRule.value
		}
	})
	return mailAddress != null
}

export function isInboxList(mailboxDetail: MailboxDetail, listId: Id): boolean {
	return isSameId(listId, assertSystemFolderOfType(mailboxDetail.folders, MailFolderType.INBOX).mails)
}
