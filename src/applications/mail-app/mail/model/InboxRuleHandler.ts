import { asyncFind, isDomainName, isEmpty, isRegularExpression } from "@tutao/utils"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import type { SelectorItemList } from "../../../../ui/base/DropDownSelector.js"
import { assertMainOrNode } from "@tutao/app-env"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { MailModel } from "./MailModel"
import { ExpandedInboxRule, InboxRuleCondition, Mail, MailSet } from "@tutao/entities/tutanota"
import { InboxRuleConditionType, InboxRuleResultType, MailSetKind, ProcessingState } from "../../../../entities/tutanota/Utils"
import { elementIdPart } from "@tutao/meta"
import { getMailHeaders } from "./MailUtils"

assertMainOrNode()

export function getInboxRuleTypeNameMapping(): SelectorItemList<string> {
	return [
		{
			value: InboxRuleConditionType.FROM_EQUALS,
			name: lang.get("inboxRuleSenderEquals_action"),
		},
		{
			value: InboxRuleConditionType.RECIPIENT_TO_EQUALS,
			name: lang.get("inboxRuleToRecipientEquals_action"),
		},
		{
			value: InboxRuleConditionType.RECIPIENT_CC_EQUALS,
			name: lang.get("inboxRuleCCRecipientEquals_action"),
		},
		{
			value: InboxRuleConditionType.RECIPIENT_BCC_EQUALS,
			name: lang.get("inboxRuleBCCRecipientEquals_action"),
		},
		{
			value: InboxRuleConditionType.SUBJECT_CONTAINS,
			name: lang.get("inboxRuleSubjectContains_action"),
		},
		{
			value: InboxRuleConditionType.MAIL_HEADER_CONTAINS,
			name: lang.get("inboxRuleMailHeaderContains_action"),
		},
		// TODO: need to add HAS_ATTACHMENT
	]
}

export function getInboxRuleTypeName(type: string): string {
	let typeNameMapping = getInboxRuleTypeNameMapping().find((t) => t.value === type)
	return typeNameMapping != null ? typeNameMapping.name : ""
}

export class InboxRuleHandler {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly logins: LoginController,
		private readonly mailModel: MailModel,
	) {}

	/**
	 * Checks the mail for an existing inbox rule and returns matching data
	 * @returns The target folder and UnencryptedProcessInboxDatum
	 */
	async findMatchingInboxRule(mail: Readonly<Mail>, sourceFolder: MailSet, ignoreProcessingState = false): Promise<ExpandedInboxRule | null> {
		if (sourceFolder.folderType !== MailSetKind.INBOX && sourceFolder.folderType !== MailSetKind.SPAM) {
			return null
		}

		const shouldApply =
			(mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED ||
				mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED_AND_DO_NOT_RUN_SPAM_PREDICTION) &&
			mail.processNeeded

		if (mail._errors || !this.logins.getUserController().isPaidAccount() || (!ignoreProcessingState && !shouldApply)) {
			return null
		}

		return await _findMatchingRule(this.mailFacade, mail, this.logins.getUserController().props.expandedInboxRules)
	}

	async getTargetFolder(inboxRule: ExpandedInboxRule, mailboxDetail: MailboxDetail): Promise<MailSet | null> {
		const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
		const moveToFolderResult = inboxRule.results.find((result) => result.type === InboxRuleResultType.MOVE)?.value
		if (moveToFolderResult == null) {
			return null
		}
		return folders.getFolderById(elementIdPart(moveToFolderResult))
	}

	doesExcludeFromSpam(inboxRule: ExpandedInboxRule): boolean {
		return inboxRule.results.some((result) => result.type === InboxRuleResultType.EXCLUDE_SPAM)
	}
}

/**
 * Finds the first matching inbox rule for the mail and returns it.
 * export only for testing
 */
export async function _findMatchingRule(mailFacade: MailFacade, mail: Mail, rules: readonly ExpandedInboxRule[]): Promise<ExpandedInboxRule | null> {
	return asyncFind(rules, (rule) => checkInboxRule(mailFacade, mail, rule)).then((v) => v ?? null)
}

async function checkInboxRule(mailFacade: MailFacade, mail: Mail, inboxRule: ExpandedInboxRule): Promise<boolean> {
	for (const condition of inboxRule.conditions) {
		const ruleType = condition.type
		try {
			let matches: boolean

			if (ruleType === InboxRuleConditionType.FROM_EQUALS) {
				let mailAddresses = [mail.sender.address]

				if (mail.differentEnvelopeSender) {
					mailAddresses.push(mail.differentEnvelopeSender)
				}

				matches = !_checkEmailAddresses(mailAddresses, condition)
			} else if (ruleType === InboxRuleConditionType.RECIPIENT_TO_EQUALS) {
				const toRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.toRecipients
				matches = !_checkEmailAddresses(
					toRecipients.map((m) => m.address),
					condition,
				)
			} else if (ruleType === InboxRuleConditionType.RECIPIENT_CC_EQUALS) {
				const ccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.ccRecipients
				matches = _checkEmailAddresses(
					ccRecipients.map((m) => m.address),
					condition,
				)
			} else if (ruleType === InboxRuleConditionType.RECIPIENT_BCC_EQUALS) {
				const bccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.bccRecipients
				matches = _checkEmailAddresses(
					bccRecipients.map((m) => m.address),
					condition,
				)
			} else if (ruleType === InboxRuleConditionType.SUBJECT_CONTAINS) {
				matches = _checkContainsRule(mail.subject, condition)
			} else if (ruleType === InboxRuleConditionType.MAIL_HEADER_CONTAINS) {
				const details = await mailFacade.loadMailDetailsBlob(mail)
				if (details.headers != null) {
					matches = _checkContainsRule(getMailHeaders(details.headers), condition)
				} else {
					return false
				}
			} else {
				// no good way to handle unknown rules, so we bail
				console.warn("Unknown rule type: ", condition.type)
				return false
			}

			if (!matches) {
				return false
			}
		} catch (e) {
			console.error("Error processing inbox rule:", e.message)
			return false
		}
	}

	return !isEmpty(inboxRule.conditions)
}

function _checkContainsRule(value: string, condition: InboxRuleCondition): boolean {
	return (isRegularExpression(condition.value) && _matchesRegularExpression(value, condition)) || value.includes(condition.value)
}

/** export for test. */
export function _matchesRegularExpression(value: string, condition: InboxRuleCondition): boolean {
	if (isRegularExpression(condition.value)) {
		let flags = condition.value.replace(/.*\/([gimsuy]*)$/, "$1")
		let pattern = condition.value.replace(new RegExp("^/(.*?)/" + flags + "$"), "$1")
		let regExp = new RegExp(pattern, flags)
		return regExp.test(value)
	}

	return false
}

function _checkEmailAddresses(mailAddresses: string[], condition: InboxRuleCondition): boolean {
	const mailAddress = mailAddresses.find((mailAddress) => {
		let cleanMailAddress = mailAddress.toLowerCase().trim()

		if (isRegularExpression(condition.value)) {
			return _matchesRegularExpression(cleanMailAddress, condition)
		} else if (isDomainName(condition.value)) {
			let domain = cleanMailAddress.split("@")[1]
			return domain === condition.value
		} else {
			return cleanMailAddress === condition.value
		}
	})
	return mailAddress != null
}
