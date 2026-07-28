import { assertMainOrNode, UpgradePromptType } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { ColumnWidth, createRowActions, Table, type TableAttrs, TableLineAttrs } from "../../../ui/base/Table"
import { mailLocator } from "../mailLocator"
import { EntityUpdateData } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { MailSet, MailSetEntryTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { elementIdPart, isSameId } from "@tutao/meta"
import m, { Children } from "mithril"
import { assertNotNull, isEmpty, promiseMap, splitInChunks } from "@tutao/utils"
import type { MailboxDetail, MailboxModel } from "../../common/mailFunctionality/MailboxModel"
import { lang } from "../../../ui/utils/LanguageViewModel"
import * as AddInboxRuleDialog from "./AddInboxRuleDialog"
import { MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION } from "../../../entities/tutanota/Utils"
import { Icons } from "../../../ui/base/icons/Icons"
import { PrimaryButton, SecondaryButton } from "../../../ui/base/buttons/VariantButtons"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { ButtonType } from "../../../ui/base/Button"
import { Dialog } from "../../../ui/base/Dialog"
import { resolveMailSetEntries } from "../mail/model/MailSetListModel"
import { MoveMode } from "../mail/model/MailModel"
import { isOfflineError } from "@tutao/rest-client/error"
import { theme } from "../../../ui/theme"
import { TitleSection } from "../../../ui/TitleSection"
import { MenuTitle } from "../../../ui/titles/MenuTitle"
import { Card } from "../../../ui/base/Card"
import { getMailSetName } from "../mail/model/MailUtils"
import { getInboxRuleConditionTypeName } from "../mail/model/InboxRuleHandler"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { InboxRulesSettingsViewerModel } from "./InboxRulesSettingsViewerModel"
import { InboxRuleModel } from "../mail/model/InboxRuleModel"

assertMainOrNode()

export class InboxRuleSettingsViewer implements UpdatableSettingsViewer {
	private model: InboxRulesSettingsViewerModel

	constructor(
		readonly mailboxModel: MailboxModel,
		readonly entityClient: EntityClient,
		readonly inboxRuleModel: InboxRuleModel,
	) {
		this.model = new InboxRulesSettingsViewerModel(entityClient, inboxRuleModel)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		await this.model.onEntityEventsReceived(updates)
		m.redraw()
	}

	view(): Children {
		const tableLines = this.renderInboxRuleTableLines()
		const inboxRulesTableAttrs: TableAttrs = {
			columnHeading: ["inboxRuleField_label", "inboxRuleValue_label", "inboxRuleTargetFolder_label"],
			columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			lines: tableLines,
		}

		return m("", [
			m(
				".fill-absolute.scroll.plr-24.pb-48",
				{
					style: {
						backgroundColor: theme.surface_container,
						gap: "16px",
						display: "flex",
						flexDirection: "column",
					},
				},
				[
					m(TitleSection, {
						icon: Icons.FunnelOutline,
						title: lang.getTranslationText("inboxRuleManagement_label"),
						subTitle: lang.getTranslationText("inboxRuleManagement_text"),
					}),
					m(MenuTitle, { content: lang.get("inboxRulesSettings_action") }),
					m(Card, m(Table, inboxRulesTableAttrs)),
					m(
						".mt-8.flex-end.gap-8",
						tableLines.length > 0
							? m(SecondaryButton, {
									label: "reapplyInboxRules_action",
									width: "flex",
									onclick: () => this.reapplyInboxRules(),
								})
							: null,
						m(PrimaryButton, {
							label: "addInboxRule_action",
							width: "flex",
							onclick: () =>
								mailLocator.mailboxModel
									.getUserMailboxDetails()
									.then((mailboxDetails) => AddInboxRuleDialog.show(mailboxDetails, this.inboxRuleModel, null)),
						}),
					),
				],
			),
		])
	}

	renderInboxRuleTableLines(): TableLineAttrs[] {
		return this.model.orderedInboxRules.map((rule, index) => {
			// rule should never be null as we check that all rules in the order list are in the map, but get can still theoretically return undefined
			return {
				cells: [rule.name, getInboxRuleConditionTypeName(rule.conditions[0].type), "None"],
				actionButtonAttrs: createRowActions(
					{
						getArray: () => this.model.orderedInboxRules,
						updateInstance: async () => {
							await this.model.saveInboxRuleOrder()
						},
					},
					rule,
					index,
					[
						{
							label: "edit_action",
							click: () =>
								this.mailboxModel
									.getUserMailboxDetails()
									.then((mailboxDetails) => AddInboxRuleDialog.show(mailboxDetails, this.inboxRuleModel, rule)),
						},
						{
							label: "delete_action",
							click: () => {
								this.model.deleteInboxRule(rule)
							},
						},
					],
				),
			}
		})
	}

	private async getTextForTarget(mailboxDetail: MailboxDetail, targetFolderId: IdTuple): Promise<string> {
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
		let folder = folders.getFolderById(elementIdPart(targetFolderId))

		if (folder) {
			return getMailSetName(folder)
		} else {
			return lang.get("deletedFolder_label")
		}
	}

	private async reapplyAllInboxRules(progress: Stream<number>, abort: AbortController): Promise<number> {
		const userController = mailLocator.logins.getUserController()
		const inboxRules = userController.props.inboxRules
		if (isEmpty(inboxRules)) {
			return 0
		}

		const folderSystem = assertNotNull(
			mailLocator.mailModel.getFolderSystemByGroupId(userController.getUserMailGroupMembership().group),
			"no folder system?",
		)
		const inbox = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX), "no inbox?")
		const inboxRuleHandler = mailLocator.processInboxHandler()
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

				const destinationsForMails = new Map<Id, IdTuple[]>()
				const destinationFolders = new Map<Id, MailSet>()

				await promiseMap(mails, async (mail) => {
					if (mail.mail.mailDetails == null) {
						// inbox rules do not work on drafts
						return
					}

					const location = await inboxRuleHandler.getInboxRuleMoveTarget(mail.mail, inbox, mailboxDetails)
					if (isSameId(location._id, inbox._id)) {
						// don't move from the inbox to the inbox
						return
					}

					const locationId = elementIdPart(location._id)
					destinationFolders.set(locationId, location)

					const destinationList = destinationsForMails.get(locationId) ?? assertNotNull(destinationsForMails.set(locationId, []).get(locationId))
					destinationList.push(mail.mail._id)
				})

				for (const [destinationId, mails] of destinationsForMails.entries()) {
					const mailset = assertNotNull(destinationFolders.get(destinationId))
					await mailLocator.mailModel.moveMails(mails, mailset, MoveMode.Mails)
					totalMoved += mails.length
				}

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

	private async reapplyInboxRules(): Promise<void> {
		if (mailLocator.logins.getUserController().isFreeAccount()) {
			// you need access to inbox rules first before you can even use them
			await showNotAvailableForFreeDialog(UpgradePromptType.INBOX_RULES)
			return
		}

		const progress = stream(0)
		const abort = new AbortController()
		const moved = await showProgressDialog("pleaseWait_msg", this.reapplyAllInboxRules(progress, abort), progress, {
			middle: "reapplyInboxRules_action",
			left: () => {
				return [
					{
						label: "cancel_action",
						click: () => {
							abort.abort()

							// set progress to 100 so it doesn't look "stuck" even if it might take a few seconds to finish
							progress(100)
						},
						type: ButtonType.Secondary,
					} as const,
				]
			},
		})
		await Dialog.message(lang.getTranslation("moveItemsSuccess_msg", { "{count}": moved }))
	}
}
