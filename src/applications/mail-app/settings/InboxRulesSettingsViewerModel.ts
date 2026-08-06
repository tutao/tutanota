import { ExpandedInboxRule, ExpandedInboxRuleTypeRef, MailboxPropertiesTypeRef } from "@tutao/entities/tutanota"
import { getElementId, isSameId, OperationType } from "@tutao/meta"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { assertNotNull, isNotNull } from "@tutao/utils"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { InboxRuleModel } from "../mail/model/InboxRuleModel"
import { IdTupleWrapper } from "@tutao/entities/sys"

export class InboxRulesSettingsViewerModel {
	private inboxRulesById: Map<Id, ExpandedInboxRule> = new Map()
	private inboxRulesOrder: IdTupleWrapper[] = []
	private _orderedInboxRules: ExpandedInboxRule[] = []

	constructor(
		private readonly entityClient: EntityClient,
		private readonly inboxRuleModel: InboxRuleModel,
	) {
		void this.init()
	}

	private async init(): Promise<void> {
		const [rulesById, rulesOrder] = await Promise.all([this.inboxRuleModel.getInboxRulesMap(), this.inboxRuleModel.getInboxRuleOrder()])
		this.inboxRulesById = rulesById
		this.inboxRulesOrder = rulesOrder
		this.computeOrderedInboxRules()
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
			}
		}
	}

	async saveInboxRuleOrder() {
		await this.inboxRuleModel.updateInboxRuleOrder(this.orderedInboxRules)
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
}
