import { asyncFind, isEmpty } from "@tutao/utils"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { assertMainOrNode } from "@tutao/app-env"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { MailModel } from "./MailModel"
import { ExpandedInboxRule, Mail, MailSet } from "@tutao/entities/tutanota"
import { InboxRuleConditionType, InboxRuleResultType } from "../../../../entities/tutanota/Utils"
import { elementIdPart } from "@tutao/meta"
import { getMailHeaders } from "./MailUtils"
import { _checkContainsRuleCondition, _checkEmailAddresses, _shouldApplyRule, InboxRuleHandler } from "./InboxRuleHandler"
import { InboxRuleModel } from "./InboxRuleModel"

assertMainOrNode()

interface InboxRuleConditionTuple {
	type: InboxRuleConditionType
	value: string
}

export class ExpandedInboxRuleHandler implements InboxRuleHandler<ExpandedInboxRule> {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly logins: LoginController,
		private readonly mailModel: MailModel,
		private readonly inboxRuleModel: InboxRuleModel,
	) {}

	async findMatchingInboxRule(mail: Readonly<Mail>, sourceFolder: MailSet, ignoreProcessingState = false): Promise<ExpandedInboxRule | null> {
		if (!this.logins.getUserController().isPaidAccount() || !_shouldApplyRule(mail, sourceFolder, ignoreProcessingState)) {
			return null
		}
		return await _findMatchingRule(this.mailFacade, mail, await this.inboxRuleModel.getOrderedInboxRules())
	}

	async getMoveResultValue(inboxRule: ExpandedInboxRule, mailboxDetail: MailboxDetail): Promise<MailSet | null> {
		const moveToFolderResult = inboxRule.results.find((result) => result.type === InboxRuleResultType.MOVE)?.value
		if (moveToFolderResult == null) {
			return null
		}

		const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
		return folders.getFolderById(elementIdPart(moveToFolderResult))
	}

	async getLabelResultValue(inboxRule: ExpandedInboxRule, mailboxDetail: MailboxDetail): Promise<MailSet[]> {
		// FIXME implement
		return []
	}

	getReadResultValue(inboxRule: ExpandedInboxRule): boolean {
		return inboxRule.results.some((result) => result.type === InboxRuleResultType.READ)
	}

	getExcludeSpamResultValue(inboxRule: ExpandedInboxRule): boolean {
		return inboxRule.results.some((result) => result.type === InboxRuleResultType.EXCLUDE_SPAM)
	}
}

/**
 * Finds the first matching inbox rule for the mail and returns it.
 * export only for testing
 */
export async function _findMatchingRule(mailFacade: MailFacade, mail: Mail, rules: readonly ExpandedInboxRule[]): Promise<ExpandedInboxRule | null> {
	return await asyncFind(rules, (rule) => checkInboxRuleConditions(mailFacade, mail, rule.conditions as InboxRuleConditionTuple[]))
}

async function checkInboxRuleConditions(mailFacade: MailFacade, mail: Mail, conditions: readonly InboxRuleConditionTuple[]): Promise<boolean> {
	for (const { type, value } of conditions) {
		try {
			let matches: boolean

			if (type === InboxRuleConditionType.FROM_EQUALS) {
				let mailAddresses = [mail.sender.address]

				if (mail.differentEnvelopeSender) {
					mailAddresses.push(mail.differentEnvelopeSender)
				}

				matches = _checkEmailAddresses(mailAddresses, value)
			} else if (type === InboxRuleConditionType.RECIPIENT_TO_EQUALS) {
				const toRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.toRecipients
				matches = _checkEmailAddresses(
					toRecipients.map((m) => m.address),
					value,
				)
			} else if (type === InboxRuleConditionType.RECIPIENT_CC_EQUALS) {
				const ccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.ccRecipients
				matches = _checkEmailAddresses(
					ccRecipients.map((m) => m.address),
					value,
				)
			} else if (type === InboxRuleConditionType.RECIPIENT_BCC_EQUALS) {
				const bccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.bccRecipients
				matches = _checkEmailAddresses(
					bccRecipients.map((m) => m.address),
					value,
				)
			} else if (type === InboxRuleConditionType.SUBJECT_CONTAINS) {
				matches = _checkContainsRuleCondition(mail.subject, value)
			} else if (type === InboxRuleConditionType.MAIL_HEADER_CONTAINS) {
				const details = await mailFacade.loadMailDetailsBlob(mail)
				if (details.headers != null) {
					matches = _checkContainsRuleCondition(getMailHeaders(details.headers), value)
				} else {
					return false
				}
			} else {
				// no good way to handle unknown conditions, so we bail
				console.warn("Unknown condition type: ", type)
				return false
			}

			if (!matches) {
				return false
			}
		} catch (e) {
			console.error("Error processing inbox rule condition:", e.message)
			return false
		}
	}

	return !isEmpty(conditions)
}
