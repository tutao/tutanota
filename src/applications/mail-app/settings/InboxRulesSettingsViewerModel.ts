import { ExpandedInboxRule, ExpandedInboxRuleTypeRef, MailboxPropertiesTypeRef } from "@tutao/entities/tutanota"
import { elementIdToId, getElementId, isSameId, OperationType } from "@tutao/meta"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { assertNotNull, isNotNull, lazyAsync } from "@tutao/utils"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { InboxRuleModel } from "../mail/model/InboxRuleModel"
import type { MailboxDetail, MailboxModel } from "../../common/mailFunctionality/MailboxModel"
import { IdTupleWrapper } from "@tutao/entities/sys"

interface MailboxInboxRules {
	readonly mailboxDetail: MailboxDetail
	inboxRulesById: Map<Id, ExpandedInboxRule>
	inboxRulesOrder: IdTupleWrapper[]
	orderedInboxRules: ExpandedInboxRule[]
}

export class InboxRulesSettingsViewerModel {
	private readonly mailboxes: Map<Id, MailboxInboxRules> = new Map()

	constructor(
		private readonly entityClient: EntityClient,
		private readonly inboxRuleModel: lazyAsync<InboxRuleModel>,
		private readonly mailboxModel: MailboxModel,
	) {}

	async init(): Promise<void> {
		const inboxRuleModel = await this.inboxRuleModel()
		if (inboxRuleModel.isUsingLegacyInboxRules()) {
			return
		}

		const mailboxDetails = await this.mailboxModel.getMailboxDetails()
		const mailboxes = await Promise.all(
			mailboxDetails.map(async (mailboxDetail): Promise<MailboxInboxRules> => {
				const [inboxRulesById, inboxRulesOrder] = await Promise.all([
					inboxRuleModel.getInboxRulesMap(mailboxDetail),
					inboxRuleModel.getInboxRuleOrder(mailboxDetail),
				])
				const mailbox = { mailboxDetail, inboxRulesById, inboxRulesOrder, orderedInboxRules: [] }
				this.computeOrderedInboxRules(mailbox)
				return mailbox
			}),
		)
		this.mailboxes.clear()
		for (const mailbox of mailboxes) {
			this.mailboxes.set(elementIdToId(mailbox.mailboxDetail.mailGroup._id), mailbox)
		}
	}

	private computeOrderedInboxRules(mailbox: MailboxInboxRules) {
		mailbox.orderedInboxRules = mailbox.inboxRulesOrder.map(({ listElementId }) => mailbox.inboxRulesById.get(listElementId) ?? null).filter(isNotNull)
	}

	get mailboxDetails(): MailboxDetail[] {
		return Array.from(this.mailboxes.values(), (mailbox) => mailbox.mailboxDetail)
	}

	getOrderedInboxRules(mailboxDetail: MailboxDetail): ExpandedInboxRule[] {
		return assertNotNull(this.mailboxes.get(elementIdToId(mailboxDetail.mailGroup._id)), "inbox rules for mailbox are not loaded").orderedInboxRules
	}

	async onEntityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		const mailbox = this.mailboxes.get(eventOwnerGroupId)
		if (mailbox === undefined) {
			return
		}

		for (const update of updates) {
			if (isUpdateForTypeRef(ExpandedInboxRuleTypeRef, update)) {
				if (update.operation === OperationType.DELETE) {
					mailbox.inboxRulesById.delete(update.instanceId)
					continue
				}

				const updatedRule = await this.entityClient.load(ExpandedInboxRuleTypeRef, [assertNotNull(update.instanceListId), update.instanceId])
				mailbox.inboxRulesById.set(getElementId(updatedRule), updatedRule)

				if (update.operation === OperationType.UPDATE) {
					const ruleIndex = mailbox.orderedInboxRules.findIndex((rule) => isSameId(updatedRule._id, rule._id))
					if (ruleIndex !== -1) {
						mailbox.orderedInboxRules[ruleIndex] = updatedRule
					}
				}
			} else if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update)) {
				const mailboxProperties = await this.entityClient.load(MailboxPropertiesTypeRef, [null, update.instanceId])
				mailbox.inboxRulesOrder = mailboxProperties.inboxRuleOrder
				this.computeOrderedInboxRules(mailbox)
			}
		}
	}

	private async saveInboxRuleOrder(mailbox: MailboxInboxRules) {
		await (await this.inboxRuleModel()).updateInboxRuleOrder(mailbox.orderedInboxRules, mailbox.mailboxDetail)
	}

	async saveInboxRule(rule: ExpandedInboxRule) {
		await (await this.inboxRuleModel()).updateInboxRule(rule)
	}

	async deleteInboxRule(rule: ExpandedInboxRule) {
		await (await this.inboxRuleModel()).deleteInboxRule(rule)
	}

	async moveRuleToFirst(mailboxDetail: MailboxDetail, rule: ExpandedInboxRule, index: number) {
		const mailbox = assertNotNull(this.mailboxes.get(elementIdToId(mailboxDetail.mailGroup._id)), "inbox rules for mailbox are not loaded")
		mailbox.orderedInboxRules.splice(index, 1)
		mailbox.orderedInboxRules.unshift(rule)
		await this.saveInboxRuleOrder(mailbox)
	}

	async moveRuleUp(mailboxDetail: MailboxDetail, rule: ExpandedInboxRule, index: number) {
		const mailbox = assertNotNull(this.mailboxes.get(elementIdToId(mailboxDetail.mailGroup._id)), "inbox rules for mailbox are not loaded")
		const prev = mailbox.orderedInboxRules[index - 1]
		mailbox.orderedInboxRules[index - 1] = rule
		mailbox.orderedInboxRules[index] = prev
		await this.saveInboxRuleOrder(mailbox)
	}

	async moveRuleDown(mailboxDetail: MailboxDetail, rule: ExpandedInboxRule, index: number) {
		const mailbox = assertNotNull(this.mailboxes.get(elementIdToId(mailboxDetail.mailGroup._id)), "inbox rules for mailbox are not loaded")
		const next = mailbox.orderedInboxRules[index + 1]
		mailbox.orderedInboxRules[index + 1] = rule
		mailbox.orderedInboxRules[index] = next
		await this.saveInboxRuleOrder(mailbox)
	}

	async moveRuleToLast(mailboxDetail: MailboxDetail, rule: ExpandedInboxRule, index: number) {
		const mailbox = assertNotNull(this.mailboxes.get(elementIdToId(mailboxDetail.mailGroup._id)), "inbox rules for mailbox are not loaded")
		mailbox.orderedInboxRules.splice(index, 1)
		mailbox.orderedInboxRules.push(rule)
		await this.saveInboxRuleOrder(mailbox)
	}

	async moveRuleToIndex(mailboxDetail: MailboxDetail, rule: ExpandedInboxRule, currentIndex: number, insertAtIndex: number) {
		if (currentIndex === insertAtIndex || currentIndex + 1 === insertAtIndex) return

		const mailbox = assertNotNull(this.mailboxes.get(elementIdToId(mailboxDetail.mailGroup._id)), "inbox rules for mailbox are not loaded")
		mailbox.orderedInboxRules.splice(insertAtIndex, 0, rule)
		mailbox.orderedInboxRules.splice(currentIndex > insertAtIndex ? currentIndex + 1 : currentIndex, 1)
		await this.saveInboxRuleOrder(mailbox)
	}
}
