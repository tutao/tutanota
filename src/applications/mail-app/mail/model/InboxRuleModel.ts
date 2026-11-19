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
import { MailboxDetail, MailboxModel } from "../../../common/mailFunctionality/MailboxModel"
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
	private hasLegacyInboxRules: boolean | null = null
	private ableToUseExpandedInboxRules: boolean | null = null

	constructor(
		private readonly entityClient: EntityClient,
		private readonly mailboxModel: MailboxModel,
		// Note: mailModel is only needed for migration, remove once it is done
		private readonly mailModel: MailModel,
	) {}

	async init() {
		const userMailboxGroupRoot = await this.getUserMailboxGroupRoot()
		const props = await this.entityClient.load(TutanotaPropertiesTypeRef, mailLocator.logins.getUserController().props._id)
		this.hasLegacyInboxRules = !isEmpty(props.inboxRules)
		this.ableToUseExpandedInboxRules = isNotNull(userMailboxGroupRoot.inboxRules)
		this.usingLegacyInboxRules = !this.ableToUseExpandedInboxRules || this.hasLegacyInboxRules
	}

	async triggerInboxRuleMigration() {
		if (isNull(this.ableToUseExpandedInboxRules)) {
			await this.init()
		}
		if (this.ableToUseExpandedInboxRules && this.hasLegacyInboxRules) {
			const props = await this.entityClient.load(TutanotaPropertiesTypeRef, mailLocator.logins.getUserController().props._id)
			if (props.inboxRules.length > 0) {
				console.log(`Migrating ${props.inboxRules.length} inbox rules`)
				await this.migrateInboxRules(props.inboxRules)

				props.inboxRules = []

				await this.entityClient.update(props)
			}
			this.usingLegacyInboxRules = false
			this.hasLegacyInboxRules = false
		}
	}

	private async migrateInboxRules(legacyInboxRules: InboxRule[]) {
		const userMailboxGroupRoot = await this.getUserMailboxGroupRoot()
		if (!userMailboxGroupRoot.mailboxProperties) {
			// The server will throw an error if the Mailbox Properties are not created, mailbox properties are created on the client side only when first accessed
			// there is a small chance that the user has never done an action that prompted the creation of the mailboxProperties
			await this.mailboxModel.loadOrCreateMailboxProperties(userMailboxGroupRoot)
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

			await this.createInboxRule(inboxRule, await this.mailboxModel.getUserMailboxDetails())
		}
	}

	private async getUserMailboxGroupRoot() {
		const { mailboxGroupRoot } = await this.mailboxModel.getUserMailboxDetails()
		return mailboxGroupRoot
	}

	async getOrderedInboxRules(mailboxDetail: MailboxDetail): Promise<ExpandedInboxRule[]> {
		const [inboxRulesById, inboxRuleOrder] = await Promise.all([this.getInboxRulesMap(mailboxDetail), this.getInboxRuleOrder(mailboxDetail)])
		return inboxRuleOrder.map(({ listElementId }) => inboxRulesById.get(listElementId) ?? null).filter(isNotNull)
	}

	async getInboxRuleOrder(mailboxDetail: MailboxDetail): Promise<IdTupleWrapper[]> {
		const mailboxGroupRoot = mailboxDetail.mailboxGroupRoot
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxGroupRoot)
		return mailboxProperties.inboxRuleOrder
	}

	private async getUnsortedInboxRules(mailboxDetail: MailboxDetail): Promise<ExpandedInboxRule[]> {
		const mailboxGroupRoot = mailboxDetail.mailboxGroupRoot
		return await this.entityClient.loadAll(
			ExpandedInboxRuleTypeRef,
			assertNotNull(mailboxGroupRoot.inboxRules, "expanded inbox rules list missing from mailboxGroupRoot").list,
		)
	}

	async getInboxRulesMap(mailboxDetail: MailboxDetail): Promise<Map<Id, ExpandedInboxRule>> {
		const unsortedInboxRules = await this.getUnsortedInboxRules(mailboxDetail)
		const inboxRulesById = new Map<Id, ExpandedInboxRule>()
		for (const rule of unsortedInboxRules) {
			inboxRulesById.set(getElementId(rule), rule)
		}

		return inboxRulesById
	}

	async createInboxRule(rule: ExpandedInboxRule, mailboxDetail: MailboxDetail): Promise<void> {
		const mailboxGroupRoot = mailboxDetail.mailboxGroupRoot

		if (!mailboxGroupRoot.inboxRules) {
			throw new ProgrammingError("Trying to create an expanded inbox rule when the list has not been added to the mailbox!")
		}

		rule._ownerGroup = elementIdToId(mailboxGroupRoot._id)
		// When the inbox rule is created, the server adds it to the inboxRuleOrder on MailboxProperties
		await this.entityClient.setup(mailboxGroupRoot.inboxRules.list, rule, null)
	}

	async updateInboxRule(rule: ExpandedInboxRule): Promise<void> {
		await this.entityClient.update(rule)
	}

	async deleteInboxRule(rule: ExpandedInboxRule): Promise<void> {
		// When the inbox rule is deleted, the server removes it from the inboxRuleOrder on MailboxProperties
		await this.entityClient.erase(rule)
	}

	async updateInboxRuleOrder(newOrder: ExpandedInboxRule[], mailboxDetail: MailboxDetail) {
		const mailboxGroupRoot = mailboxDetail.mailboxGroupRoot
		const mailboxProperties = await this.mailboxModel.getMailboxProperties(mailboxGroupRoot)

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
		if (this.usingLegacyInboxRules || isEmpty(sets)) return []

		const ownerGroup = sets[0]._ownerGroup
		if (ownerGroup === null || sets.some((set) => set._ownerGroup !== ownerGroup)) {
			console.warn("tried to get inbox rules for mail sets belonging to different mailboxes...")
			return []
		}

		const mailboxDetail = await this.mailboxModel.getMailboxDetailsForMailGroup(ownerGroup)
		const mailboxGroupRoot = mailboxDetail.mailboxGroupRoot
		const relevantLabels = sets.filter((label) => label._ownerGroup === mailboxGroupRoot._ownerGroup)
		if (isEmpty(relevantLabels)) {
			return []
		}

		const unsortedInboxRules = await this.getUnsortedInboxRules(mailboxDetail)
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
}
