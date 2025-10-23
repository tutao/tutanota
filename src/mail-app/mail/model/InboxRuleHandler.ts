import { createMoveMailData, InboxRule, Mail, MailFolder, MoveMailData } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { FeatureType, InboxRuleType, MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION, ProcessingState } from "../../../common/api/common/TutanotaConstants"
import { isDomainName, isRegularExpression } from "../../../common/misc/FormatValidator"
import { assertNotNull, asyncFind, debounce, ofClass, promiseMap, splitInChunks, throttleStart } from "@tutao/tutanota-utils"
import { lang } from "../../../common/misc/LanguageViewModel"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { LockedError, PreconditionFailedError } from "../../../common/api/common/error/RestError"
import type { SelectorItemList } from "../../../common/gui/base/DropDownSelector.js"
import { elementIdPart, isSameId } from "../../../common/api/common/utils/EntityUtils"
import { assertMainOrNode, isWebClient } from "../../../common/api/common/Env"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { getMailHeaders } from "./MailUtils.js"
import { MailModel } from "./MailModel"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"

assertMainOrNode()

const moveMailDataPerFolder: MoveMailData[] = []
let noRuleMatchMailIds: IdTuple[] = []

const THROTTLE_MOVE_MAIL_SERVICE_REQUESTS_MS = 200
const DEBOUNCE_CLIENT_CLASSIFIER_RESULT_SERVICE_REQUESTS_MS = 1000

async function sendMoveMailRequest(mailFacade: MailFacade): Promise<void> {
	if (moveMailDataPerFolder.length) {
		const moveToTargetFolder = assertNotNull(moveMailDataPerFolder.shift())
		const mailChunks = splitInChunks(MAX_NBR_OF_MAILS_SYNC_OPERATION, moveToTargetFolder.mails)
		await promiseMap(mailChunks, (mailChunk) => {
			moveToTargetFolder.mails = mailChunk
			return mailFacade.moveMails(mailChunk, moveToTargetFolder.targetFolder, null, ClientClassifierType.CUSTOMER_INBOX_RULES)
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
				return processMatchingRules(mailFacade)
			})
	}
}

const processMatchingRules = throttleStart(THROTTLE_MOVE_MAIL_SERVICE_REQUESTS_MS, async (mailFacade: MailFacade) => {
	// Each target folder requires one request,
	// We debounce the requests to a rate of THROTTLE_MOVE_MAIL_SERVICE_REQUESTS_MS
	return sendMoveMailRequest(mailFacade)
})

const processNotMatchingRules = debounce(
	DEBOUNCE_CLIENT_CLASSIFIER_RESULT_SERVICE_REQUESTS_MS,
	async (mailFacade: MailFacade, processingState: ProcessingState) => {
		// Each update to ClientClassifierResultService (for mails that did not move) requires one request
		// We debounce the requests to a rate of DEBOUNCE_CLIENT_CLASSIFIER_RESULT_SERVICE_REQUESTS_MS
		if (noRuleMatchMailIds.length) {
			const mailIds = noRuleMatchMailIds
			noRuleMatchMailIds = []
			return mailFacade.updateMailPredictionState(mailIds, processingState)
		}
	},
)

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

	/**
	 * Checks the mail for an existing inbox rule and moves the mail to the target folder of the rule.
	 * @returns true if a rule matches otherwise false
	 */
	async findAndApplyMatchingRule(mailboxDetail: MailboxDetail, mail: Readonly<Mail>, applyRulesOnServer: boolean): Promise<MailFolder | null> {
		const shouldApply =
			mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED ||
			mail.processingState === ProcessingState.INBOX_RULE_NOT_PROCESSED_AND_DO_NOT_RUN_SPAM_PREDICTION

		if (
			mail._errors ||
			!shouldApply ||
			!(await isInboxFolder(this.mailModel, mailboxDetail, mail)) ||
			!this.logins.getUserController().isPaidAccount() ||
			mailboxDetail.mailbox.folders == null
		) {
			return null
		}

		const inboxRule = await _findMatchingRule(this.mailFacade, mail, this.logins.getUserController().props.inboxRules)
		if (inboxRule) {
			const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.folders._id)
			const targetFolder = folders.getFolderById(elementIdPart(inboxRule.targetFolder))

			if (targetFolder && targetFolder.folderType !== MailSetKind.INBOX) {
				if (applyRulesOnServer) {
					let moveMailData = moveMailDataPerFolder.find((folderMoveMailData) => isSameId(folderMoveMailData.targetFolder, inboxRule.targetFolder))

					if (moveMailData) {
						moveMailData.mails.push(mail._id)
					} else {
						moveMailData = createMoveMailData({
							targetFolder: inboxRule.targetFolder,
							mails: [mail._id],
							excludeMailSet: null,
							moveReason: ClientClassifierType.CUSTOMER_INBOX_RULES,
						})
						moveMailDataPerFolder.push(moveMailData)
					}
				}

				processMatchingRules(this.mailFacade)

				return targetFolder
			} else {
				return null
			}
		} else {
			// if we are not on the webapp but the spam classification feature is enabled,
			// the request is sent in the SpamClassificationHandler
			await this.logins.loadCustomizations()
			const isSpamClassificationFeatureEnabled = this.logins.isEnabled(FeatureType.SpamClientClassification)
			if (isWebClient() || !isSpamClassificationFeatureEnabled) {
				// we set the processing state to a final state in case the feature is not enabled,
				// to not re-classify when the feature gets enabled for the user
				const processingState = !isSpamClassificationFeatureEnabled
					? ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_MADE
					: ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_PENDING
				noRuleMatchMailIds.push(mail._id)
				processNotMatchingRules(this.mailFacade, processingState)
			}

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

async function isInboxFolder(mailModel: MailModel, mailboxDetail: MailboxDetail, mail: Mail): Promise<boolean> {
	const folders = await mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id)
	const mailFolder = folders.getFolderByMail(mail)
	return mailFolder?.folderType === MailSetKind.INBOX
}
