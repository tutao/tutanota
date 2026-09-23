import { ExpandedInboxRule, ExpandedInboxRuleTypeRef, MailboxPropertiesTypeRef } from "@tutao/entities/tutanota"
import { getElementId, isSameId, OperationType } from "@tutao/meta"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { assertNotNull, isNotNull } from "@tutao/utils"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { InboxRuleModel } from "../mail/model/InboxRuleModel"
import { IdTupleWrapper } from "@tutao/entities/sys"
import { SpamFilterBehavior } from "../mail/model/SpamClassificationHandler"
import type { MailboxModel } from "../../common/mailFunctionality/MailboxModel"

export class FilteringRulesSettingsViewerModel {
	private inboxRulesById: Map<Id, ExpandedInboxRule> = new Map()
	private inboxRulesOrder: IdTupleWrapper[] = []
	private _orderedInboxRules: ExpandedInboxRule[] = []
	private spamFilterBehavior: string = SpamFilterBehavior.DEFAULT

	constructor(
		private readonly entityClient: EntityClient,
		private readonly inboxRuleModel: InboxRuleModel,
		private readonly mailboxModel: MailboxModel,
	) {
		void this.init()
	}

	private async init(): Promise<void> {
		if (!this.inboxRuleModel.isUsingLegacyInboxRules()) {
			const [rulesById, rulesOrder] = await Promise.all([this.inboxRuleModel.getInboxRulesMap(), this.inboxRuleModel.getInboxRuleOrder()])
			this.inboxRulesById = rulesById
			this.inboxRulesOrder = rulesOrder
			this.computeOrderedInboxRules()

			const { mailboxGroupRoot } = await this.mailboxModel.getUserMailboxDetails()
			const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxGroupRoot)
			console.log("on init...", mailboxProperties.spamFilterBehavior)
			this.spamFilterBehavior = mailboxProperties.spamFilterBehavior || SpamFilterBehavior.DEFAULT
			console.log("after init set to...", this.spamFilterBehavior)
		}
	}

	private computeOrderedInboxRules() {
		this._orderedInboxRules = this.inboxRulesOrder.map(({ listElementId }) => this.inboxRulesById.get(listElementId) ?? null).filter(isNotNull)
	}

	get orderedInboxRules(): ExpandedInboxRule[] {
		return this._orderedInboxRules
	}

	async onEntityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			if (isUpdateForTypeRef(ExpandedInboxRuleTypeRef, update)) {
				if (update.operation === OperationType.DELETE) {
					this.inboxRulesById.delete(update.instanceId)
					continue
				}

				const updatedRule = await this.entityClient.load(ExpandedInboxRuleTypeRef, [assertNotNull(update.instanceListId), update.instanceId])
				this.inboxRulesById.set(getElementId(updatedRule), updatedRule)

				if (update.operation === OperationType.UPDATE) {
					const ruleIndex = this._orderedInboxRules.findIndex((rule) => isSameId(updatedRule._id, rule._id))
					if (ruleIndex !== -1) {
						this._orderedInboxRules[ruleIndex] = updatedRule
					}
				}
			} else if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update)) {
				const mailboxProperties = await this.entityClient.load(MailboxPropertiesTypeRef, [null, update.instanceId])
				this.inboxRulesOrder = mailboxProperties.inboxRuleOrder
				this.computeOrderedInboxRules()

				this.spamFilterBehavior = mailboxProperties.spamFilterBehavior || SpamFilterBehavior.DEFAULT
			}
		}
	}

	async saveInboxRuleOrder() {
		await this.inboxRuleModel.updateInboxRuleOrder(this.orderedInboxRules)
	}

	async saveInboxRule(rule: ExpandedInboxRule) {
		await this.inboxRuleModel.updateInboxRule(rule)
	}

	async deleteInboxRule(rule: ExpandedInboxRule) {
		await this.inboxRuleModel.deleteInboxRule(rule)
	}

	async moveRuleToFirst(rule: ExpandedInboxRule, index: number) {
		this.orderedInboxRules.splice(index, 1)
		this.orderedInboxRules.unshift(rule)
		await this.saveInboxRuleOrder()
	}

	async moveRuleUp(rule: ExpandedInboxRule, index: number) {
		let prev = this.orderedInboxRules[index - 1]
		this.orderedInboxRules[index - 1] = rule
		this.orderedInboxRules[index] = prev
		await this.saveInboxRuleOrder()
	}

	async moveRuleDown(rule: ExpandedInboxRule, index: number) {
		let next = this.orderedInboxRules[index + 1]
		this.orderedInboxRules[index + 1] = rule
		this.orderedInboxRules[index] = next
		await this.saveInboxRuleOrder()
	}

	async moveRuleToLast(rule: ExpandedInboxRule, index: number) {
		this.orderedInboxRules.splice(index, 1)
		this.orderedInboxRules.push(rule)
		await this.saveInboxRuleOrder()
	}

	async moveRuleToIndex(rule: ExpandedInboxRule, currentIndex: number, insertAtIndex: number) {
		if (currentIndex === insertAtIndex || currentIndex + 1 === insertAtIndex) return

		this.orderedInboxRules.splice(insertAtIndex, 0, rule)
		this.orderedInboxRules.splice(currentIndex > insertAtIndex ? currentIndex + 1 : currentIndex, 1)
		await this.saveInboxRuleOrder()
	}

	getSpamHandlingMode() {
		return this.spamFilterBehavior
	}

	async updateSpamHandlingMode(newBehavior: SpamFilterBehavior) {
		this.spamFilterBehavior = newBehavior
		const { mailboxGroupRoot } = await this.mailboxModel.getUserMailboxDetails()
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxGroupRoot)

		mailboxProperties.spamFilterBehavior = newBehavior
		await this.entityClient.update(mailboxProperties)
	}
}
