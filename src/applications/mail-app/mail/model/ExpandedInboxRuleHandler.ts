import { assertNotNull, asyncFind, isEmpty, promiseMap, splitInChunks } from "@tutao/utils"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { assertMainOrNode } from "@tutao/app-env"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { MailModel } from "./MailModel"
import { ExpandedInboxRule, Mail, MailSet, MailSetEntryTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { InboxRuleConditionType, InboxRuleResultType, MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION } from "../../../../entities/tutanota/Utils"
import { elementIdPart } from "@tutao/meta"
import { getMailHeaders } from "./MailUtils"
import { _checkContainsRuleCondition, _checkEmailAddresses, _shouldApplyRule, InboxRuleHandler } from "./InboxRuleHandler"
import { InboxRuleModel } from "./InboxRuleModel"
import { mailLocator } from "../../mailLocator"
import { resolveMailSetEntries } from "./MailSetListModel"
import { isOfflineError } from "@tutao/rest-client/error"
import Stream from "mithril/stream"

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
		const rules = await this.inboxRuleModel.getOrderedInboxRules()
		return await this.findMatchingInboxRuleForRules(mail, rules)
	}

	private async findMatchingInboxRuleForRules(mail: Readonly<Mail>, rules: Array<ExpandedInboxRule>): Promise<ExpandedInboxRule | null> {
		return await asyncFind(rules, (rule) => this.checkInboxRuleConditions(this.mailFacade, mail, rule.conditions as InboxRuleConditionTuple[]))
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

	async checkInboxRuleConditions(mailFacade: MailFacade, mail: Mail, conditions: readonly InboxRuleConditionTuple[]): Promise<boolean> {
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

	async reapplyRulesToAllMails(progress: Stream<number>, abort: AbortController, rules?: Array<ExpandedInboxRule>) {
		if (rules == null) {
			rules = await this.inboxRuleModel.getOrderedInboxRules()
		}

		if (isEmpty(rules)) {
			return 0
		}

		const userController = mailLocator.logins.getUserController()
		const folderSystem = assertNotNull(
			mailLocator.mailModel.getFolderSystemByGroupId(userController.getUserMailGroupMembership().group),
			"no folder system?",
		)
		const inbox = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX), "no inbox?")
		const mailboxDetails = await mailLocator.mailboxModel.getUserMailboxDetails()

		let totalProcessed = 0
		let totalMoved = 0

		try {
			const allIds = (await mailLocator.entityClient.loadAll(MailSetEntryTypeRef, inbox.entries)).reverse()
			const chunked = splitInChunks(MAX_NBR_OF_MAILS_SYNC_OPERATION, allIds)

			for (const chunk of chunked) {
				if (abort.signal.aborted) {
					break
				}

				const mails = await resolveMailSetEntries(
					chunk,
					(list, elements) => mailLocator.entityClient.loadMultiple(MailTypeRef, list, elements),
					mailLocator.mailModel,
				)

				// FIXME: do thing with mails
				const mailMails = mails.map((mail) => mail.mail)
				await this.applyRulesToGivenMails(mailMails, rules, mailboxDetails)

				totalProcessed += chunk.length
				progress((totalProcessed / allIds.length) * 100)
			}
		} catch (e) {
			if (!isOfflineError(e)) {
				throw e
			}
		}

		return totalMoved
	}

	async applyRulesToGivenMails(mails: Array<Mail>, rules: Array<ExpandedInboxRule>, mailboxDetail: MailboxDetail) {
		const mailsToActUpon: Array<{ mail: Mail; inboxRule: ExpandedInboxRule }> = []

		// FIXME: does this need to be a promiseMap?
		await promiseMap(mails, async (mail) => {
			if (mail.mailDetails == null) {
				// inbox rules do not work on drafts
				return
			}

			const rule = await this.findMatchingInboxRuleForRules(mail, rules)
			if (rule) {
				mailsToActUpon.push({ mail: mail, inboxRule: rule })
			}
		})

		await this.applyRules(mailsToActUpon, mailboxDetail)
	}

	// FIXME: maybe pass these in as streams and mutate in applyInboxRuleResults?
	private moveToFolderMap: Map<MailSet, Array<Mail>> = new Map()
	private mailsToMarkRead: Array<Mail> = []

	async applyRules(list: Array<{ mail: Mail; inboxRule: ExpandedInboxRule }>, mailboxDetail: MailboxDetail) {
		for (const item of list) {
			await this.applyInboxRuleResults(item.mail, item.inboxRule, mailboxDetail)
		}

		// FIXME: go through the action map/array and do it
	}

	async applyInboxRuleResults(mail: Mail, inboxRule: ExpandedInboxRule, mailboxDetail: MailboxDetail) {
		for (const result of inboxRule.results) {
			if (result.type === InboxRuleResultType.MOVE) {
				// handle move
				const targetFolder = await this.getMoveResultValue(inboxRule, mailboxDetail)
				if (targetFolder) {
					if (this.moveToFolderMap.has(targetFolder)) {
						this.moveToFolderMap.get(targetFolder)!.push(mail)
					} else {
						this.moveToFolderMap.set(targetFolder, [mail])
					}
				}
			}

			if (result.type === InboxRuleResultType.EXCLUDE_SPAM) {
				// handle
			}

			if (result.type === InboxRuleResultType.READ) {
				this.mailsToMarkRead.push(mail)
				// handle
			}

			if (result.type === InboxRuleResultType.LABEL) {
				// handle
			}
		}
	}
}
