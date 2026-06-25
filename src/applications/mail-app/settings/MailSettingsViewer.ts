import m, { Children } from "mithril"
import {
	assertMainOrNode,
	Const,
	FeatureType,
	isApp,
	isBrowser,
	isOfflineStorageAvailable,
	UNDO_SEND_TIMEOUT_SECONDS,
	UpgradePromptType,
} from "../../../platform-kit/app-env"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { elementIdPart, isSameId, OperationType } from "../../../platform-kit/meta"
import { assertNotNull, isEmpty, LazyLoaded, noOp, ofClass, promiseMap, splitInChunks } from "../../../platform-kit/utils"
import { getInboxRuleTypeName } from "../mail/model/InboxRuleHandler"
import { MailAddressTable } from "../../common/settings/mailaddress/MailAddressTable.js"
import { Dialog } from "../../../ui/base/Dialog"
import { Icons } from "../../../ui/base/icons/Icons"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import type { MailboxDetail } from "../../common/mailFunctionality/MailboxModel.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { DropDownSelectorAttrs } from "../../../ui/base/DropDownSelector.js"
import { DropDownSelector } from "../../../ui/base/DropDownSelector.js"
import type { LegacyTextFieldAttrs } from "../../../ui/base/LegacyTextField.js"
import { LegacyTextField } from "../../../ui/base/LegacyTextField.js"
import type { TableAttrs, TableLineAttrs } from "../../../ui/base/Table.js"
import { ColumnWidth, createRowActions, Table } from "../../../ui/base/Table.js"
import * as AddInboxRuleDialog from "./AddInboxRuleDialog"
import { createInboxRuleTemplate } from "./AddInboxRuleDialog"
import { ExpanderButton, ExpanderPanel } from "../../../ui/base/Expander"
import { IndexingNotSupportedError } from "../../common/api/common/error/IndexingNotSupportedError"
import { isOfflineError, LockedError } from "../../../platform-kit/rest-client/error"
import { showEditOutOfOfficeNotificationDialog } from "./EditOutOfOfficeNotificationDialog"
import { formatActivateState, loadOutOfOfficeNotification } from "../../common/misc/OutOfOfficeNotificationUtils"
import { getSignatureType, show as showEditSignatureDialog } from "./EditSignatureDialog"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { deviceConfig, ListAutoSelectBehavior, MailListDisplayMode } from "../../common/misc/DeviceConfig"
import { IconButton, IconButtonAttrs } from "../../../ui/base/IconButton.js"
import { ButtonSize } from "../../../ui/base/ButtonSize.js"
import { getReportMovedMailsType } from "../../common/misc/MailboxPropertiesUtils.js"
import { MailAddressTableModel } from "../../common/settings/mailaddress/MailAddressTableModel.js"
import { getEnabledMailAddressesForGroupInfo } from "../../../platform-kit/network/GroupUtils.js"
import { formatStorageSize } from "../../../ui/utils/Formatter.js"
import { getDefaultSenderFromUser, getMailAddressDisplayText } from "../../common/mailFunctionality/SharedMailUtils.js"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { mailLocator } from "../mailLocator.js"
import { getFolderName } from "../mail/model/MailUtils.js"
import { resolveMailSetEntries } from "../mail/model/MailSetListModel"
import { MoveMode } from "../mail/model/MailModel"
import { ProgressBar, ProgressBarType } from "../../../ui/base/ProgressBar"
import { PrimaryButton } from "../../../ui/base/buttons/VariantButtons.js"
import {
	MailboxGroupRoot,
	MailboxProperties,
	MailboxPropertiesTypeRef,
	MailSet,
	MailSetEntryTypeRef,
	MailSetTypeRef,
	MailTypeRef,
	OutOfOfficeNotification,
	OutOfOfficeNotificationTypeRef,
	TutanotaProperties,
	TutanotaPropertiesTypeRef,
} from "@tutao/entities/tutanota"
import { InboxRuleType, MailSetKind, MAX_NBR_OF_MAILS_SYNC_OPERATION, ReportMovedMailsType } from "../../../entities/tutanota/Utils"
import { CustomerInfo } from "@tutao/entities/sys"
import { ButtonType } from "../../../ui/base/Button"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { windowFacade } from "../../common/misc/WindowFacade"

assertMainOrNode()

const MINIMUM_DISPLAYED_STORAGE_IN_BYTES = 10000

