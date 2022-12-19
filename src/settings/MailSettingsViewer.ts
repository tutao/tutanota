import m, {Children} from "mithril"
import {assertMainOrNode, isApp} from "../api/common/Env"
import {lang} from "../misc/LanguageViewModel"
import type {MailboxGroupRoot, MailboxProperties, OutOfOfficeNotification, TutanotaProperties} from "../api/entities/tutanota/TypeRefs.js"
import {MailboxPropertiesTypeRef, MailFolderTypeRef, OutOfOfficeNotificationTypeRef, TutanotaPropertiesTypeRef} from "../api/entities/tutanota/TypeRefs.js"
import {FeatureType, InboxRuleType, OperationType, ReportMovedMailsType} from "../api/common/TutanotaConstants"
import {capitalizeFirstLetter, defer, LazyLoaded, noOp, ofClass} from "@tutao/tutanota-utils"
import {getInboxRuleTypeName} from "../mail/model/InboxRuleHandler"
import {MailAddressTable} from "./mailaddress/MailAddressTable.js"
import {Dialog} from "../gui/base/Dialog"
import {logins} from "../api/main/LoginController"
import {getDefaultSenderFromUser, getFolderName} from "../mail/model/MailUtils"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {MailboxDetail} from "../mail/model/MailModel"
import {locator} from "../api/main/MainLocator"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelector.js"
import {DropDownSelector} from "../gui/base/DropDownSelector.js"
import type {TextFieldAttrs} from "../gui/base/TextField.js"
import {TextField, TextFieldType} from "../gui/base/TextField.js"
import type {TableAttrs, TableLineAttrs} from "../gui/base/Table.js"
import {ColumnWidth, createRowActions, Table} from "../gui/base/Table.js"
import * as AddInboxRuleDialog from "./AddInboxRuleDialog"
import {createInboxRuleTemplate} from "./AddInboxRuleDialog"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {IdentifierListViewer} from "./IdentifierListViewer"
import {IndexingNotSupportedError} from "../api/common/error/IndexingNotSupportedError"
import {LockedError} from "../api/common/error/RestError"
import {getEnabledMailAddressesForGroupInfo} from "../api/common/utils/GroupUtils"
import {showEditOutOfOfficeNotificationDialog} from "./EditOutOfOfficeNotificationDialog"
import {formatActivateState, loadOutOfOfficeNotification} from "../misc/OutOfOfficeNotificationUtils"
import {getSignatureType, show as showEditSignatureDialog} from "./EditSignatureDialog"
import type {UpdatableSettingsViewer} from "./SettingsView"
import {OfflineStorageSettingsModel} from "./OfflineStorageSettings"
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {deviceConfig} from "../misc/DeviceConfig"
import {IconButton, IconButtonAttrs} from "../gui/base/IconButton.js"
import {ButtonSize} from "../gui/base/ButtonSize.js";
import {getReportMovedMailsType} from "../misc/MailboxPropertiesUtils.js"
import {MailAddressTableModel} from "./mailaddress/MailAddressTableModel.js"

assertMainOrNode()

export class MailSettingsViewer implements UpdatableSettingsViewer {
	_signature: Stream<string>
	_mailboxProperties: LazyLoaded<MailboxProperties>
	_reportMovedMails: ReportMovedMailsType
	_defaultSender: string | null
	_defaultUnconfidential: boolean | null
	_sendPlaintext: boolean | null
	_noAutomaticContacts: boolean | null
	_enableMailIndexing: boolean | null
	_inboxRulesTableLines: Stream<Array<TableLineAttrs>>
	_inboxRulesExpanded: Stream<boolean>
	_indexStateWatch: Stream<any> | null
	_identifierListViewer: IdentifierListViewer
	_outOfOfficeNotification: LazyLoaded<OutOfOfficeNotification | null>
	_outOfOfficeStatus: Stream<string> // stores the status label, based on whether the notification is/ or will really be activated (checking start time/ end time)
	private mailAddressTableModel: MailAddressTableModel | null = null

	private offlineStorageSettings = new OfflineStorageSettingsModel(
		logins.getUserController(),
		deviceConfig
	)

