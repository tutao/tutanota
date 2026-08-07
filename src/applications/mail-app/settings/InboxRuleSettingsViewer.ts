import { assertMainOrNode, ProgrammingError, UpgradePromptType } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { mailLocator } from "../mailLocator"
import { EntityUpdateData } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { elementIdPart, isSameId } from "@tutao/meta"
import m, { Children } from "mithril"
import type { MailboxDetail, MailboxModel } from "../../common/mailFunctionality/MailboxModel"
import { lang } from "../../../ui/utils/LanguageViewModel"
import * as AddInboxRuleDialog from "./AddInboxRuleDialog"
import { Icons } from "../../../ui/base/icons/Icons"
import { PrimaryButton, SecondaryButton } from "../../../ui/base/buttons/VariantButtons"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import { ButtonType } from "../../../ui/base/Button"
import { Dialog } from "../../../ui/base/Dialog"
import { theme } from "../../../ui/theme"
import { TitleSection } from "../../../ui/TitleSection"
import { MenuTitle } from "../../../ui/titles/MenuTitle"
import { Card } from "../../../ui/base/Card"
import { getMailSetName } from "../mail/model/MailUtils"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { InboxRulesSettingsViewerModel } from "./InboxRulesSettingsViewerModel"
import { InboxRuleModel } from "../mail/model/InboxRuleModel"
import { MessageBanner } from "../../../ui/base/MessageBanner"
import { Icon, IconSize } from "../../../ui/base/Icon"
import { Switch } from "../../../ui/base/Switch"
import { IconButton } from "../../../ui/base/IconButton"
import { createDropdown } from "../../../ui/base/Dropdown"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { client } from "../../../platform-kit/app-env/boot/ClientDetector"
import { ExpandedInboxRuleHandler } from "../mail/model/ExpandedInboxRuleHandler"
import { ExpandedInboxRule, MailSet, MailSetEntryTypeRef, MailTypeRef } from "@tutao/entities/tutanota"
import { assertNotNull, isEmpty, promiseMap, splitInChunks } from "@tutao/utils"
import { MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION } from "../../../entities/tutanota/Utils"
import { resolveMailSetEntries } from "../mail/model/MailSetListModel"
import { MoveMode } from "../mail/model/MailModel"
import { isOfflineError } from "@tutao/rest-client/error"

assertMainOrNode()

export class InboxRuleSettingsViewer implements UpdatableSettingsViewer {
	private model: InboxRulesSettingsViewerModel

	constructor(
		readonly mailboxModel: MailboxModel,
		readonly entityClient: EntityClient,
		readonly inboxRuleModel: InboxRuleModel,
		readonly expandedInboxRuleHandler: ExpandedInboxRuleHandler,
	) {
		this.model = new InboxRulesSettingsViewerModel(entityClient, inboxRuleModel)
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		await this.model.onEntityEventsReceived(updates)
		m.redraw()
	}

