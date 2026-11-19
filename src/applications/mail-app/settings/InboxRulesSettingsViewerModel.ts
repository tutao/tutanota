import { ExpandedInboxRule, ExpandedInboxRuleTypeRef, MailboxGroupRoot, MailboxPropertiesTypeRef } from "@tutao/entities/tutanota"
import { elementIdToId, getElementId, isSameId, OperationType } from "@tutao/meta"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { assertNotNull, isNotNull, lazyAsync, promiseMap } from "@tutao/utils"
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
		const mailboxInboxRules = await promiseMap(mailboxDetails, async (mailboxDetail) => {
			const [inboxRulesById, inboxRulesOrder] = await Promise.all([
				inboxRuleModel.getInboxRulesMap(mailboxDetail.mailboxGroupRoot),
				inboxRuleModel.getInboxRuleOrder(mailboxDetail.mailboxGroupRoot),
			])
			const mailboxInboxRules = { mailboxDetail, inboxRulesById, inboxRulesOrder, orderedInboxRules: [] }
			this.computeOrderedInboxRules(mailboxInboxRules)
			return mailboxInboxRules
		})
		this.mailboxes.clear()
		for (const mailbox of mailboxInboxRules) {
			this.mailboxes.set(elementIdToId(mailbox.mailboxDetail.mailboxGroupRoot._id), mailbox)
		}
	}

	private computeOrderedInboxRules(mailbox: MailboxInboxRules) {
		mailbox.orderedInboxRules = mailbox.inboxRulesOrder.map(({ listElementId }) => mailbox.inboxRulesById.get(listElementId) ?? null).filter(isNotNull)
	}

	get mailboxDetails(): MailboxDetail[] {
		return Array.from(this.mailboxes.values(), (mailbox) => mailbox.mailboxDetail)
	}

	getOrderedInboxRules(mailboxGroupRoot: MailboxGroupRoot): ExpandedInboxRule[] {
		return this.mailboxes.get(elementIdToId(mailboxGroupRoot._id))?.orderedInboxRules ?? []
	}

	async onEntityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ExpandedInboxRuleTypeRef, update)) {
				const mailbox = this.mailboxes.get(eventOwnerGroupId)
				if (mailbox === undefined) {
					return
				}
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
				const mailbox = this.mailboxes.get(eventOwnerGroupId)
				if (mailbox === undefined) {
					return
				}
				const mailboxProperties = await this.entityClient.load(MailboxPropertiesTypeRef, [null, update.instanceId])
				mailbox.inboxRulesOrder = mailboxProperties.inboxRuleOrder
				this.computeOrderedInboxRules(mailbox)
			}
		}
	}

	private async saveInboxRuleOrder(mailbox: MailboxInboxRules) {
		await (await this.inboxRuleModel()).updateInboxRuleOrder(mailbox.orderedInboxRules, mailbox.mailboxDetail.mailboxGroupRoot)
	}

	async saveInboxRule(rule: ExpandedInboxRule) {
		await (await this.inboxRuleModel()).updateInboxRule(rule)
	}

	async deleteInboxRule(rule: ExpandedInboxRule) {
		await (await this.inboxRuleModel()).deleteInboxRule(rule)
	}

	async moveRuleToFirst(mailboxGroupRoot: MailboxGroupRoot, rule: ExpandedInboxRule, index: number) {
		const mailbox = this.mailboxes.get(elementIdToId(mailboxGroupRoot._id))
		if (mailbox) {
			mailbox.orderedInboxRules.splice(index, 1)
			mailbox.orderedInboxRules.unshift(rule)
			await this.saveInboxRuleOrder(mailbox)
		}
	}

	async moveRuleUp(mailboxGroupRoot: MailboxGroupRoot, rule: ExpandedInboxRule, index: number) {
		const mailbox = this.mailboxes.get(elementIdToId(mailboxGroupRoot._id))
		if (mailbox) {
			const prev = mailbox.orderedInboxRules[index - 1]
			mailbox.orderedInboxRules[index - 1] = rule
			mailbox.orderedInboxRules[index] = prev
			await this.saveInboxRuleOrder(mailbox)
		}
	}

	async moveRuleDown(mailboxGroupRoot: MailboxGroupRoot, rule: ExpandedInboxRule, index: number) {
		const mailbox = this.mailboxes.get(elementIdToId(mailboxGroupRoot._id))
		if (mailbox) {
			const next = mailbox.orderedInboxRules[index + 1]
			mailbox.orderedInboxRules[index + 1] = rule
			mailbox.orderedInboxRules[index] = next
			await this.saveInboxRuleOrder(mailbox)
		}
	}

	async moveRuleToLast(mailboxGroupRoot: MailboxGroupRoot, rule: ExpandedInboxRule, index: number) {
		const mailbox = this.mailboxes.get(elementIdToId(mailboxGroupRoot._id))
		if (mailbox) {
			mailbox.orderedInboxRules.splice(index, 1)
			mailbox.orderedInboxRules.push(rule)
			await this.saveInboxRuleOrder(mailbox)
		}
	}

	async moveRuleToIndex(mailboxGroupRoot: MailboxGroupRoot, rule: ExpandedInboxRule, currentIndex: number, insertAtIndex: number) {
		if (currentIndex === insertAtIndex || currentIndex + 1 === insertAtIndex) return

		const mailbox = this.mailboxes.get(elementIdToId(mailboxGroupRoot._id))
		if (mailbox) {
			mailbox.orderedInboxRules.splice(insertAtIndex, 0, rule)
			mailbox.orderedInboxRules.splice(currentIndex > insertAtIndex ? currentIndex + 1 : currentIndex, 1)
			await this.saveInboxRuleOrder(mailbox)
		}
	}
}
