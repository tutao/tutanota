import { InboxRule, Mail, MailSet } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { InboxRuleType, MailSetKind, ProcessingState } from "../../../common/api/common/TutanotaConstants"
import { isDomainName, isRegularExpression } from "../../../common/misc/FormatValidator"
import { assertNotNull, asyncFind, Nullable } from "@tutao/tutanota-utils"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import type { SelectorItemList } from "../../../common/gui/base/DropDownSelector.js"
import { elementIdPart } from "../../../common/api/common/utils/EntityUtils"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { getMailHeaders } from "./MailUtils.js"
import { MailModel } from "./MailModel"
import { UnencryptedProcessInboxDatum } from "./ProcessInboxHandler"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { CURRENT_SPACE_FOR_SERVER_RESULT } from "../../workerUtils/spamClassification/SpamClassifier"

assertMainOrNode()

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
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly logins: LoginController,
		private readonly mailModel: MailModel,
	) {}

	async findAndApplyRulesExcludedFromSpamFilter(
		mailboxDetail: MailboxDetail,
		mail: Readonly<Mail>,
		sourceFolder: MailSet,
		ignoreProcessingState = false,
	): Promise<Nullable<{ targetFolder: MailSet; processInboxDatum: UnencryptedProcessInboxDatum }>> {
		if (sourceFolder.folderType !== MailSetKind.INBOX && sourceFolder.folderType !== MailSetKind.SPAM) {
			return null
		}
		return this.findAndApplyMatchingRule(mailboxDetail, mail, true, ignoreProcessingState)
	}

	async findAndApplyRulesNotExcludedFromSpamFilter(
		mailboxDetail: MailboxDetail,
		mail: Readonly<Mail>,
		sourceFolder: MailSet,
		ignoreProcessingState = false,
	): Promise<Nullable<{ targetFolder: MailSet; processInboxDatum: UnencryptedProcessInboxDatum }>> {
		if (sourceFolder.folderType !== MailSetKind.INBOX && sourceFolder.folderType !== MailSetKind.SPAM) {
			return null
		}
		return this.findAndApplyMatchingRule(mailboxDetail, mail, false, ignoreProcessingState)
	}

	/**
	 * Checks the mail for an existing inbox rule and moves the mail to the target folder of the rule.
	 * @returns true if a rule matches otherwise false
	 */
	private async findAndApplyMatchingRule(
		mailboxDetail: MailboxDetail,
		mail: Readonly<Mail>,
		checkRulesExcludedFromSpamFilter: boolean = false,
		ignoreProcessingState = false,
	): Promise<Nullable<{ targetFolder: MailSet; processInboxDatum: UnencryptedProcessInboxDatum }>> {
		const shouldApply =
			(mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED ||
				mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED_AND_DO_NOT_RUN_SPAM_PREDICTION) &&
			mail.processNeeded

		if (mail._errors || !this.logins.getUserController().isPaidAccount() || (!ignoreProcessingState && !shouldApply)) {
			return null
		}

		const allInboxRules = this.logins.getUserController().props.inboxRules
		const applicableInboxRules: InboxRule[] = allInboxRules.filter((rule) => !!rule.excludeFromSpamFilter === checkRulesExcludedFromSpamFilter)
		const inboxRule = await _findMatchingRule(this.mailFacade, mail, applicableInboxRules)

		const mailDetails = await this.mailFacade.loadMailDetailsBlob(mail)
		if (inboxRule) {
			const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
			const targetFolder = folders.getFolderById(elementIdPart(inboxRule.targetFolder))

			if (targetFolder) {
				const currentFolder = assertNotNull(folders.getFolderByMail(mail))
				const { vectorToUpload } = await this.mailFacade.createModelInputAndUploadVector(
					CURRENT_SPACE_FOR_SERVER_RESULT,
					mail,
					mailDetails,
					currentFolder,
				)
				const processInboxDatum: UnencryptedProcessInboxDatum = {
					mailId: mail._id,
					targetMoveFolder: targetFolder._id,
					classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
					vector: vectorToUpload,
				}
				return { targetFolder, processInboxDatum }
			} else {
				// target folder of inbox rule was deleted
				return null
			}
		} else {
			// no inbox rule applies to the mail
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