	constructor() {
		this._defaultSender = getDefaultSenderFromUser(logins.getUserController())
		this._signature = stream(getSignatureType(logins.getUserController().props).name)
		this._reportMovedMails = getReportMovedMailsType(null) // loaded later

		this._defaultUnconfidential = logins.getUserController().props.defaultUnconfidential
		this._sendPlaintext = logins.getUserController().props.sendPlaintextOnly
		this._noAutomaticContacts = logins.getUserController().props.noAutomaticContacts
		this._enableMailIndexing = locator.search.indexState().mailIndexEnabled
		this._inboxRulesExpanded = stream<boolean>(false)
		this._inboxRulesTableLines = stream<Array<TableLineAttrs>>([])
		this._outOfOfficeStatus = stream(lang.get("deactivated_label"))
		this._indexStateWatch = null
		this._identifierListViewer = new IdentifierListViewer(logins.getUserController().user)
		// normally we would maybe like to get it as an argument but these viewers are created in an odd way
		locator.mailAddressTableModelForOwnMailbox().then((model) => {
			this.mailAddressTableModel = model
			m.redraw()
		})
		m.redraw()


		this._updateInboxRules(logins.getUserController().props)

		this._mailboxProperties = new LazyLoaded(async () => {
			const mailboxGroupRoot = await this.getMailboxGroupRoot()
			return locator.mailModel.getMailboxProperties(mailboxGroupRoot)
		})

		this._updateMailboxPropertiesSettings()

		this._outOfOfficeNotification = new LazyLoaded(() => loadOutOfOfficeNotification(), null)

		this._outOfOfficeNotification.getAsync().then(() => this._updateOutOfOfficeNotification())

		this.offlineStorageSettings.init().then(() => m.redraw())
	}

	private async getMailboxGroupRoot(): Promise<MailboxGroupRoot> {
		// For now we assume user mailbox, in the future we should specify which mailbox we are configuring
		const {mailboxGroupRoot} = await locator.mailModel.getUserMailboxDetails()
		return mailboxGroupRoot
	}

