import { EnvProvider, UpgradePromptType } from "@tutao/app-env"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces"
import Stream from "mithril/stream"
import stream from "mithril/stream"
import { mailLocator } from "../mailLocator"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { elementIdPart, elementIdToId, isSameId, OperationType } from "@tutao/meta"
import m, { Children } from "mithril"
import type { MailboxDetail, MailboxModel } from "../../common/mailFunctionality/MailboxModel"
import { lang, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import * as AddInboxRuleDialog from "./AddInboxRuleDialog"
import * as AddLegacyInboxRuleDialog from "./AddLegacyInboxRuleDialog"
import { createLegacyInboxRuleTemplate } from "./AddLegacyInboxRuleDialog"
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
import { ExpanderButton, ExpanderPanel } from "../../../ui/base/Expander"
import { getMailboxName, isUserMailbox } from "../../common/mailFunctionality/SharedMailUtils"
import { EntityClient } from "../../../platform-kit/network/EntityClient"
import { InboxRulesSettingsViewerModel } from "./InboxRulesSettingsViewerModel"
import { InboxRuleModel } from "../mail/model/InboxRuleModel"
import { MessageBanner } from "../../../ui/base/MessageBanner"
import { Switch } from "../../../ui/base/Switch"
import { IconButton } from "../../../ui/base/IconButton"
import { createDropdown, DropdownButtonAttrs } from "../../../ui/base/Dropdown"
import { ButtonSize } from "../../../ui/base/ButtonSize"
import { ExpandedInboxRuleHandler } from "../mail/model/ExpandedInboxRuleHandler"
import { ExpandedInboxRule, InboxRule, MailSet, MailSetEntryTypeRef, MailTypeRef, TutanotaPropertiesTypeRef } from "@tutao/entities/tutanota"
import { assertNotNull, isEmpty, isNotNull, lazyAsync, noOp, ofClass, promiseMap, splitInChunks } from "@tutao/utils"
import { InboxRuleActionType, InboxRuleConditionType, MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION } from "../../../entities/tutanota/Utils"
import { resolveMailSetEntries } from "../mail/model/MailSetListModel"
import { MoveMode } from "../mail/model/MailModel"
import { isOfflineError, LockedError } from "@tutao/rest-client/error"
import { ClientDetector } from "../../../platform-kit/app-env/boot/ClientDetector"
import { Icon, IconSize } from "../../../ui/base/Icon"
import { contextDropdown } from "../../../ui/base/GuiUtils"
import { ColumnWidth, createRowActions, Table, TableLineAttrs } from "../../../ui/base/Table"
import { getInboxRuleConditionTypeName } from "../mail/model/InboxRuleHandler"
import { LegacyInboxRuleHandler } from "../mail/model/LegacyInboxRuleHandler"

EnvProvider.assertMainOrNode()

class MailboxViewState {
	draggingOverRuleIndex: number | null = null
	draggingOverRule2ndHalf: boolean | null = null

	constructor(
		readonly mailboxDetail: MailboxDetail,
		public expanded: boolean,
	) {}
}

export class InboxRuleSettingsViewer implements UpdatableSettingsViewer {
	private model: InboxRulesSettingsViewerModel
	private mailboxes: MailboxViewState[] = []
	private draggingMailbox: MailboxViewState | null = null

	private legacyInboxRuleTableLines: Stream<Array<TableLineAttrs>> = stream<Array<TableLineAttrs>>([])
	private isUsingLegacyInboxRules: boolean | null = null

	constructor(
		readonly mailboxModel: MailboxModel,
		readonly entityClient: EntityClient,
		readonly inboxRuleModel: lazyAsync<InboxRuleModel>,
		readonly inboxRuleHandler: lazyAsync<ExpandedInboxRuleHandler | LegacyInboxRuleHandler>,
	) {
		this.model = new InboxRulesSettingsViewerModel(entityClient, inboxRuleModel, mailboxModel)
		this.model.init().then(async () => {
			this.isUsingLegacyInboxRules = (await this.inboxRuleModel()).isUsingLegacyInboxRules()
			m.redraw()
			if (this.isUsingLegacyInboxRules) {
				this.renderLegacyInboxRules()
			} else {
				// the user mailbox is the only one expanded by default
				this.mailboxes = this.model.mailboxDetails
					.map((mailboxDetail) => new MailboxViewState(mailboxDetail, isUserMailbox(mailboxDetail)))
					.sort((a, b) => Number(b.expanded) - Number(a.expanded))
				m.redraw()
			}
		})
	}

	async onEntityUpdatesReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		if ((await this.inboxRuleModel()).isUsingLegacyInboxRules()) {
			for (const update of updates) {
				if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && update.operation === OperationType.UPDATE) {
					this.renderLegacyInboxRules()
				}
			}
		} else {
			await this.model.onEntityEventsReceived(updates, eventOwnerGroupId)
		}
		m.redraw()
	}

	view(): Children {
		if (this.isUsingLegacyInboxRules === null) {
			return null
		}

		const tableLines = this.legacyInboxRuleTableLines()
		const hasRules = this.isUsingLegacyInboxRules
			? tableLines.length > 0
			: this.mailboxes.some((mailbox) => this.model.getOrderedInboxRules(mailbox.mailboxDetail.mailboxGroupRoot).length > 0)
		const isMobile = ClientDetector.get().isMobileDevice()

		// Making the scroll section based on mobile view allows for the title section to also be scrolled away
		const inboxRuleSectionClasses = `.overflow-hidden.flex-v-start${isMobile ? ".overflow-y-scroll-settings-page.scrollbar-gutter-stable-or-fallback" : ""}`
		// no gap to make drag&drop between the lines work, the components have padding that makes up for it
		const inboxRuleScrollClasses = `.flex-v-start${isMobile ? "" : ".overflow-y-scroll-settings-page.scrollbar-gutter-stable-or-fallback"}`
		const inboxRuleListClasses = `.mt-12${inboxRuleScrollClasses}`

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
							subTitle: m.trust(lang.getTranslationText("inboxRuleManagement_text")),
						}),
						this.isUsingLegacyInboxRules
							? [
									m(".mt-24", m(MenuTitle, { content: lang.get("inboxRulesSettings_action") })),
									tableLines.length > 0
										? m(
												inboxRuleListClasses,
												m(
													".skeleton-bg-2.border-radius",
													m(Table, {
														columnHeading: ["inboxRuleField_label", "inboxRuleValue_label", "inboxRuleTargetFolder_label"],
														columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
														showActionButtonColumn: true,
														lines: tableLines,
													}),
												),
											)
										: m(MessageBanner, {
												translation: lang.getTranslation("noEntries_msg"),
												type: "base",
											}),
								]
							: m(
									inboxRuleScrollClasses,
									this.mailboxes.map((mailbox) => this.renderMailbox(mailbox, this.mailboxes.length > 1)),
								),
					),
					m(
						".mt-16.flex-wrap.flex-end.gap-8",
						hasRules
							? m(SecondaryButton, {
									label: "reapplyInboxRules_action",
									width: "flex",
									onclick: () => this.reapplyInboxRules(),
								})
							: null,
						m(PrimaryButton, {
							label: "addInboxRule_action",
							width: "flex",
							onclick: () => {
								mailLocator.mailboxModel.getUserMailboxDetails().then(async (mailboxDetails) => {
									if (this.isUsingLegacyInboxRules) {
										AddLegacyInboxRuleDialog.show(
											mailboxDetails,
											createLegacyInboxRuleTemplate(InboxRuleConditionType.RECIPIENT_TO_EQUALS, ""),
										)
									} else {
										AddInboxRuleDialog.show(mailboxDetails, await this.inboxRuleModel(), null)
									}
								})
							},
						}),
					),
				],
			),
		])
	}

	private renderMailbox(mailbox: MailboxViewState, hasExpander: boolean): Children {
		const tableLines = this.renderInboxRuleTableLines(mailbox)
		const content =
			tableLines.length > 0 ? m(".flex-v-start", tableLines) : m(MessageBanner, { translation: lang.getTranslation("noEntries_msg"), type: "base" })
		return m(
			".mt-24",
			{ key: elementIdToId(mailbox.mailboxDetail.mailGroup._id) },
			hasExpander
				? [
						m(".flex-space-between.items-center", [
							m(MenuTitle, {
								content: `${lang.getTranslationText("inboxRulesSettings_action")} · ${getMailboxName(mailLocator.logins, mailbox.mailboxDetail)}`,
							}),
							m(ExpanderButton, {
								label: "show_action",
								expanded: mailbox.expanded,
								style: { paddingTop: "0" }, // top padding 0 to align with title
								onExpandedChange: () => {
									mailbox.expanded = !mailbox.expanded
								},
							}),
						]),
						m(ExpanderPanel, { expanded: mailbox.expanded }, m(".mt-12", content)),
					]
				: [m(MenuTitle, { content: lang.getTranslationText("inboxRulesSettings_action") }), m(".mt-12", content)],
		)
	}

	renderInboxRuleTableLines(mailboxViewState: MailboxViewState): Children[] {
		return this.model.getOrderedInboxRules(mailboxViewState.mailboxDetail.mailboxGroupRoot).map((rule, index, { length }) => {
			const dragBorder = ".border-accent.border-left-none.border-right-none"
			const dragBorderTop = `.pt-4.pb-4.border-bottom-none${dragBorder}${index === 0 ? ".border-md" : ".border-sm"}`
			const dragBorderBottom = `.border-top-none${dragBorder}${index === length - 1 ? ".border-md" : ".border-sm"}`

			const disabled = !this.isInboxRuleValid(rule)

			const maybeDragBorder = mailboxViewState.draggingOverRule2ndHalf
				? mailboxViewState.draggingOverRuleIndex === index
					? dragBorderBottom
					: mailboxViewState.draggingOverRuleIndex !== null && mailboxViewState.draggingOverRuleIndex + 1 === index
						? dragBorderTop
						: ""
				: mailboxViewState.draggingOverRuleIndex === index
					? dragBorderTop
					: mailboxViewState.draggingOverRuleIndex !== null && mailboxViewState.draggingOverRuleIndex - 1 === index
						? dragBorderBottom
						: ""

			// rule should never be null as we check that all rules in the order list are in the map, but get can still theoretically return undefined
			return m(
				`.pb-4.pt-4${maybeDragBorder}`,
				{
					// insert at position & clear state when we're finished dragging
					ondragend: async (ev: DragEvent) => {
						// insert
						await this.model.moveRuleToIndex(
							mailboxViewState.mailboxDetail.mailboxGroupRoot,
							rule,
							index,
							assertNotNull(mailboxViewState.draggingOverRuleIndex) + (mailboxViewState.draggingOverRule2ndHalf ? 1 : 0),
						)

						// clear state
						assertNotNull(ev.target as HTMLElement).setAttribute("draggable", "false")
						mailboxViewState.draggingOverRuleIndex = null
						mailboxViewState.draggingOverRule2ndHalf = null
						this.draggingMailbox = null
					},
					ondragstart: (ev: DragEvent) => {
						// The datatransfer is needed or the drag will not work on iOS
						assertNotNull(ev.dataTransfer).setData("text/plain", `${index}`)
						assertNotNull(ev.dataTransfer).effectAllowed = "move"

						mailboxViewState.draggingOverRuleIndex = index
						this.draggingMailbox = mailboxViewState
					},
					// insert when finished dragging
					// update our state while moving the rule around
					ondragover: (ev: DragEvent) => {
						// rules can only be moved within their own mailboxViewState
						if (this.draggingMailbox !== mailboxViewState) {
							return
						}

						const halfHeight = assertNotNull(ev.currentTarget as HTMLElement).offsetHeight / 2
						const mousePosition = ev.offsetY
						mailboxViewState.draggingOverRuleIndex = index
						mailboxViewState.draggingOverRule2ndHalf = mousePosition > halfHeight
						assertNotNull(ev.dataTransfer).dropEffect = "move"
						ev.stopPropagation()
						ev.preventDefault()
					},
					// show actions of edit button on right click as well
					oncontextmenu: (e: MouseEvent) => {
						// If text is selected show typical right click menu, so text can be copied
						// also disable while dragging so these two don't interfere on mobile
						if (
							window.getSelection()?.toString() === "" &&
							mailboxViewState.draggingOverRuleIndex == null &&
							!ClientDetector.get().isMobileDevice()
						) {
							contextDropdown(e, this.getActionsForRule(mailboxViewState, index, rule))
						}
					},
					role: "listitem",
				},
				m(
					Card,
					{
						style: {
							display: "grid",
							gridTemplateColumns: "auto 1fr auto auto auto",
							gridTemplateRows: "auto",
							alignItems: "center",
						},
					},
					[
						// reorder
						m(
							".cursor-grab",
							{
								// when beginning to try and drag the handle, set parent draggable (for touch & mouse)
								onmousedown: (e: Event) =>
									assertNotNull(e.currentTarget as HTMLElement).parentElement!.parentElement!.setAttribute("draggable", "true"),
								ontouchstart: (e: Event) =>
									assertNotNull(e.currentTarget as HTMLElement).parentElement!.parentElement!.setAttribute("draggable", "true"),
								// remove if the drag never started (we just clicked or something)
								onmouseup: (e: Event) =>
									assertNotNull(e.currentTarget as HTMLElement).parentElement!.parentElement!.setAttribute("draggable", "false"),
								ontouchend: (e: Event) =>
									assertNotNull(e.currentTarget as HTMLElement).parentElement!.parentElement!.setAttribute("draggable", "false"),
								oncontextmenu: (e: MouseEvent) => {
									// context menu here could interfere with our other events
									e.preventDefault()
									e.stopPropagation()
								},
							},
							m(
								".flex.center-vertically",
								{
									// title for tooltip
									title: lang.getTranslationText("move_action"),
									ariaLabel: lang.getTranslationText("move_action"),
								},
								m(Icon, {
									// hoverText here breaks styling, so tooltip is used
									icon: Icons.DragDrop,
									size: IconSize.PX32,
									style: {
										fill: theme.outline,
									},
								}),
							),
						),
						// name
						m(
							".selectable.text-ellipsis.plr-16",
							{
								// title for tooltip
								title: rule.name,
							},
							rule.name,
						),
						// disabled state icon
						disabled
							? m(Icon, { icon: Icons.ExclamationOutline, size: IconSize.PX32, title: lang.getTranslationText("inboxRuleInvalid_label") })
							: m(""),
						// toggle button
						m(
							".mr-8",
							{
								// don't context menu on input element, that feels weird
								oncontextmenu: (e: MouseEvent) => {
									e.preventDefault()
									e.stopPropagation()
								},
							},
							m(Switch, {
								ariaLabel: "deactivate_action",
								checked: rule.enabled,
								disabled,
								onclick: async (checked: boolean) => {
									rule.enabled = checked
									await this.model.saveInboxRule(rule)
								},
								key: "inbox-rule-switch-" + rule._id,
							}),
						),
						// actions button
						m(IconButton, {
							label: "edit_action",
							icon: Icons.More,
							size: ButtonSize.Small,
							click: createDropdown({
								lazyButtons: () => this.getActionsForRule(mailboxViewState, index, rule),
								width: 260,
							}),
						}),
					],
				),
			)
		})
	}

	isInboxRuleValid(rule: ExpandedInboxRule) {
		// a rule may become invalid when a folder or label is deleted
		return !rule.actions.some(
			(action) => action.value == null && [InboxRuleActionType.MOVE, InboxRuleActionType.LABEL].includes(action.type as InboxRuleActionType),
		)
	}

	private getActionsForRule(mailbox: MailboxViewState, index: number, rule: ExpandedInboxRule): DropdownButtonAttrs[] {
		return [
			{
				label: "edit_action" as TranslationKey,
				click: async () => AddInboxRuleDialog.show(mailbox.mailboxDetail, await this.inboxRuleModel(), rule),
			},
			index > 1
				? {
						label: "moveToTop_action" as TranslationKey,
						click: () => this.model.moveRuleToFirst(mailbox.mailboxDetail.mailboxGroupRoot, rule, index),
					}
				: null,
			index > 0
				? {
						label: "moveUp_action" as TranslationKey,
						click: () => this.model.moveRuleUp(mailbox.mailboxDetail.mailboxGroupRoot, rule, index),
					}
				: null,
			index < this.model.getOrderedInboxRules(mailbox.mailboxDetail.mailboxGroupRoot).length - 1
				? {
						label: "moveDown_action" as TranslationKey,
						click: () => this.model.moveRuleDown(mailbox.mailboxDetail.mailboxGroupRoot, rule, index),
					}
				: null,
			index < this.model.getOrderedInboxRules(mailbox.mailboxDetail.mailboxGroupRoot).length - 2
				? {
						label: "moveToBottom_action" as TranslationKey,
						click: () => this.model.moveRuleToLast(mailbox.mailboxDetail.mailboxGroupRoot, rule, index),
					}
				: null,
			{
				label: "delete_action" as TranslationKey,
				click: () => this.model.deleteInboxRule(rule),
			},
		].filter(isNotNull)
	}

	private async renderLegacyInboxRules(): Promise<void> {
		const props = await mailLocator.entityClient.load(TutanotaPropertiesTypeRef, mailLocator.logins.getUserController().props._id)

		mailLocator.mailboxModel.getUserMailboxDetails().then(async (mailboxDetails) => {
			const ruleLines = await promiseMap(props.inboxRules, async (rule: InboxRule, index: number) => {
				return {
					cells: [getInboxRuleConditionTypeName(rule.type), rule.value, await this.getTextForTarget(mailboxDetails, rule.targetFolder)],
					actionButtonAttrs: createRowActions(
						{
							getArray: () => props.inboxRules,
							updateInstance: () => mailLocator.entityClient.update(props).catch(ofClass(LockedError, noOp)),
						},
						rule,
						index,
						[
							{
								label: "edit_action",
								click: () => {
									AddLegacyInboxRuleDialog.show(mailboxDetails, rule)
								},
							},
						],
					),
				} satisfies TableLineAttrs
			})

			this.legacyInboxRuleTableLines(ruleLines)

			m.redraw()
		})
	}

	// This is kept around to support old inbox rules, remove once they are no longer used
	private async getTextForTarget(mailboxDetail: MailboxDetail, targetFolderId: IdTuple): Promise<string> {
		const folders = await mailLocator.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
		let folder = folders.getFolderById(elementIdPart(targetFolderId))

		if (folder) {
			return getMailSetName(folder)
		} else {
			return lang.getTranslationText("deletedFolder_label")
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
		const inboxRuleHandler = await mailLocator.processInboxHandler()
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

		const inboxRuleModel = await this.inboxRuleModel()
		if (inboxRuleModel.isUsingLegacyInboxRules()) {
			const progressStream = stream(0)
			const abort = new AbortController()
			const mailsAffected = await showProgressDialog("pleaseWait_msg", this.reapplyAllInboxRules(progressStream, abort), {
				progressStream,
				headerBarAttrs: {
					middle: "reapplyInboxRules_action",
					left: () => {
						return [
							{
								label: "cancel_action",
								click: () => {
									abort.abort()

									// set progress to 100 so it doesn't look "stuck" even if it might take a few seconds to finish
									progressStream(100)
								},
								type: ButtonType.Secondary,
							} as const,
						]
					},
				},
			})
			await Dialog.message(lang.getTranslation("moveItemsSuccess_msg", { "{count}": mailsAffected }))
		} else {
			const rulesPerMailbox = this.mailboxes.map(({ mailboxDetail }) => ({
				mailboxDetail,
				rules: this.model.getOrderedInboxRules(mailboxDetail.mailboxGroupRoot),
			}))
			await applyRulesWithProgress(rulesPerMailbox, <ExpandedInboxRuleHandler>await this.inboxRuleHandler())
		}
	}
}

