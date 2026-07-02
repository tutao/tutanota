import { asyncFind } from "../../../../platform-kit/utils"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { assertMainOrNode } from "../../../../platform-kit/app-env"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { getMailHeaders } from "./MailUtils.js"
import { MailModel } from "./MailModel"
import { InboxRule, Mail, MailSet } from "@tutao/entities/tutanota"
import { InboxRuleConditionType } from "../../../../entities/tutanota/Utils"
import { elementIdPart } from "../../../../platform-kit/meta"
import { _checkContainsRule, _checkEmailAddresses, _shouldApplyRule, InboxRuleHandler } from "./InboxRuleHandler"

assertMainOrNode()

export class LegacyInboxRuleHandler implements InboxRuleHandler<InboxRule> {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly logins: LoginController,
		private readonly mailModel: MailModel,
	) {}

	async findMatchingInboxRule(mail: Readonly<Mail>, sourceFolder: MailSet, ignoreProcessingState = false): Promise<InboxRule | null> {
		if (!this.logins.getUserController().isPaidAccount() || !_shouldApplyRule(mail, sourceFolder, ignoreProcessingState)) {
			return null
		}
		return await _findMatchingRule(this.mailFacade, mail, this.logins.getUserController().props.inboxRules)
	}

	async getMoveResultValue(inboxRule: InboxRule, mailboxDetail: MailboxDetail): Promise<MailSet | null> {
		const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
		return folders.getFolderById(elementIdPart(inboxRule.targetFolder))
	}

	getExcludeSpamResultValue(inboxRule: InboxRule): boolean {
		return inboxRule.excludeFromSpamFilter ?? false
	}

	async getLabelResultValue(_inboxRule: InboxRule, _mailboxDetail: MailboxDetail): Promise<MailSet[]> {
		return []
	}

	async applyLabelResultAction(_inboxRule: InboxRule, _mailboxDetail: MailboxDetail, _mail: Mail): Promise<void> {
		// no-op
	}

	getReadResultValue(_inboxRule: InboxRule): boolean {
		return false
	}

	async applyReadResultAction(_inboxRule: InboxRule, _mail: Mail): Promise<void> {
		// no-op
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
	const ruleValue = inboxRule.value

	try {
		if (ruleType === InboxRuleConditionType.FROM_EQUALS) {
			let mailAddresses = [mail.sender.address]

			if (mail.differentEnvelopeSender) {
				mailAddresses.push(mail.differentEnvelopeSender)
			}

			return _checkEmailAddresses(mailAddresses, ruleValue)
		} else if (ruleType === InboxRuleConditionType.RECIPIENT_TO_EQUALS) {
			const toRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.toRecipients
			return _checkEmailAddresses(
				toRecipients.map((m) => m.address),
				ruleValue,
			)
		} else if (ruleType === InboxRuleConditionType.RECIPIENT_CC_EQUALS) {
			const ccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.ccRecipients
			return _checkEmailAddresses(
				ccRecipients.map((m) => m.address),
				ruleValue,
			)
		} else if (ruleType === InboxRuleConditionType.RECIPIENT_BCC_EQUALS) {
			const bccRecipients = (await mailFacade.loadMailDetailsBlob(mail)).recipients.bccRecipients
			return _checkEmailAddresses(
				bccRecipients.map((m) => m.address),
				ruleValue,
			)
		} else if (ruleType === InboxRuleConditionType.SUBJECT_CONTAINS) {
			return _checkContainsRule(mail.subject, ruleValue)
		} else if (ruleType === InboxRuleConditionType.MAIL_HEADER_CONTAINS) {
			const details = await mailFacade.loadMailDetailsBlob(mail)
			if (details.headers != null) {
				return _checkContainsRule(getMailHeaders(details.headers), ruleValue)
			} else {
				return false
			}
		} else {
			console.warn("Unknown rule type: ", ruleType)
			return false
		}
	} catch (e) {
		console.error("Error processing inbox rule:", e.message)
		return false
	}
}
