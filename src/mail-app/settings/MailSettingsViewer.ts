import m, { Children } from "mithril"
import { assertMainOrNode, isApp } from "../../common/api/common/Env"
import { lang } from "../../common/misc/LanguageViewModel"
import type { MailboxGroupRoot, MailboxProperties, OutOfOfficeNotification, TutanotaProperties } from "../../common/api/entities/tutanota/TypeRefs.js"
import {
	MailboxPropertiesTypeRef,
	MailFolderTypeRef,
	OutOfOfficeNotificationTypeRef,
	TutanotaPropertiesTypeRef,
} from "../../common/api/entities/tutanota/TypeRefs.js"
import { Const, FeatureType, InboxRuleType, OperationType, ReportMovedMailsType } from "../../common/api/common/TutanotaConstants"
import { assertNotNull, capitalizeFirstLetter, defer, LazyLoaded, noOp, ofClass } from "@tutao/tutanota-utils"
import { getInboxRuleTypeName } from "../mail/model/InboxRuleHandler"
import { MailAddressTable } from "../../common/settings/mailaddress/MailAddressTable.js"
import { Dialog } from "../../common/gui/base/Dialog"
import { Icons } from "../../common/gui/base/icons/Icons"
import { showProgressDialog } from "../../common/gui/dialogs/ProgressDialog"
import type { MailboxDetail } from "../../common/mailFunctionality/MailboxModel.js"
import stream from "mithril/stream"
import Stream from "mithril/stream"

import type { DropDownSelectorAttrs } from "../../common/gui/base/DropDownSelector.js"
import { DropDownSelector } from "../../common/gui/base/DropDownSelector.js"
import type { TextFieldAttrs } from "../../common/gui/base/TextField.js"
import { TextField, TextFieldType } from "../../common/gui/base/TextField.js"
import type { TableAttrs, TableLineAttrs } from "../../common/gui/base/Table.js"
import { ColumnWidth, createRowActions, Table } from "../../common/gui/base/Table.js"
import * as AddInboxRuleDialog from "./AddInboxRuleDialog"
import { createInboxRuleTemplate } from "./AddInboxRuleDialog"
import { ExpanderButton, ExpanderPanel } from "../../common/gui/base/Expander"
import { IndexingNotSupportedError } from "../../common/api/common/error/IndexingNotSupportedError"
import { LockedError } from "../../common/api/common/error/RestError"
import { showEditOutOfOfficeNotificationDialog } from "./EditOutOfOfficeNotificationDialog"
import { formatActivateState, loadOutOfOfficeNotification } from "../../common/misc/OutOfOfficeNotificationUtils"
import { getSignatureType, show as showEditSignatureDialog } from "./EditSignatureDialog"
import { OfflineStorageSettingsModel } from "./OfflineStorageSettings"
import { showNotAvailableForFreeDialog } from "../../common/misc/SubscriptionDialogs"
import { deviceConfig, ListAutoSelectBehavior } from "../../common/misc/DeviceConfig"
import { IconButton, IconButtonAttrs } from "../../common/gui/base/IconButton.js"
import { ButtonSize } from "../../common/gui/base/ButtonSize.js"
import { getReportMovedMailsType } from "../../common/misc/MailboxPropertiesUtils.js"
import { MailAddressTableModel } from "../../common/settings/mailaddress/MailAddressTableModel.js"
import { getEnabledMailAddressesForGroupInfo } from "../../common/api/common/utils/GroupUtils.js"
import { formatStorageSize } from "../../common/misc/Formatter.js"
import { CustomerInfo } from "../../common/api/entities/sys/TypeRefs.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../common/api/common/utils/EntityUpdateUtils.js"
import { getMailAddressDisplayText } from "../../common/mailFunctionality/SharedMailUtils.js"
import { UpdatableSettingsViewer } from "../../common/settings/Interfaces.js"
import { mailLocator } from "../mailLocator.js"
import { getDefaultSenderFromUser, getFolderName } from "../mail/model/MailUtils.js"
import { elementIdPart } from "../../common/api/common/utils/EntityUtils.js"