	view(): Children {
		const defaultSenderAttrs: DropDownSelectorAttrs<string> = {
			label: "defaultSenderMailAddress_label",
			items: getEnabledMailAddressesForGroupInfo(logins.getUserController().userGroupInfo)
				.sort()
				.map(a => {
					return {
						name: a,
						value: a,
					}
				}),
			selectedValue: this._defaultSender,
			selectionChangedHandler: v => {
				logins.getUserController().props.defaultSender = v
				locator.entityClient.update(logins.getUserController().props)
			},
			helpLabel: () => lang.get("defaultSenderMailAddressInfo_msg"),
			dropdownWidth: 300,
		}

		const changeSignatureButtonAttrs: IconButtonAttrs = {
			title: "userEmailSignature_label",
			click: () => showEditSignatureDialog(logins.getUserController().props),
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		}
		const signatureAttrs: TextFieldAttrs = {
			label: "userEmailSignature_label",
			value: this._signature(),
			oninput: this._signature,
			disabled: true,
			injectionsRight: () => [m(IconButton, changeSignatureButtonAttrs)],
		}

		const editOutOfOfficeNotificationButtonAttrs: IconButtonAttrs = {
			title: "outOfOfficeNotification_title",
			click: () => {
				this._outOfOfficeNotification.getAsync().then(notification => showEditOutOfOfficeNotificationDialog(notification))
			},
			icon: Icons.Edit,
			size: ButtonSize.Compact,
		}

		const outOfOfficeAttrs: TextFieldAttrs = {
			label: "outOfOfficeNotification_title",
			value: this._outOfOfficeStatus(),
			oninput: this._outOfOfficeStatus,
			disabled: true,
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
			selectionChangedHandler: v => {
				logins.getUserController().props.defaultUnconfidential = v
				locator.entityClient.update(logins.getUserController().props)
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
			selectionChangedHandler: v => {
				logins.getUserController().props.sendPlaintextOnly = v
				locator.entityClient.update(logins.getUserController().props)
			},
			dropdownWidth: 250,
		}
		const noAutomaticContactsAttrs: DropDownSelectorAttrs<boolean> = {
			label: "createContacts_label",
			helpLabel: () => lang.get("createContactsForRecipients_action"),
			items: [
				{
					name: lang.get("activated_label"),
					value: false,
				},
				{
					name: lang.get("deactivated_label"),
					value: true,
				},
			],
			selectedValue: this._noAutomaticContacts,
			selectionChangedHandler: v => {
				logins.getUserController().props.noAutomaticContacts = v
				locator.entityClient.update(logins.getUserController().props)
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
			selectionChangedHandler: mailIndexEnabled => {
				if (mailIndexEnabled) {
					showProgressDialog("pleaseWait_msg", locator.indexerFacade.enableMailIndexing()).catch(
						ofClass(IndexingNotSupportedError, () => {
							Dialog.message(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
						}),
					)
				} else {
					showProgressDialog("pleaseWait_msg", locator.indexerFacade.disableMailIndexing("Disabled by user"))
				}
			},
			dropdownWidth: 250,
		}
		const reportMovedMailsAttrs = this.makeReportMovedMailsDropdownAttrs()
		const templateRule = createInboxRuleTemplate(InboxRuleType.RECIPIENT_TO_EQUALS, "")
		const addInboxRuleButtonAttrs: IconButtonAttrs = {
			title: "addInboxRule_action",
			click: () => locator.mailModel.getUserMailboxDetails().then(mailboxDetails => AddInboxRuleDialog.show(mailboxDetails, templateRule)),
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
		return [
			m(
				"#user-settings.fill-absolute.scroll.plr-l.pb-xl",
				{
					role: "group",
					oncreate: () => {
						this._indexStateWatch = locator.search.indexState.map(newValue => {
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
					m(".h4.mt-l", lang.get("emailSending_label")),
					m(DropDownSelector, defaultSenderAttrs),
					this.renderName(),
					m(TextField, signatureAttrs),
					logins.isEnabled(FeatureType.InternalCommunication) ? null : m(DropDownSelector, defaultUnconfidentialAttrs),
					logins.isEnabled(FeatureType.InternalCommunication) ? null : m(DropDownSelector, sendPlaintextAttrs),
					logins.isEnabled(FeatureType.DisableContacts) ? null : m(DropDownSelector, noAutomaticContactsAttrs),
					m(DropDownSelector, enableMailIndexingAttrs),
					m(DropDownSelector, reportMovedMailsAttrs),
					m(TextField, outOfOfficeAttrs),
					this.renderLocalDataSection(),
					this.mailAddressTableModel ? m(MailAddressTable, {model: this.mailAddressTableModel}) : null,
					logins.isEnabled(FeatureType.InternalCommunication)
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
							m(ExpanderPanel, {
									expanded: this._inboxRulesExpanded(),
								},
								m(Table, inboxRulesTableAttrs),
							),
							m(
								".small",
								lang.get("nbrOfInboxRules_msg", {
									"{1}": logins.getUserController().props.inboxRules.length,
								}),
							),
						],
					m(this._identifierListViewer),
				],
			),
		]
	}

	private renderName(): Children {
		const name = logins.getUserController().userGroupInfo.name
		return m(TextField, {
			label: "name_label",
			value: name,
			disabled: true,
			injectionsRight: () => logins.getUserController().isGlobalAdmin()
				? m(IconButton, {
					title: "name_label",
					click: () => this.onChangeName(name),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				})
				: null,
		})
	}

	private onChangeName(name: string) {
		Dialog.showProcessTextInputDialog("edit_action", "name_label", null, name, (newName) => {
			logins.getUserController().userGroupInfo.name = newName
			return locator.entityClient.update(logins.getUserController().userGroupInfo)
		})
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
				value: lang.get("storedDataTimeRange_label", {"{numDays}": this.offlineStorageSettings.getTimeRange()}),
				disabled: true,
				injectionsRight: () => [m(IconButton, {
					title: "edit_action",
					click: () => this.onEditStoredDataTimeRangeClicked(),
					icon: Icons.Edit,
					size: ButtonSize.Compact,
				})],
			})
		]
	}

	private async onEditStoredDataTimeRangeClicked() {
		if (logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog(true, "offlineStoragePremiumOnly_msg")
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
		this._mailboxProperties.getAsync().then(props => {
			this._reportMovedMails = getReportMovedMailsType(props)

			m.redraw()
		})
	}

	_updateInboxRules(props: TutanotaProperties): void {
		locator.mailModel.getUserMailboxDetails().then(mailboxDetails => {
			this._inboxRulesTableLines(
				props.inboxRules.map((rule, index) => {
					return {
						cells: [getInboxRuleTypeName(rule.type), rule.value, this._getTextForTarget(mailboxDetails, rule.targetFolder)],
						actionButtonAttrs: createRowActions(
							{
								getArray: () => props.inboxRules,
								updateInstance: () => locator.entityClient.update(props).catch(ofClass(LockedError, noOp)),
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
		let folder = mailboxDetail.folders.getFolderById(targetFolderId)

		if (folder) {
			return getFolderName(folder)
		} else {
			return "?"
		}
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>): Promise<void> {
		for (const update of updates) {
			const {instanceListId, instanceId, operation} = update
			if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				const props = await locator.entityClient.load(TutanotaPropertiesTypeRef, logins.getUserController().props._id)
				this._updateTutanotaPropertiesSettings(props)
				this._updateInboxRules(props)
			} else if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
				this._updateInboxRules(logins.getUserController().props)
			} else if (isUpdateForTypeRef(OutOfOfficeNotificationTypeRef, update)) {
				this._outOfOfficeNotification.reload().then(() => this._updateOutOfOfficeNotification())
			} else if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update)) {
				this._mailboxProperties.reload().then(() => this._updateMailboxPropertiesSettings())
			}
			await this._identifierListViewer.entityEventReceived(update)
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
				await locator.mailModel.saveReportMovedMails(mailboxGroupRoot, reportMovedMails)
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
		child: () => m(TextField, {
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