export class MailSettingsViewer implements UpdatableSettingsViewer {
	_signature: Stream<string>
	_mailboxProperties: LazyLoaded<MailboxProperties>
	_reportMovedMails: ReportMovedMailsType
	_defaultSender: string
	_defaultUnconfidential: boolean | null
	_sendPlaintext: boolean | null
	_noAutomaticContacts: boolean | null
	_enableMailIndexing: boolean | null
	_inboxRulesTableLines: Stream<Array<TableLineAttrs>>
	_inboxRulesExpanded: Stream<boolean>
	_indexStateWatch: Stream<any> | null
	_outOfOfficeNotification: LazyLoaded<OutOfOfficeNotification | null>
	_outOfOfficeStatus: Stream<string> // stores the status label, based on whether the notification is/ or will really be activated (checking start time/ end time)
	private _storageFieldValue: Stream<string>
	private customerInfo: CustomerInfo | null
	private mailAddressTableModel: MailAddressTableModel | null = null
	private mailAddressTableExpanded: boolean

	constructor() {
		this._defaultSender = getDefaultSenderFromUser(mailLocator.logins.getUserController())
		this._signature = stream(getSignatureType(mailLocator.logins.getUserController().props).name)
		this._reportMovedMails = getReportMovedMailsType(null) // loaded later
		this._defaultUnconfidential = mailLocator.logins.getUserController().props.defaultUnconfidential
		this._sendPlaintext = mailLocator.logins.getUserController().props.sendPlaintextOnly
		this._noAutomaticContacts = mailLocator.logins.getUserController().props.noAutomaticContacts
		this._enableMailIndexing = mailLocator.search.indexState().mailIndexEnabled
		this._inboxRulesExpanded = stream<boolean>(false)
		this.mailAddressTableExpanded = false
		this._inboxRulesTableLines = stream<Array<TableLineAttrs>>([])
		this._outOfOfficeStatus = stream(lang.get("deactivated_label"))
		this._indexStateWatch = null
		// normally we would maybe like to get it as an argument but these viewers are created in an odd way
		mailLocator.mailAddressTableModelForOwnMailbox().then((model) => {
			this.mailAddressTableModel = model
			m.redraw()
		})
		m.redraw()

		this._updateInboxRules(mailLocator.logins.getUserController().props)

		this._mailboxProperties = new LazyLoaded(async () => {
			const mailboxGroupRoot = await this.getMailboxGroupRoot()
			return mailLocator.mailboxModel.getMailboxProperties(mailboxGroupRoot)
		})

		this._updateMailboxPropertiesSettings()

		this._outOfOfficeNotification = new LazyLoaded(() => loadOutOfOfficeNotification(), null)

		this._outOfOfficeNotification.getAsync().then(() => this._updateOutOfOfficeNotification())

		this.customerInfo = null
		this._storageFieldValue = stream("")
	}

	async oninit(): Promise<void> {
		this.customerInfo = await mailLocator.logins.getUserController().loadCustomerInfo()
		this.updateStorageField(this.customerInfo).then(() => m.redraw())
	}

	private async getMailboxGroupRoot(): Promise<MailboxGroupRoot> {
		// For now we assume user mailbox, in the future we should specify which mailbox we are configuring
		const { mailboxGroupRoot } = await mailLocator.mailboxModel.getUserMailboxDetails()
		return mailboxGroupRoot
	}

	private async updateStorageField(customerInfo: CustomerInfo): Promise<void> {
		const user = mailLocator.logins.getUserController().user
		let sizeInBytes = Number(await mailLocator.userManagementFacade.readUsedUserStorage(user))
		// Done to avoid displaying negative storage capacity to the user, storage counter will be modified in the future to fix the negative values bug
		let sizeInBytesCorrected = sizeInBytes > MINIMUM_DISPLAYED_STORAGE_IN_BYTES ? sizeInBytes : MINIMUM_DISPLAYED_STORAGE_IN_BYTES
		const usedStorage = formatStorageSize(sizeInBytesCorrected)
		const totalStorage = formatStorageSize(Number(customerInfo.perUserStorageCapacity) * Const.MEMORY_GB_FACTOR)
		this._storageFieldValue(
			lang.get("amountUsedOf_label", {
				"{amount}": usedStorage,
				"{totalAmount}": totalStorage,
			}),
		)
	}

