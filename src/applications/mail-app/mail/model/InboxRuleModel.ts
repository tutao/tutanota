import { ExpandedInboxRule, ExpandedInboxRuleTypeRef } from "@tutao/entities/tutanota"
import { elementIdToId, getElementId, getListId } from "@tutao/meta"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { ProgrammingError } from "@tutao/app-env"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { assertNotNull, isNotNull } from "@tutao/utils"
import { createIdTupleWrapper, IdTupleWrapper } from "@tutao/entities/sys"

export class InboxRuleModel {
	constructor(
		private readonly entityClient: EntityClient,
		private readonly mailboxModel: MailboxModel,
	) {}

	private async getUserMailboxGroupRoot() {
		const { mailboxGroupRoot } = await this.mailboxModel.getUserMailboxDetails()
		return mailboxGroupRoot
	}

	async getOrderedInboxRules(): Promise<ExpandedInboxRule[]> {
		const [inboxRulesById, inboxRuleOrder] = await Promise.all([this.getInboxRulesMap(), this.getInboxRuleOrder()])
		return inboxRuleOrder.map(({ listElementId }) => inboxRulesById.get(listElementId) ?? null).filter(isNotNull)
	}

	async getInboxRuleOrder(): Promise<IdTupleWrapper[]> {
		const userMailboxGroupRoot = await this.getUserMailboxGroupRoot()
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(userMailboxGroupRoot)
		return mailboxProperties.inboxRuleOrder
	}

	async getInboxRulesMap(): Promise<Map<Id, ExpandedInboxRule>> {
		const userMailboxGroupRoot = await this.getUserMailboxGroupRoot()
		const unsortedInboxRules = await this.entityClient.loadAll(
			ExpandedInboxRuleTypeRef,
			assertNotNull(userMailboxGroupRoot.inboxRules, "expanded inbox rules list missing from mailboxGroupRoot").list,
		)

		const inboxRulesById = new Map<Id, ExpandedInboxRule>()
		for (const rule of unsortedInboxRules) {
			inboxRulesById.set(getElementId(rule), rule)
		}

		return inboxRulesById
	}

	async createInboxRule(rule: ExpandedInboxRule): Promise<void> {
		const userMailboxGroupRoot = await this.getUserMailboxGroupRoot()

		if (!userMailboxGroupRoot.inboxRules) {
			throw new ProgrammingError("Trying to create an expanded inbox rule when the list has not been added to the mailbox!")
		}

		rule._ownerGroup = elementIdToId(userMailboxGroupRoot._id)
		// When the inbox rule is created, the server adds it to the inboxRuleOrder on MailboxProperties
		await this.entityClient.setup(userMailboxGroupRoot.inboxRules.list, rule, null)
	}

	async updateInboxRule(rule: ExpandedInboxRule): Promise<void> {
		await this.entityClient.update(rule)
	}

	async deleteInboxRule(rule: ExpandedInboxRule): Promise<void> {
		// When the inbox rule is deleted, the server removes it from the inboxRuleOrder on MailboxProperties
		await this.entityClient.erase(rule)
	}

	async updateInboxRuleOrder(newOrder: ExpandedInboxRule[]) {
		const userMailboxGroupRoot = await this.getUserMailboxGroupRoot()
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(userMailboxGroupRoot)

		mailboxProperties.inboxRuleOrder = newOrder.map((rule) => createIdTupleWrapper({ listId: getListId(rule), listElementId: getElementId(rule) }))
		await this.entityClient.update(mailboxProperties)
	}
}
