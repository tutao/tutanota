import { assertNotNull, asyncFind, isEmpty, promiseMap, splitInChunks } from "@tutao/utils"
import type { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel.js"
import { assertMainOrNode, ProgrammingError } from "@tutao/app-env"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { MailModel, MoveMode } from "./MailModel"
import { ExpandedInboxRule, Mail, MailSet, MailSetEntryTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { InboxRuleConditionType, InboxRuleResultType, MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION } from "../../../../entities/tutanota/Utils"
import { elementIdPart, getElementId } from "@tutao/meta"
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
		return await asyncFind(rules, (rule) => this.checkInboxRuleConditions(mail, rule.conditions as InboxRuleConditionTuple[]))
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

	private async checkInboxRuleConditions(mail: Mail, conditions: readonly InboxRuleConditionTuple[]): Promise<boolean> {
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
					const toRecipients = (await this.mailFacade.loadMailDetailsBlob(mail)).recipients.toRecipients
					matches = _checkEmailAddresses(
						toRecipients.map((m) => m.address),
						value,
					)
				} else if (type === InboxRuleConditionType.RECIPIENT_CC_EQUALS) {
					const ccRecipients = (await this.mailFacade.loadMailDetailsBlob(mail)).recipients.ccRecipients
					matches = _checkEmailAddresses(
						ccRecipients.map((m) => m.address),
						value,
					)
				} else if (type === InboxRuleConditionType.RECIPIENT_BCC_EQUALS) {
					const bccRecipients = (await this.mailFacade.loadMailDetailsBlob(mail)).recipients.bccRecipients
					matches = _checkEmailAddresses(
						bccRecipients.map((m) => m.address),
						value,
					)
				} else if (type === InboxRuleConditionType.RECIPIENT_ANY_EQUALS) {
					const { toRecipients, ccRecipients, bccRecipients } = (await this.mailFacade.loadMailDetailsBlob(mail)).recipients
					const addresses = [...toRecipients, ...ccRecipients, ...bccRecipients].map((r) => r.address)
					matches = _checkEmailAddresses(addresses, value)
				} else if (type === InboxRuleConditionType.SUBJECT_CONTAINS) {
					matches = _checkContainsRuleCondition(mail.subject, value)
				} else if (type === InboxRuleConditionType.MAIL_HEADER_CONTAINS) {
					const details = await this.mailFacade.loadMailDetailsBlob(mail)
					if (details.headers != null) {
						matches = _checkContainsRuleCondition(getMailHeaders(details.headers), value)
					} else {
						return false
					}
				} else if (type === InboxRuleConditionType.HAS_ATTACHMENT) {
					// this does not care about inline attachments
					matches = !isEmpty(mail.attachments)
				} else if (type === InboxRuleConditionType.HAS_NO_ATTACHMENT) {
					// this does not care about inline attachments
					matches = isEmpty(mail.attachments)
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

	async applyRulesToAllMails(progress: Stream<number>, abort: AbortController, rules?: Array<ExpandedInboxRule>): Promise<number> {
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
		let totalMailsAffected = 0

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

				const mailMails = mails.map((mail) => mail.mail)
				totalMailsAffected += await this.applyRulesToGivenMails(mailMails, mailboxDetails, rules)

				totalProcessed += mails.length
				progress((totalProcessed / allIds.length) * 100)
			}
		} catch (e) {
			if (!isOfflineError(e)) {
				throw e
			}
		}

		return totalMailsAffected
	}

	async applyRulesToGivenMails(mails: Array<Mail>, mailboxDetail: MailboxDetail, rules?: Array<ExpandedInboxRule> | null): Promise<number> {
		if (rules == null) {
			rules = await this.inboxRuleModel.getOrderedInboxRules()
		}

		const mailsToActUpon: Array<{ mail: Mail; inboxRule: ExpandedInboxRule }> = []

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
		return mailsToActUpon.length
	}

	// The excludeMove option is because ProcessInboxHandler handles the move along with the spam classifier, but other inbox rule results need to be handled
	async applyRules(list: Array<{ mail: Mail; inboxRule: ExpandedInboxRule }>, mailboxDetail: MailboxDetail, excludeMove: boolean = false) {
		const moveToFolderMap: Map<Id, { mailIds: IdTuple[]; mailSet: MailSet }> = new Map()
		const mailsToMarkRead: Array<IdTuple> = []

		for (const item of list) {
			await this.gatherInboxRuleResults(item.mail, item.inboxRule, mailboxDetail, moveToFolderMap, mailsToMarkRead)
		}

		// Apply moves
		if (!excludeMove && moveToFolderMap.size > 0) {
			for (const { mailIds, mailSet } of moveToFolderMap.values()) {
				await this.mailModel.moveMails(mailIds, mailSet, MoveMode.Mails)
			}
		}

		// Apply reads
		if (mailsToMarkRead.length > 0) {
			await this.mailModel.markMails(mailsToMarkRead, false)
		}
	}

	async gatherInboxRuleResults(
		mail: Mail,
		inboxRule: ExpandedInboxRule,
		mailboxDetail: MailboxDetail,
		moveToFolderMap: Map<Id, { mailIds: IdTuple[]; mailSet: MailSet }>,
		mailsToMarkRead: Array<IdTuple>,
	) {
		for (const result of inboxRule.results) {
			switch (result.type) {
				case InboxRuleResultType.MOVE: {
					const targetFolder = await this.getMoveResultValue(inboxRule, mailboxDetail)
					if (targetFolder) {
						const targetFolderId = getElementId(targetFolder)
						if (moveToFolderMap.has(targetFolderId)) {
							moveToFolderMap.get(targetFolderId)!.mailIds.push(mail._id)
						} else {
							moveToFolderMap.set(targetFolderId, { mailIds: [mail._id], mailSet: targetFolder })
						}
					}
					break
				}
				case InboxRuleResultType.READ:
					mailsToMarkRead.push(mail._id)
					break
				case InboxRuleResultType.LABEL:
					throw new ProgrammingError("not implemented")
				case InboxRuleResultType.EXCLUDE_SPAM:
					// Exclude spam does not need to be handled here. It only is checked in conjunction with SpamClassifier in ProcessInboxHandler
					break
			}
		}
	}
}