	view(): Children {
		const tableLines = this.renderInboxRuleTableLines()
		const isMobile = client.isMobileDevice()

		// Making the scroll section based on mobile view allows for the title section to also be scrolled away
		const inboxRuleSectionClasses = `.overflow-hidden.flex-v-start${isMobile ? ".scroll.scrollbar-gutter-stable-or-fallback" : ""}`
		const inboxRuleListClasses = `.mt-16.gap-8.flex-v-start${isMobile ? "" : ".scroll.scrollbar-gutter-stable-or-fallback"}`

		return m("", [
			m(
				".fill-absolute.plr-24.pb-48.flex-v-start",
				{
					style: {
						backgroundColor: theme.surface_container,
					},
				},
				[
					m(
						inboxRuleSectionClasses,
						m(TitleSection, {
							icon: Icons.FunnelOutline,
							title: lang.getTranslationText("inboxRuleManagement_label"),
							subTitle: lang.getTranslationText("inboxRuleManagement_text"),
						}),
						m(".mt-24", m(MenuTitle, { content: lang.get("inboxRulesSettings_action") })),
						tableLines.length > 0
							? m(inboxRuleListClasses, tableLines)
							: m(MessageBanner, {
									translation: lang.getTranslation("noEntries_msg"),
									type: "base",
								}),
					),
					m(
						".mt-16.flex-wrap.flex-end.gap-8",
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

	renderInboxRuleTableLines(): Children[] {
		return this.model.orderedInboxRules.map((rule, index) => {
			// rule should never be null as we check that all rules in the order list are in the map, but get can still theoretically return undefined
			return [
				m(
					Card,
					{
						style: {
							display: "grid",
							gridTemplateColumns: "auto 1fr auto auto",
							gridTemplateRows: "auto",
							alignItems: "center",
						},
					},
					[
						// reorder
						m(Icon, {
							// hoverText: lang.getTranslationText("move_action"),
							icon: Icons.DragDrop,
							size: IconSize.PX32,
							style: {
								fill: theme.outline,
							},
						}),
						// name
						m(
							".selectable.text-ellipsis.plr-16",
							{
								// title for tooltip
								title: rule.name,
							},
							rule.name,
						),
						// toggle button
						m(Switch, {
							ariaLabel: "deactivate_action",
							checked: true,
							onclick(checked: boolean) {
								throw new ProgrammingError("not implemented")
							},
						}),
						// actions button
						m(IconButton, {
							label: "edit_action",
							icon: Icons.More,
							size: ButtonSize.Normal,
							click: createDropdown({
								lazyButtons: () => [
									{
										label: "edit_action",
										click: () =>
											mailLocator.mailboxModel
												.getUserMailboxDetails()
												.then((mailboxDetails) => AddInboxRuleDialog.show(mailboxDetails, this.inboxRuleModel, rule)),
									},
									index > 1
										? {
												label: "moveToTop_action",
												click: () => this.model.moveRuleToFirst(rule, index),
											}
										: null,
									index > 0
										? {
												label: "moveUp_action",
												click: () => this.model.moveRuleUp(rule, index),
											}
										: null,
									index < this.model.orderedInboxRules.length - 1
										? {
												label: "moveDown_action",
												click: () => this.model.moveRuleDown(rule, index),
											}
										: null,
									index < this.model.orderedInboxRules.length - 2
										? {
												label: "moveToBottom_action",
												click: () => this.model.moveRuleToLast(rule, index),
											}
										: null,
									{
										label: "delete_action",
										click: () => this.model.deleteInboxRule(rule),
									},
								],
								width: 260,
							}),
						}),
					],
				),
			]
		})

		// This code is left in to help support old inbox rules, which will be done in another issue
		// mailLocator.mailboxModel.getUserMailboxDetails().then(async (mailboxDetails) => {
		// 	const ruleLines = await promiseMap(props.inboxRules, async (rule, index) => {
		// 		return {
		// 			// FIXME: getInboxRuleTypeName needs to be added back
		// 			cells: [getInboxRuleTypeName(rule.type), rule.value, await this.getTextForTarget(mailboxDetails, rule.targetFolder)],
		// 			actionButtonAttrs: createRowActions(
		// 				{
		// 					getArray: () => props.inboxRules,
		// 					updateInstance: () => mailLocator.entityClient.update(props).catch(ofClass(LockedError, noOp)),
		// 				},
		// 				rule,
		// 				index,
		// 				[
		// 					{
		// 						label: "edit_action",
		// 						click: () => {
		// 							// FIXME: need to add old inbox rule dialog back
		// 						},
		// 					},
		// 				],
		// 			),
		// 		} satisfies TableLineAttrs
		// 	})
		//
		// 	const table = [
		// 		m(Table, {
		// 			columnHeading: ["inboxRuleField_label", "inboxRuleValue_label", "inboxRuleTargetFolder_label"],
		// 			columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
		// 			showActionButtonColumn: true,
		// 			lines: ruleLines,
		// 		}),
		// 	]
		// 	this.inboxRulesTableLines(table)
		//
		// 	m.redraw()
		// })
	}

	// This is kept around to support old inbox rules, remove once they are no longer used
	private async getTextForTarget(mailboxDetail: MailboxDetail, targetFolderId: IdTuple): Promise<string> {
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
		let folder = folders.getFolderById(elementIdPart(targetFolderId))

		if (folder) {
			return getMailSetName(folder)
		} else {
			return lang.get("deletedFolder_label")
		}
	}

	// reapplyAllInboxRules is only needed for applying old inbox rules and should be removed once they are removed
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

		const rules = await this.inboxRuleModel.getOrderedInboxRules()

		applyRuleWithProgress(rules, this.expandedInboxRuleHandler)

		// FIXME: old code for old inbox rules
		// const progress = stream(0)
		// const abort = new AbortController()
		// const mailsAffected = await showProgressDialog("pleaseWait_msg", this.reapplyAllInboxRules(progress, abort), progress, {
		// 	middle: "reapplyInboxRules_action",
		// 	left: () => {
		// 		return [
		// 			{
		// 				label: "cancel_action",
		// 				click: () => {
		// 					abort.abort()
		//
		// 					// set progress to 100 so it doesn't look "stuck" even if it might take a few seconds to finish
		// 					progress(100)
		// 				},
		// 				type: ButtonType.Secondary,
		// 			} as const,
		// 		]
		// 	},
		// })
		// await Dialog.message(lang.getTranslation("moveItemsSuccess_msg", { "{count}": mailsAffected }))
	}
}

export async function applyRuleWithProgress(rules: Array<ExpandedInboxRule>, inboxRuleHandler: ExpandedInboxRuleHandler): Promise<void> {
	const progress = stream(0)
	const abort = new AbortController()
	const mailsAffected = await showProgressDialog("pleaseWait_msg", inboxRuleHandler.applyRulesToAllMails(progress, abort, rules), progress, {
		middle: "applyingInboxRules_label",
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

	const dialog = Dialog.editMediumDialog(
		{
			middle: "applyingInboxRules_label",
			right: [
				{
					type: ButtonType.Secondary,
					label: "ok_action",
					title: "ok_action",
					click: () => {
						dialog.onClose()
					},
				},
			],
		},
		TitleSection,
		{
			icon: Icons.Checkmark,
			title: lang.getTranslationText("inboxRulesAppliedSuccessfully_msg"),
			subTitle: mailsAffected === 0 ? lang.getTranslationText("noMatchingInboxRulesFound_msg") : undefined,
		},
		{
			height: "100%",
			"background-color": theme.surface_container,
		},
		{
			// plr is added elsewhere
			paddingTop: "24px",
			paddingBottom: "24px",
		},
	)

	dialog.show()
}
