import { ExpandedInboxRule, InboxRule, Mail, MailSet } from "@tutao/entities/tutanota"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { isDomainName, isRegularExpression } from "@tutao/utils"
import type { SelectorItemList } from "../../../../ui/base/DropDownSelector"
import { InboxRuleConditionType, InboxRuleResultType, MailSetKind, ProcessingState } from "../../../../entities/tutanota/Utils"
import { lang } from "../../../../ui/utils/LanguageViewModel"

/**
 * Refers to both a legacy and expanded inbox rule.
 */
export type SomeInboxRule = InboxRule | ExpandedInboxRule

export interface InboxRuleHandler<T extends SomeInboxRule = SomeInboxRule> {
	/**
	 * Checks the mail for an existing inbox rule and returns matching rule
	 * @returns The matching inbox rule
	 */
	findMatchingInboxRule(mail: Readonly<Mail>, sourceFolder: MailSet, ignoreProcessingState?: boolean): Promise<T | null>
	/** Get the move target folder of the inbox rule, if any */
	getMoveResultValue(inboxRule: T, mailboxDetail: MailboxDetail): Promise<MailSet | null>
	/** Get the inbox rule's labels to be applied, if any */
	getLabelResultValue(inboxRule: T, mailboxDetail: MailboxDetail): Promise<MailSet[]>
	/** Apply labels (if any) from the inbox rule to the mail */
	applyLabelResultAction(inboxRule: T, mailboxDetail: MailboxDetail, mail: Mail): Promise<void>
	/** Get whether or not the inbox rule marks emails as read */
	getReadResultValue(inboxRule: T): boolean
	/** Mark the mail as read if the inbox rule has a READ result */
	applyReadResultAction(inboxRule: T, mail: Mail): Promise<void>
	/** Get whether or not the inbox rule excludes emails from spam */
	getExcludeSpamResultValue(inboxRule: T): boolean
}

export function _shouldApplyRule(mail: Readonly<Mail>, sourceFolder: MailSet, ignoreProcessingState = false): boolean {
	if (sourceFolder.folderType !== MailSetKind.INBOX && sourceFolder.folderType !== MailSetKind.SPAM) {
		return false
	}

	const isUnprocessed =
		(mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED ||
			mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED_AND_DO_NOT_RUN_SPAM_PREDICTION) &&
		mail.processNeeded

	if (mail._errors || (!ignoreProcessingState && !isUnprocessed)) {
		return false
	}

	return true
}

export function _checkContainsRule(value: string, conditionValue: string): boolean {
	return (isRegularExpression(conditionValue) && _matchesRegularExpression(value, conditionValue)) || value.includes(conditionValue)
}

/** export for test. */
export function _matchesRegularExpression(value: string, conditionValue: string): boolean {
	if (isRegularExpression(conditionValue)) {
		let flags = conditionValue.replace(/.*\/([gimsuy]*)$/, "$1")
		let pattern = conditionValue.replace(new RegExp("^/(.*?)/" + flags + "$"), "$1")
		let regExp = new RegExp(pattern, flags)
		return regExp.test(value)
	}

	return false
}

export function _checkEmailAddresses(mailAddresses: string[], conditionValue: string): boolean {
	const mailAddress = mailAddresses.find((mailAddress) => {
		let cleanMailAddress = mailAddress.toLowerCase().trim()

		if (isRegularExpression(conditionValue)) {
			return _matchesRegularExpression(cleanMailAddress, conditionValue)
		} else if (isDomainName(conditionValue)) {
			let domain = cleanMailAddress.split("@")[1]
			return domain === conditionValue
		} else {
			return cleanMailAddress === conditionValue
		}
	})
	return mailAddress != null
}

export function getInboxRuleConditionTypeName(type: string): string {
	let typeNameMapping = getInboxRuleConditionTypeNameMapping().find((t) => t.value === type)
	return typeNameMapping != null ? typeNameMapping.name : ""
}

export function getInboxRuleConditionTypeNameMapping(): SelectorItemList<string> {
	return [
		{
			value: InboxRuleConditionType.FROM_EQUALS,
			name: lang.getTranslationText("inboxRuleSenderEquals_action"),
		},
		{
			value: InboxRuleConditionType.RECIPIENT_TO_EQUALS,
			name: lang.getTranslationText("inboxRuleToRecipientEquals_action"),
		},
		{
			value: InboxRuleConditionType.RECIPIENT_CC_EQUALS,
			name: lang.getTranslationText("inboxRuleCCRecipientEquals_action"),
		},
		{
			value: InboxRuleConditionType.RECIPIENT_BCC_EQUALS,
			name: lang.getTranslationText("inboxRuleBCCRecipientEquals_action"),
		},
		{
			value: InboxRuleConditionType.SUBJECT_CONTAINS,
			name: lang.getTranslationText("inboxRuleSubjectContains_action"),
		},
		{
			value: InboxRuleConditionType.MAIL_HEADER_CONTAINS,
			name: lang.getTranslationText("inboxRuleMailHeaderContains_action"),
		},
		// TODO: need to add HAS_ATTACHMENT
	]
}

export function getInboxRuleResultTypeNameMapping(): SelectorItemList<string> {
	return [
		{
			value: InboxRuleResultType.MOVE,
			name: lang.getTranslationText("inboxRuleTargetFolder_label"),
		},
		{
			value: InboxRuleResultType.EXCLUDE_SPAM,
			name: lang.getTranslationText("inboxRuleExcludedFromSpamFilter_msg"),
		},
	]
}