assertMainOrNode()

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

	private offlineStorageSettings = new OfflineStorageSettingsModel(mailLocator.logins.getUserController(), deviceConfig)

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

		this.offlineStorageSettings.init().then(() => m.redraw())
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
		const usedStorage = formatStorageSize(Number(await mailLocator.userManagementFacade.readUsedUserStorage(user)))
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
			title: "userEmailSignature_label",
			click: () => showEditSignatureDialog(mailLocator.logins.getUserController().props),
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		}
		const signatureAttrs: TextFieldAttrs = {
			label: "userEmailSignature_label",
			value: this._signature(),
			oninput: this._signature,
			isReadOnly: true,
			injectionsRight: () => [m(IconButton, changeSignatureButtonAttrs)],
		}

		const editOutOfOfficeNotificationButtonAttrs: IconButtonAttrs = {
			title: "outOfOfficeNotification_title",
			click: () => {
				this._outOfOfficeNotification.getAsync().then((notification) => showEditOutOfOfficeNotificationDialog(notification))
			},
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		}

		const outOfOfficeAttrs: TextFieldAttrs = {
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
			title: "addInboxRule_action",
			click: () => mailLocator.mailboxModel.getUserMailboxDetails().then((mailboxDetails) => AddInboxRuleDialog.show(mailboxDetails, templateRule)),
			icon: Icons.Add,
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
		return [
			m(
				"#user-settings.fill-absolute.scroll.plr-l.pb-xl",
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
				},
				[
					this.customerInfo != null && Number(this.customerInfo.perUserStorageCapacity) > 0
						? [
								m(".h4.mt-l", lang.get("storageCapacity_label")),
								m(TextField, {
									label: "storageCapacity_label",
									value: this._storageFieldValue(),
									oninput: this._storageFieldValue,
									isReadOnly: true,
								}),
						  ]
						: null,
					m(".h4.mt-l", lang.get("general_label")),
					m(DropDownSelector, conversationViewDropdownAttrs),
					m(DropDownSelector, enableMailIndexingAttrs),
					m(DropDownSelector, behaviorAfterMoveEmailAction),
					m(".h4.mt-l", lang.get("emailSending_label")),
					m(DropDownSelector, defaultSenderAttrs),
					m(TextField, signatureAttrs),
					mailLocator.logins.isEnabled(FeatureType.InternalCommunication) ? null : m(DropDownSelector, defaultUnconfidentialAttrs),
					mailLocator.logins.isEnabled(FeatureType.InternalCommunication) ? null : m(DropDownSelector, sendPlaintextAttrs),
					m(DropDownSelector, reportMovedMailsAttrs),
					m(TextField, outOfOfficeAttrs),
					this.renderLocalDataSection(),
					this.mailAddressTableModel
						? m(MailAddressTable, {
								model: this.mailAddressTableModel,
								expanded: this.mailAddressTableExpanded,
								onExpanded: (newExpanded) => (this.mailAddressTableExpanded = newExpanded),
						  })
						: null,
					mailLocator.logins.isEnabled(FeatureType.InternalCommunication)
						? null
						: [
								m(".flex-space-between.items-center.mt-l.mb-s", [
									m(".h4", lang.get("inboxRulesSettings_action")),
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
						  ],
				],
			),
		]
	}

	private renderLocalDataSection(): Children {
		if (!this.offlineStorageSettings.available()) {
			return null
		}

		return [
			m(".h4.mt-l", lang.get("localDataSection_label")),
			m(TextField, {
				label: "emptyString_msg",
				// Negative upper margin to make up for no label
				class: "mt-negative-s",
				value: lang.get("storedDataTimeRange_label", { "{numDays}": this.offlineStorageSettings.getTimeRange() }),
				isReadOnly: true,
				injectionsRight: () => [
					m(IconButton, {
						title: "edit_action",
						click: () => this.onEditStoredDataTimeRangeClicked(),
						icon: Icons.Edit,
						size: ButtonSize.Compact,
					}),
				],
			}),
		]
	}

	private async onEditStoredDataTimeRangeClicked() {
		if (mailLocator.logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog()
		} else {
			await showEditStoredDataTimeRangeDialog(this.offlineStorageSettings)
			m.redraw()
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
		mailLocator.mailboxModel.getUserMailboxDetails().then((mailboxDetails) => {
			this._inboxRulesTableLines(
				props.inboxRules.map((rule, index) => {
					return {
						cells: [getInboxRuleTypeName(rule.type), rule.value, this._getTextForTarget(mailboxDetails, rule.targetFolder)],
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

	_getTextForTarget(mailboxDetail: MailboxDetail, targetFolderId: IdTuple): string {
		const folders = mailLocator.mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id)
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
			} else if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
				this._updateInboxRules(mailLocator.logins.getUserController().props)
			} else if (isUpdateForTypeRef(OutOfOfficeNotificationTypeRef, update)) {
				this._outOfOfficeNotification.reload().then(() => this._updateOutOfOfficeNotification())
			} else if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update)) {
				this._mailboxProperties.reload().then(() => this._updateMailboxPropertiesSettings())
			}
		}
		m.redraw()
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

async function showEditStoredDataTimeRangeDialog(settings: OfflineStorageSettingsModel) {
	const initialTimeRange = settings.getTimeRange()
	let timeRange = initialTimeRange

	const newTimeRangeDeferred = defer<number>()
	const dialog = Dialog.showActionDialog({
		title: "",
		child: () =>
			m(TextField, {
				label: () => capitalizeFirstLetter(lang.get("days_label")),
				helpLabel: () => lang.get("storedDataTimeRangeHelpText_msg"),
				type: TextFieldType.Number,
				value: `${timeRange}`,
				oninput: (newValue) => {
					timeRange = Math.max(0, Number(newValue))
				},
			}),
		okAction: async () => {
			try {
				if (initialTimeRange !== timeRange) {
					await settings.setTimeRange(timeRange)
				}
			} finally {
				dialog.close()
			}
		},
	})

	return newTimeRangeDeferred.promise
}