export async function applyRulesWithProgress(
	rulesPerMailbox: ReadonlyArray<{ mailboxDetail: MailboxDetail; rules: Array<ExpandedInboxRule> }>,
	inboxRuleHandler: ExpandedInboxRuleHandler,
): Promise<void> {
	const progressStream = stream(0)
	const abort = new AbortController()
	const applyToAll = async () => {
		let mailsAffected = 0
		for (const [index, { mailboxDetail, rules }] of rulesPerMailbox.entries()) {
			if (abort.signal.aborted) break
			const mailboxProgress = stream(0)
			mailboxProgress.map((progress) => progressStream((index * 100 + progress) / rulesPerMailbox.length))
			mailsAffected += await inboxRuleHandler.applyRulesToAllMails(mailboxProgress, abort, mailboxDetail, rules)
		}
		return mailsAffected
	}
	const mailsAffected = await showProgressDialog("pleaseWait_msg", applyToAll(), {
		progressStream,
		headerBarAttrs: {
			middle: "applyingInboxRules_label",
			left: () => {
				return [
					{
						label: "cancel_action",
						click: () => {
							abort.abort()

							// set progress to 100 so it doesn't look "stuck" even if it might take a few seconds to finish
							progressStream(100)
						},
						type: ButtonType.Secondary,
					} as const,
				]
			},
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
