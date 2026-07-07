import { assertMainOrNode, UpgradePromptType } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { ColumnWidth, createRowActions, Table, type TableAttrs, TableLineAttrs } from "../../../ui/base/Table"
import { mailLocator } from "../mailLocator"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { MailSet, MailSetEntryTypeRef, MailSetTypeRef, MailTypeRef, TutanotaProperties, TutanotaPropertiesTypeRef } from "@tutao/entities/tutanota"
import { elementIdPart, isSameId, OperationType } from "@tutao/meta"
import m, { Children } from "mithril"
import { assertNotNull, isEmpty, noOp, ofClass, promiseMap, splitInChunks } from "@tutao/utils"
import { getInboxRuleTypeName } from "../mail/model/InboxRuleHandler"
import type { MailboxDetail } from "../../common/mailFunctionality/MailboxModel"
import { getFolderName } from "../mail/model/MailUtils"
import { lang } from "../../../ui/utils/LanguageViewModel"
import * as AddInboxRuleDialog from "./AddInboxRuleDialog"
import { createInboxRuleTemplate } from "./AddInboxRuleDialog"
import { InboxRuleConditionType, MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION } from "../../../entities/tutanota/Utils"
import { Icons } from "../../../ui/base/icons/Icons"
import { PrimaryButton, SecondaryButton } from "../../../ui/base/buttons/VariantButtons"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { ButtonType } from "../../../ui/base/Button"
import { Dialog } from "../../../ui/base/Dialog"
import { resolveMailSetEntries } from "../mail/model/MailSetListModel"
import { MoveMode } from "../mail/model/MailModel"
import { isOfflineError, LockedError } from "@tutao/rest-client/error"
import { theme } from "../../../ui/theme"
import { TitleSection } from "../../../ui/TitleSection"
import { MenuTitle } from "../../../ui/titles/MenuTitle"
import { Card } from "../../../ui/base/Card"

assertMainOrNode()

export class InboxRuleSettingsViewer implements UpdatableSettingsViewer {
	private inboxRulesTableLines: Stream<Array<TableLineAttrs>>

	constructor() {
		this.inboxRulesTableLines = stream<Array<TableLineAttrs>>([])

		this.updateInboxRules(mailLocator.logins.getUserController().props)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			const { operation } = update
			if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				const props = await mailLocator.entityClient.load(TutanotaPropertiesTypeRef, mailLocator.logins.getUserController().props._id)
				this.updateInboxRules(props)
			} else if (isUpdateForTypeRef(MailSetTypeRef, update)) {
				this.updateInboxRules(mailLocator.logins.getUserController().props)
			}
		}
		m.redraw()
	}

	view(): Children {
		const templateRule = createInboxRuleTemplate(InboxRuleConditionType.RECIPIENT_TO_EQUALS, "")
		const inboxRulesTableAttrs: TableAttrs = {
			columnHeading: ["inboxRuleField_label", "inboxRuleValue_label", "inboxRuleTargetFolder_label"],
			columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			lines: this.inboxRulesTableLines(),
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
						this.inboxRulesTableLines().length > 0
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
									.then((mailboxDetails) => AddInboxRuleDialog.show(mailboxDetails, templateRule)),
						}),
					),
				],
			),
		])
	}

	updateInboxRules(props: TutanotaProperties): void {
		mailLocator.mailboxModel.getUserMailboxDetails().then(async (mailboxDetails) => {
			const ruleLines = await promiseMap(props.expandedInboxRules, async (rule, index) => {
				return {
					cells: [
						rule.name,
						getInboxRuleTypeName(rule.conditions[0].type),
						rule.results[0].value ? await this.getTextForTarget(mailboxDetails, assertNotNull(rule.results[0].value)) : "None",
					],
					actionButtonAttrs: createRowActions(
						{
							getArray: () => props.expandedInboxRules,
							updateInstance: () => mailLocator.entityClient.update(props).catch(ofClass(LockedError, noOp)),
						},
						rule,
						index,
						[
							{
								label: "edit_action",
								click: () => AddInboxRuleDialog.show(mailboxDetails, rule),
							},
						],
					),
				}
			})

			this.inboxRulesTableLines(ruleLines)

			m.redraw()
		})
	}

	private async getTextForTarget(mailboxDetail: MailboxDetail, targetFolderId: IdTuple): Promise<string> {
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
		let folder = folders.getFolderById(elementIdPart(targetFolderId))

		if (folder) {
			return getFolderName(folder)
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

					const location = await inboxRuleHandler.processInboxRulesOnly(mail.mail, inbox, mailboxDetails)
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
