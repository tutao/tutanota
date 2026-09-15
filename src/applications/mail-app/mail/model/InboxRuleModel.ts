import {
	createExpandedInboxRule,
	createInboxRuleCondition,
	createInboxRuleResult,
	ExpandedInboxRule,
	ExpandedInboxRuleTypeRef,
	InboxRule,
	TutanotaPropertiesTypeRef,
} from "@tutao/entities/tutanota"
import { elementIdToId, getElementId, getListId } from "@tutao/meta"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { ProgrammingError } from "@tutao/app-env"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { assertNotNull, isNotNull } from "@tutao/utils"
import { createIdTupleWrapper, IdTupleWrapper } from "@tutao/entities/sys"
import { InboxRuleConditionType, InboxRuleResultType } from "../../../../entities/tutanota/Utils"
import { mailLocator } from "../../mailLocator"

export class InboxRuleModel {
	private usingLegacyInboxRules: boolean = true

	constructor(
		private readonly entityClient: EntityClient,
		private readonly mailboxModel: MailboxModel,
	) {}

	async init() {
		const mailboxGroupRoot = await this.getUserMailboxGroupRoot()
		this.usingLegacyInboxRules = !isNotNull(mailboxGroupRoot.inboxRules)
	}

	// FIXME: I don't know if this is the right place for migrateInboxRules, need to figure out where to call
	// FIXME: this errors right now, but with breakpoints it doesn't. Probably just not waiting long enough
	async triggerInboxRuleMigration() {
		if (!this.usingLegacyInboxRules) {
			const props = await this.entityClient.load(TutanotaPropertiesTypeRef, mailLocator.logins.getUserController().props._id)
			if (props.inboxRules.length > 0) {
				console.log("Migrating Inbox Rules!!!!")
				await this.migrateInboxRules(props.inboxRules)

				props.inboxRules = []

				await this.entityClient.update(props)
			}
		}
	}

	private async migrateInboxRules(legacyInboxRules: InboxRule[]) {
		for (const legacyInboxRule of legacyInboxRules) {
			// FIXME: need to get name of Target Folder, right now it is just id
			const inboxRuleName = `${legacyInboxRule.value} -> ${legacyInboxRule.targetFolder}`

			const inboxRuleResults = [createInboxRuleResult({ type: InboxRuleResultType.MOVE, value: legacyInboxRule.targetFolder })]
			if (legacyInboxRule.excludeFromSpamFilter) {
				inboxRuleResults.push(createInboxRuleResult({ type: InboxRuleResultType.EXCLUDE_SPAM, value: null }))
			}

			const inboxRule = createExpandedInboxRule({
				name: inboxRuleName,
				conditions: [createInboxRuleCondition({ type: legacyInboxRule.type, value: legacyInboxRule.value })],
				results: inboxRuleResults,
				enabled: true,
			})

			await this.createInboxRule(inboxRule)
		}
	}

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

	isUsingLegacyInboxRules() {
		return this.usingLegacyInboxRules
	}
}