	view(): Children {
		this._defaultSender = getDefaultSenderFromUser(mailLocator.logins.getUserController())
		const defaultSenderAttrs: DropDownSelectorAttrs<string> = {
			label: "defaultSenderMailAddress_label",
			items: getEnabledMailAddressesForGroupInfo(mailLocator.logins.getUserController().userGroupInfo)
				.sort()
				.map((a) => ({
					name: a,
					value: a,
				})),
			selectedValue: this._defaultSender,
			selectedValueDisplay: getMailAddressDisplayText(
				this.mailAddressTableModel?.addresses().find(({ address }) => address === this._defaultSender)?.name ?? "",
				this._defaultSender,
				false,
			),
			selectionChangedHandler: (defaultSenderAddress) => {
				mailLocator.logins.getUserController().props.defaultSender = defaultSenderAddress
				mailLocator.entityClient.update(mailLocator.logins.getUserController().props)
			},
			helpLabel: () => lang.get("defaultSenderMailAddressInfo_msg"),
			dropdownWidth: 300,
		}

		const changeSignatureButtonAttrs: IconButtonAttrs = {
			label: "userEmailSignature_label",
			click: () => showEditSignatureDialog(mailLocator.logins.getUserController().props),
			icon: Icons.PenFilled,
			size: ButtonSize.Compact,
		}
		const signatureAttrs: LegacyTextFieldAttrs = {
			label: "userEmailSignature_label",
			value: this._signature(),
			oninput: this._signature,
			isReadOnly: true,
			injectionsRight: () => [m(IconButton, changeSignatureButtonAttrs)],
		}

		const editOutOfOfficeNotificationButtonAttrs: IconButtonAttrs = {
			label: "outOfOfficeNotification_title",
			click: () => {
				this._outOfOfficeNotification.getAsync().then((notification) => showEditOutOfOfficeNotificationDialog(notification))
			},
			icon: Icons.PenFilled,
			size: ButtonSize.Compact,
		}

		const outOfOfficeAttrs: LegacyTextFieldAttrs = {
			label: "outOfOfficeNotification_title",
			value: this._outOfOfficeStatus(),
			oninput: this._outOfOfficeStatus,
			isReadOnly: true,
			injectionsRight: () => [m(IconButton, editOutOfOfficeNotificationButtonAttrs)],
		}

		const defaultUnconfidentialAttrs: DropDownSelectorAttrs<boolean> = {
			label: "defaultExternalDelivery_label",
			items: [
				{
					name: lang.get("confidential_action"),
					value: false,
				},
				{
					name: lang.get("nonConfidential_action"),
					value: true,
				},
			],
			selectedValue: this._defaultUnconfidential,
			selectionChangedHandler: (v) => {
				mailLocator.logins.getUserController().props.defaultUnconfidential = v
				mailLocator.entityClient.update(mailLocator.logins.getUserController().props)
			},
			helpLabel: () => lang.get("defaultExternalDeliveryInfo_msg"),
			dropdownWidth: 250,
		}
		const sendPlaintextAttrs: DropDownSelectorAttrs<boolean> = {
			label: "externalFormatting_label",
			helpLabel: () => lang.get("externalFormattingInfo_msg"),
			items: [
				{
					name: lang.get("html_action"),
					value: false,
				},
				{
					name: lang.get("plaintext_action"),
					value: true,
				},
			],
			selectedValue: this._sendPlaintext,
			selectionChangedHandler: (v) => {
				mailLocator.logins.getUserController().props.sendPlaintextOnly = v
				mailLocator.entityClient.update(mailLocator.logins.getUserController().props)
			},
			dropdownWidth: 250,
		}
		const enableMailIndexingAttrs: DropDownSelectorAttrs<boolean> = {
			label: "searchMailbox_label",
			helpLabel: () => lang.get("enableSearchMailbox_msg"),
			items: [
				{
					name: lang.get("activated_label"),
					value: true,
				},
				{
					name: lang.get("deactivated_label"),
					value: false,
				},
			],
			selectedValue: this._enableMailIndexing,
			selectionChangedHandler: (mailIndexEnabled) => {
				if (mailIndexEnabled) {
					showProgressDialog("pleaseWait_msg", mailLocator.indexerFacade.enableMailIndexing()).catch(
						ofClass(IndexingNotSupportedError, () => {
							Dialog.message(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
						}),
					)
				} else {
					showProgressDialog("pleaseWait_msg", mailLocator.indexerFacade.disableMailIndexing())
				}
			},
			dropdownWidth: 250,
		}
		const behaviorAfterMoveEmailAction: DropDownSelectorAttrs<ListAutoSelectBehavior> = {
			label: "behaviorAfterMovingEmail_label",
			helpLabel: () => "",
			items: [
				{
					name: lang.get("showOlder_label"),
					value: ListAutoSelectBehavior.OLDER,
				},
				{
					name: lang.get("showNewer_label"),
					value: ListAutoSelectBehavior.NEWER,
				},
				{
					name: lang.get("showNone_label"),
					value: ListAutoSelectBehavior.NONE,
				},
			],
			selectedValue: deviceConfig.getMailAutoSelectBehavior(),
			selectionChangedHandler: (behavior) => deviceConfig.setMailAutoSelectBehavior(behavior),
			dropdownWidth: 250,
		}
		const reportMovedMailsAttrs = this.makeReportMovedMailsDropdownAttrs()
		const templateRule = createInboxRuleTemplate(InboxRuleType.RECIPIENT_TO_EQUALS, "")
		const addInboxRuleButtonAttrs: IconButtonAttrs = {
			label: "addInboxRule_action",
			click: () => mailLocator.mailboxModel.getUserMailboxDetails().then((mailboxDetails) => AddInboxRuleDialog.show(mailboxDetails, templateRule)),
			icon: Icons.Plus,
			size: ButtonSize.Compact,
		}
		const inboxRulesTableAttrs: TableAttrs = {
			columnHeading: ["inboxRuleField_label", "inboxRuleValue_label", "inboxRuleTargetFolder_label"],
			columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: addInboxRuleButtonAttrs,
			lines: this._inboxRulesTableLines(),
		}
		const conversationViewDropdownAttrs: DropDownSelectorAttrs<boolean> = {
			label: "conversationViewPref_label",
			// show all means "false" because the pref is to "disable" it, but
			// we disabled it as "enabled"
			items: [
				{ name: lang.get("showAllMailsInThread_label"), value: false },
				{ name: lang.get("showOnlySelectedMail_label"), value: true },
			],
			selectedValue: deviceConfig.getConversationViewShowOnlySelectedMail(),
			selectionChangedHandler: (arg: boolean) => {
				deviceConfig.setConversationViewShowOnlySelectedMail(arg)
			},
			dropdownWidth: 350,
		}
		const mailListDisplayMode: DropDownSelectorAttrs<MailListDisplayMode> = {
			label: "mailListGrouping_label",
			// Don't group means normal view instead of conversation
			items: [
				{ name: lang.get("mailListGroupingDontGroup_label"), value: MailListDisplayMode.MAILS },
				{
					name: lang.get("mailListGroupingGroupByConversation_label"),
					value: MailListDisplayMode.CONVERSATIONS,
				},
			],
			selectedValue: deviceConfig.getConversationViewShowOnlySelectedMail() ? MailListDisplayMode.MAILS : deviceConfig.getMailListDisplayMode(),
			disabled: deviceConfig.getConversationViewShowOnlySelectedMail(),
			helpLabel: () => lang.get("mailListGroupingHelp_msg"),
			selectionChangedHandler: (arg: MailListDisplayMode) => {
				deviceConfig.setMailListDisplayMode(arg)
			},
			dropdownWidth: 350,
		}
		return [
			m(
				"#user-settings.fill-absolute.scroll.plr-24.pb-48",
				{
					role: "group",
					oncreate: () => {
						this._indexStateWatch = mailLocator.search.indexState.map((newValue) => {
							this._enableMailIndexing = newValue.mailIndexEnabled

							m.redraw()
						})
					},
					onremove: () => {
						if (this._indexStateWatch) {
							this._indexStateWatch.end(true)
						}
					},
					"data-testid": "section:email-settings",
				},
				[
					this.customerInfo != null && Number(this.customerInfo.perUserStorageCapacity) > 0
						? [
								m("#storagecapacity.h4.mt-32", lang.get("storageCapacity_label")),
								m(LegacyTextField, {
									label: "storageCapacity_label",
									value: this._storageFieldValue(),
									oninput: this._storageFieldValue,
									isReadOnly: true,
								}),
							]
						: null,
					m(".h4.mt-32#general", lang.get("general_label")),
					m("#conversationthread", m(DropDownSelector, conversationViewDropdownAttrs)),
					m("#maillistgrouping", m(DropDownSelector, mailListDisplayMode)),
					isBrowser() ? m("#mailindexing", m(DropDownSelector, enableMailIndexingAttrs)) : null,
					m("#behavioraftermovingemail", m(DropDownSelector, behaviorAfterMoveEmailAction)),
					m(".h4.mt-32#emailsending", lang.get("emailSending_label")),
					m("#defaultsender", m(DropDownSelector, defaultSenderAttrs)),
					m("#signature", m(LegacyTextField, signatureAttrs)),
					mailLocator.logins.isEnabled(FeatureType.InternalCommunication) ? null : m(DropDownSelector, defaultUnconfidentialAttrs),
					mailLocator.logins.isEnabled(FeatureType.InternalCommunication) ? null : m(DropDownSelector, sendPlaintextAttrs),
					m("#spamreports", m(DropDownSelector, reportMovedMailsAttrs)),
					m("#outofoffice", m(LegacyTextField, outOfOfficeAttrs)),
					m("#undoSend", m(DropDownSelector, this.makeUndoSendMailsDropdownAttrs())),
					this.renderLocalDataSection(),
					this.mailAddressTableModel
						? m(
								"#mailaddresses",
								m(MailAddressTable, {
									model: this.mailAddressTableModel,
									expanded: this.mailAddressTableExpanded,
									onExpanded: (newExpanded) => (this.mailAddressTableExpanded = newExpanded),
								}),
							)
						: null,
					mailLocator.logins.isEnabled(FeatureType.InternalCommunication)
						? null
						: [
								m(".flex-space-between.items-center.mt-32.mb-8", [
									m(".h4#inboxrules", lang.get("inboxRulesSettings_action")),
									m(ExpanderButton, {
										label: "showInboxRules_action",
										expanded: this._inboxRulesExpanded(),
										onExpandedChange: this._inboxRulesExpanded,
									}),
								]),
								m(
									ExpanderPanel,
									{
										expanded: this._inboxRulesExpanded(),
									},
									m(Table, inboxRulesTableAttrs),
								),
								m(
									".small",
									lang.get("nbrOfInboxRules_msg", {
										"{1}": mailLocator.logins.getUserController().props.inboxRules.length,
									}),
								),
								m(
									".flex-start.mt-8",
									m(
										".flex",
										m(PrimaryButton, {
											label: "reapplyInboxRules_action",
											onclick: async () => {
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
											},
										}),
									),
								),
							],
				],
			),
		]
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

	private renderLocalDataSection(): Children {
		if (isOfflineStorageAvailable()) {
			return [m(".h4.mt-32#localdata", lang.get("localDataSection_label")), this.renderRebuildSearchIndex(), this.renderClearCacheButton()]
		} else {
			return null
		}
	}

	private renderRebuildSearchIndex() {
		const searchIndexStateInfo = mailLocator.search.indexState()
		return m(
			"",
			searchIndexStateInfo.progress !== 0
				? [
						m(
							".mt-16.full-width.button-content.rel.border-radius-12.nav-bg",
							m(ProgressBar, {
								progress: searchIndexStateInfo.progress / 100.0,
								type: ProgressBarType.Large,
							}),
						),
						m("small.mt-12", lang.getTranslationText("indexingEmails_msg")),
					]
				: [
						m(
							".mt-16",
							m(PrimaryButton, {
								width: "flex",
								label: "rebuildSearchIndex_action",
								onclick: () => this.confirmRebuildSearchIndex(),
							}),
						),
						m("small.mt-12", lang.getTranslationText("reIndexLocalData_msg")),
					],
		)
	}

	private async confirmRebuildSearchIndex(): Promise<void> {
		const confirm = await Dialog.confirm(
			lang.makeTranslation(
				"reIndexLocalData_msg",
				`${lang.getTranslationText("reIndexLocalData_msg")}\n\n${lang.getTranslationText("reIndexRunInBackground_msg")}`,
			),
		)
		if (confirm) {
			await mailLocator.indexerFacade.rebuildMailIndex()
		}
	}

	private renderClearCacheButton() {
		return m("", [
			m(
				".mt-16",
				m(PrimaryButton, {
					width: "flex",
					label: "clearCache_action",
					onclick: () => this.confirmClearCache(),
				}),
			),
			m("small.mt-12", lang.getTranslationText("clearCache_msg")),
		])
	}

	private async confirmClearCache(): Promise<void> {
		const confirm = await Dialog.confirm(lang.getTranslation("clearCacheConfirm_msg"))
		if (confirm) {
			await showProgressDialog(
				"clearCache_action",
				Promise.resolve().then(async () => {
					await mailLocator.cacheStorage.purgeStorage()

					// we need to reload the page, as purging storage will put the client in a broken state
					await mailLocator.logins.logout(false)
					await windowFacade.reload({})
				}),
			)
		}
	}

	_updateTutanotaPropertiesSettings(props: TutanotaProperties) {
		if (props.defaultSender) {
			this._defaultSender = props.defaultSender
		}

		this._defaultUnconfidential = props.defaultUnconfidential

		this._noAutomaticContacts = props.noAutomaticContacts

		this._sendPlaintext = props.sendPlaintextOnly

		this._signature(getSignatureType(props).name)
	}

	_updateMailboxPropertiesSettings() {
		this._mailboxProperties.getAsync().then((props) => {
			this._reportMovedMails = getReportMovedMailsType(props)

			m.redraw()
		})
	}

	_updateInboxRules(props: TutanotaProperties): void {
		mailLocator.mailboxModel.getUserMailboxDetails().then(async (mailboxDetails) => {
			this._inboxRulesTableLines(
				await promiseMap(props.inboxRules, async (rule, index) => {
					return {
						cells: [getInboxRuleTypeName(rule.type), rule.value, await this.getTextForTarget(mailboxDetails, rule.targetFolder)],
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
									click: () => AddInboxRuleDialog.show(mailboxDetails, rule),
								},
							],
						),
					}
				}),
			)

			m.redraw()
		})
	}

	_updateOutOfOfficeNotification(): void {
		const notification = this._outOfOfficeNotification.getLoaded()

		this._outOfOfficeStatus(formatActivateState(notification))

		m.redraw()
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

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			const { operation } = update
			if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				const props = await mailLocator.entityClient.load(TutanotaPropertiesTypeRef, mailLocator.logins.getUserController().props._id)
				this._updateTutanotaPropertiesSettings(props)
				this._updateInboxRules(props)
			} else if (isUpdateForTypeRef(MailSetTypeRef, update)) {
				this._updateInboxRules(mailLocator.logins.getUserController().props)
			} else if (isUpdateForTypeRef(OutOfOfficeNotificationTypeRef, update)) {
				this._outOfOfficeNotification.reload().then(() => this._updateOutOfOfficeNotification())
			} else if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update)) {
				this._mailboxProperties.reload().then(() => this._updateMailboxPropertiesSettings())
			}
		}
		m.redraw()
	}

	makeUndoSendMailsDropdownAttrs(): DropDownSelectorAttrs<boolean> {
		return {
			label: "undoSend_label",
			items: [
				{ name: lang.get("activated_label"), value: true },
				{ name: lang.get("deactivated_label"), value: false },
			],
			selectedValue: deviceConfig.getIsUndoSendEnabled(),
			selectionChangedHandler: (arg: boolean) => {
				deviceConfig.setIsUndoSendEnabled(arg)
			},
			dropdownWidth: 350,
			helpLabel: () =>
				lang.getTranslation("undoSendMail_msg", {
					"{time}": UNDO_SEND_TIMEOUT_SECONDS,
				}).text,
		}
	}

	makeReportMovedMailsDropdownAttrs(): DropDownSelectorAttrs<ReportMovedMailsType> {
		return {
			label: "spamReports_label",
			helpLabel: () => lang.get("unencryptedTransmission_msg"),
			items: [
				{
					name: lang.get("alwaysAsk_action"),
					value: ReportMovedMailsType.ALWAYS_ASK,
				},
				{
					name: lang.get("alwaysReport_action"),
					value: ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM,
				},
				{
					name: lang.get("neverReport_action"),
					value: ReportMovedMailsType.NEVER,
				},
			],
			selectedValue: this._reportMovedMails,
			selectionChangedHandler: async (reportMovedMails) => {
				const mailboxGroupRoot = await this.getMailboxGroupRoot()
				await mailLocator.mailModel.saveReportMovedMails(mailboxGroupRoot, reportMovedMails)
			},
			dropdownWidth: 250,
		}
	}
}
