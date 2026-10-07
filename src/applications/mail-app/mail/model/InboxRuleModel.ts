import {
	createExpandedInboxRule,
	createInboxRuleAction,
	createInboxRuleCondition,
	ExpandedInboxRule,
	ExpandedInboxRuleTypeRef,
	InboxRule,
	MailSet,
	TutanotaPropertiesTypeRef,
} from "@tutao/entities/tutanota"
import { elementIdPart, elementIdToId, getElementId, getListId, isSameId } from "@tutao/meta"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
import { ProgrammingError } from "@tutao/app-env"
import { EntityClient } from "../../../../platform-kit/network/EntityClient"
import { assertNotNull, isEmpty, isNotNull } from "@tutao/utils"
import { createIdTupleWrapper, IdTupleWrapper } from "@tutao/entities/sys"
import { InboxRuleActionType } from "../../../../entities/tutanota/Utils"
import { mailLocator } from "../../mailLocator"
import { getMailSetName } from "./MailUtils"
import { MailModel } from "./MailModel"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { isNull } from "../../../../platform-kit/utils/Utils"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"

export class InboxRuleModel {
	private usingLegacyInboxRules: boolean = true

	constructor(
		private readonly entityClient: EntityClient,
		private readonly mailboxModel: MailboxModel,
		// Note: mailModel is only needed for migration, remove once it is done
		private readonly mailModel: MailModel,
	) {}

	async init() {
		const mailboxGroupRoot = await this.getUserMailboxGroupRoot()
		this.usingLegacyInboxRules = !isNotNull(mailboxGroupRoot.inboxRules)
	}

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
		const mailboxGroupRoot = await this.getUserMailboxGroupRoot()
		if (!mailboxGroupRoot.mailboxProperties) {
			// The server will throw an error if the Mailbox Properties are not created, mailbox properties are created on the client side only when first accessed
			// there is a small chance that the user has never done an action that prompted the creation of the mailboxProperties
			await this.mailboxModel.loadOrCreateMailboxProperties(mailboxGroupRoot)
		}

		for (const legacyInboxRule of legacyInboxRules) {
			const targetFolder = await this.mailModel.getMailSetById(elementIdPart(legacyInboxRule.targetFolder))
			// If targetFolder is Null, the folder had been deleted
			const inboxRuleName = `${legacyInboxRule.value} -> ${isNotNull(targetFolder) ? getMailSetName(targetFolder) : lang.getTranslationText("deletedFolder_label")}`

			const inboxRuleActions = [
				createInboxRuleAction({ type: InboxRuleActionType.MOVE, value: isNull(targetFolder) ? null : legacyInboxRule.targetFolder }),
			]
			if (legacyInboxRule.excludeFromSpamFilter) {
				inboxRuleActions.push(createInboxRuleAction({ type: InboxRuleActionType.EXCLUDE_SPAM, value: null }))
			}

			const inboxRule = createExpandedInboxRule({
				name: inboxRuleName,
				conditions: [createInboxRuleCondition({ type: legacyInboxRule.type, value: legacyInboxRule.value })],
				actions: inboxRuleActions,
				enabled: isNotNull(targetFolder),
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

	private async getUnsortedInboxRules(): Promise<ExpandedInboxRule[]> {
		const userMailboxGroupRoot = await this.getUserMailboxGroupRoot()
		return await this.entityClient.loadAll(
			ExpandedInboxRuleTypeRef,
			assertNotNull(userMailboxGroupRoot.inboxRules, "expanded inbox rules list missing from mailboxGroupRoot").list,
		)
	}

	async getInboxRulesMap(): Promise<Map<Id, ExpandedInboxRule>> {
		const unsortedInboxRules = await this.getUnsortedInboxRules()
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

	async getInboxRulesThatReferenceMailSetSystem(root: MailSet, system: FolderSystem) {
		const descendants = [root, ...system.getDescendantFoldersOfParent(root._id).map((set) => set.mailSet)]
		return await this.getInboxRulesThatReferenceMailSets(descendants)
	}

	async getInboxRulesThatReferenceMailSets(sets: readonly MailSet[]): Promise<ExpandedInboxRule[]> {
		if (this.usingLegacyInboxRules) return []

		const userMailboxGroupRoot = await this.getUserMailboxGroupRoot()
		const relevantLabels = sets.filter((label) => label._ownerGroup === userMailboxGroupRoot._ownerGroup)
		if (isEmpty(relevantLabels)) {
			return []
		}

		const unsortedInboxRules = await this.getUnsortedInboxRules()
		return unsortedInboxRules.filter((rule) => {
			for (const action of rule.actions) {
				if (sets.some((label) => isSameId(action.value, label._id))) {
					return true
				}
			}
			return false
		})
	}

	async deactivateInboxRulesThatReferenceLabels(labels: readonly MailSet[]): Promise<void> {
		const rules = await this.getInboxRulesThatReferenceMailSets(labels)
		for (const rule of rules) {
			const firstLabelRuleIndex = rule.actions.findIndex((action) => action.type === InboxRuleActionType.LABEL)

			if (firstLabelRuleIndex > -1) {
				// Remove all label actions reference a deleted label
				rule.actions = rule.actions.filter((action) => !labels.some((label) => isSameId(action.value, label._id)))
				if (rule.actions.filter((action) => action.type === InboxRuleActionType.LABEL).length === 0) {
					// if all labels were removed we want the invalid placeholder
					rule.actions.splice(firstLabelRuleIndex, 0, createInboxRuleAction({ type: InboxRuleActionType.LABEL, value: null }))
					rule.enabled = false
				}
			}
			await this.updateInboxRule(rule)
		}
	}

	async deactivateInboxRulesThatReferenceFolders(folders: readonly MailSet[]): Promise<void> {
		const rules = await this.getInboxRulesThatReferenceMailSets(folders)
		for (const rule of rules) {
			rule.enabled = false
			for (const action of rule.actions) {
				if (folders.some((folder) => isSameId(action.value, folder._id))) {
					action.value = null
				}
			}
			await this.updateInboxRule(rule)
		}
	}

	isInboxRuleValid(rule: ExpandedInboxRule) {
		// a rule may become invalid when a folder or label is deleted
		return !rule.actions.some(
			(action) => action.value == null && [InboxRuleActionType.MOVE, InboxRuleActionType.LABEL].includes(action.type as InboxRuleActionType),
		)
	}
}
