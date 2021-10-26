// @flow
import m from "mithril"
import {assertMainOrNode, isApp} from "../api/common/Env"
import {lang} from "../misc/LanguageViewModel"
import type {TutanotaProperties} from "../api/entities/tutanota/TutanotaProperties"
import {TutanotaPropertiesTypeRef} from "../api/entities/tutanota/TutanotaProperties"
import type {ReportMovedMailsTypeEnum} from "../api/common/TutanotaConstants"
import {FeatureType, InboxRuleType, OperationType, ReportMovedMailsType} from "../api/common/TutanotaConstants"
import {load, update} from "../api/main/Entity"
import {neverNull, noOp} from "@tutao/tutanota-utils"
import {MailFolderTypeRef} from "../api/entities/tutanota/MailFolder"
import {getInboxRuleTypeName} from "../mail/model/InboxRuleHandler"
import {EditAliasesFormN} from "./EditAliasesFormN.js"
import {Dialog} from "../gui/base/Dialog"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {logins} from "../api/main/LoginController"
import {getDefaultSenderFromUser, getFolderName} from "../mail/model/MailUtils"
import {Icons} from "../gui/base/icons/Icons"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import type {MailboxDetail} from "../mail/model/MailModel"
import {locator} from "../api/main/MainLocator"
import stream from "mithril/stream/stream.js"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {DropDownSelectorAttrs} from "../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../gui/base/DropDownSelectorN"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {TableAttrs, TableLineAttrs} from "../gui/base/TableN"
import {ColumnWidth, createRowActions, TableN} from "../gui/base/TableN"
import * as AddInboxRuleDialog from "./AddInboxRuleDialog"
import {createInboxRuleTemplate} from "./AddInboxRuleDialog"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"
import {IdentifierListViewer} from "./IdentifierListViewer"
import {IndexingNotSupportedError} from "../api/common/error/IndexingNotSupportedError"
import {LockedError} from "../api/common/error/RestError"
import type {EditAliasesFormAttrs} from "./EditAliasesFormN"
import {createEditAliasFormAttrs, updateNbrOfAliases} from "./EditAliasesFormN"
import {getEnabledMailAddressesForGroupInfo} from "../api/common/utils/GroupUtils";
import {isSameId} from "../api/common/utils/EntityUtils";
import {showEditOutOfOfficeNotificationDialog} from "./EditOutOfOfficeNotificationDialog"
import type {OutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification"
import {OutOfOfficeNotificationTypeRef} from "../api/entities/tutanota/OutOfOfficeNotification"
import {LazyLoaded} from "@tutao/tutanota-utils"
import {formatActivateState, loadOutOfOfficeNotification} from "../misc/OutOfOfficeNotificationUtils"
import {getSignatureType, show as showEditSignatureDialog} from "./EditSignatureDialog"
import type {UpdatableSettingsViewer} from "./SettingsView"
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
import type {MailboxProperties} from "../api/entities/tutanota/MailboxProperties"
import {MailboxPropertiesTypeRef} from "../api/entities/tutanota/MailboxProperties"
import {getReportMovedMailsType, loadMailboxProperties, saveReportMovedMails} from "../misc/MailboxPropertiesUtils"

assertMainOrNode()

export class MailSettingsViewer implements UpdatableSettingsViewer {
	_senderName: Stream<string>;
	_signature: Stream<string>;
	_mailboxProperties: LazyLoaded<?MailboxProperties>;
	_reportMovedMails: Stream<ReportMovedMailsTypeEnum>
	_defaultSender: Stream<?string>;
	_defaultUnconfidential: Stream<?boolean>;
	_sendPlaintext: Stream<?boolean>;
	_noAutomaticContacts: Stream<?boolean>;
	_enableMailIndexing: Stream<?boolean>;
	_inboxRulesTableLines: Stream<Array<TableLineAttrs>>;
	_inboxRulesExpanded: Stream<boolean>;
	_indexStateWatch: ?Stream<any>;
	_identifierListViewer: IdentifierListViewer;
	_editAliasFormAttrs: EditAliasesFormAttrs;
	_outOfOfficeNotification: LazyLoaded<?OutOfOfficeNotification>;
	_outOfOfficeStatus: Stream<string>; // stores the status label, based on whether the notification is/ or will really be activated (checking start time/ end time)

	constructor() {
		this._defaultSender = stream(getDefaultSenderFromUser(logins.getUserController()))
		this._senderName = stream(logins.getUserController().userGroupInfo.name)
		this._signature = stream(getSignatureType(logins.getUserController().props).name)
		this._reportMovedMails = stream(getReportMovedMailsType(null)) // loaded later
		this._defaultUnconfidential = stream(logins.getUserController().props.defaultUnconfidential)
		this._sendPlaintext = stream(logins.getUserController().props.sendPlaintextOnly)
		this._noAutomaticContacts = stream(logins.getUserController().props.noAutomaticContacts)
		this._enableMailIndexing = stream(locator.search.indexState().mailIndexEnabled)
		this._inboxRulesExpanded = stream(false)
		this._inboxRulesTableLines = stream([])
		this._outOfOfficeStatus = stream(lang.get("deactivated_label"))
		this._indexStateWatch = null
		this._identifierListViewer = new IdentifierListViewer(logins.getUserController().user)
		this._updateInboxRules(logins.getUserController().props)

		this._editAliasFormAttrs = createEditAliasFormAttrs(logins.getUserController().userGroupInfo)

		if (logins.getUserController().isGlobalAdmin()) {
			updateNbrOfAliases(this._editAliasFormAttrs)
		}

		this._mailboxProperties = new LazyLoaded(() => {
			return loadMailboxProperties()
		}, null)
		this._mailboxProperties.getAsync().then(() => this._updateMailboxPropertiesSettings())

		this._outOfOfficeNotification = new LazyLoaded(() => {
			return loadOutOfOfficeNotification()
		}, null)
		this._outOfOfficeNotification.getAsync().then(() => this._updateOutOfOfficeNotification())
	}

	view(): Children {
		const defaultSenderAttrs: DropDownSelectorAttrs<string> = {
			label: "defaultSenderMailAddress_label",
			items: getEnabledMailAddressesForGroupInfo(logins.getUserController().userGroupInfo)
				.sort()
				.map(a => {
					return {name: a, value: a}
				}),
			selectedValue: this._defaultSender,
			selectionChangedHandler: v => {
				logins.getUserController().props.defaultSender = v
				update(logins.getUserController().props)
			},
			helpLabel: () => lang.get("defaultSenderMailAddressInfo_msg"),
			dropdownWidth: 250,
		}

		const editSenderNameButtonAttrs: ButtonAttrs = {
			label: "mailName_label",
			click: () => {
				Dialog.showTextInputDialog("edit_action", "mailName_label", null, this._senderName())
				      .then(newName => {
					      logins.getUserController().userGroupInfo.name = newName
					      update(logins.getUserController().userGroupInfo)
				      })
			},
			icon: () => Icons.Edit,
		}

		const senderNameAttrs: TextFieldAttrs = {
			label: "mailName_label",
			value: this._senderName,
			disabled: true,
			injectionsRight: () => logins.getUserController()
			                             .isGlobalAdmin() ? [m(ButtonN, editSenderNameButtonAttrs)] : []
		}

		const changeSignatureButtonAttrs: ButtonAttrs = {
			label: "userEmailSignature_label",
			click: () => showEditSignatureDialog(logins.getUserController().props),
			icon: () => Icons.Edit
		}

		const signatureAttrs: TextFieldAttrs = {
			label: "userEmailSignature_label",
			value: this._signature,
			disabled: true,
			injectionsRight: () => [m(ButtonN, changeSignatureButtonAttrs)]
		}

		const outOfOfficeAttrs: TextFieldAttrs = {
			label: "outOfOfficeNotification_title",
			value: this._outOfOfficeStatus,
			disabled: true,
			injectionsRight: () => [m(ButtonN, editOutOfOfficeNotificationButtonAttrs)]
		}

		const editOutOfOfficeNotificationButtonAttrs: ButtonAttrs = {
			label: "outOfOfficeNotification_title",
			click: () => {
				this._outOfOfficeNotification.getAsync().then(notification => showEditOutOfOfficeNotificationDialog(notification))
			},
			icon: () => Icons.Edit
		}

		const defaultUnconfidentialAttrs: DropDownSelectorAttrs<boolean> = {
			label: "defaultExternalDelivery_label",
			items: [
				{name: lang.get("confidential_action"), value: false},
				{name: lang.get("nonConfidential_action"), value: true}
			],
			selectedValue: this._defaultUnconfidential,
			selectionChangedHandler: v => {
				logins.getUserController().props.defaultUnconfidential = v
				update(logins.getUserController().props)
			},
			helpLabel: () => lang.get("defaultExternalDeliveryInfo_msg"),
			dropdownWidth: 250,
		}

		const sendPlaintextAttrs: DropDownSelectorAttrs<boolean> = {
			label: "externalFormatting_label",
			helpLabel: () => lang.get("externalFormattingInfo_msg"),
			items: [
				{name: lang.get("html_action"), value: false},
				{name: lang.get("plaintext_action"), value: true}
			],
			selectedValue: this._sendPlaintext,
			selectionChangedHandler: v => {
				logins.getUserController().props.sendPlaintextOnly = v
				update(logins.getUserController().props)
			},
			dropdownWidth: 250,
		}

		const noAutomaticContactsAttrs: DropDownSelectorAttrs<boolean> = {
			label: "createContacts_label",
			helpLabel: () => lang.get("createContactsForRecipients_action"),
			items: [
				{name: lang.get("activated_label"), value: false},
				{name: lang.get("deactivated_label"), value: true}
			],
			selectedValue: this._noAutomaticContacts,
			selectionChangedHandler: v => {
				logins.getUserController().props.noAutomaticContacts = v
				update(logins.getUserController().props)
			},
			dropdownWidth: 250
		}

		const enableMailIndexingAttrs: DropDownSelectorAttrs<boolean> = {
			label: "searchMailbox_label",
			helpLabel: () => lang.get("enableSearchMailbox_msg"),
			items: [
				{name: lang.get("activated_label"), value: true},
				{name: lang.get("deactivated_label"), value: false}
			],
			selectedValue: this._enableMailIndexing,
			selectionChangedHandler: mailIndexEnabled => {
				if (mailIndexEnabled) {
					showProgressDialog("pleaseWait_msg", locator.indexerFacade.enableMailIndexing())
						.catch(ofClass(IndexingNotSupportedError, () => {
							Dialog.error(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
						}))
				} else {
					showProgressDialog("pleaseWait_msg", locator.indexerFacade.disableMailIndexing("Disabled by user"))
				}
			},
			dropdownWidth: 250
		}

		const reportMovedMailsAttrs = makeReportMovedMailsDropdownAttrs(this._reportMovedMails, this._mailboxProperties)
		const templateRule = createInboxRuleTemplate(InboxRuleType.RECIPIENT_TO_EQUALS, "")
		const addInboxRuleButtonAttrs: ButtonAttrs = {
			label: "addInboxRule_action",
			click: () => locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => AddInboxRuleDialog.show(mailboxDetails, templateRule)),
			icon: () => Icons.Add

		}
		const inboxRulesTableAttrs: TableAttrs = {
			columnHeading: ["inboxRuleField_label", "inboxRuleValue_label", "inboxRuleTargetFolder_label"],
			columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: addInboxRuleButtonAttrs,
			lines: this._inboxRulesTableLines(),
		}

		return [
			m("#user-settings.fill-absolute.scroll.plr-l.pb-xl", {
				role: "group",
				oncreate: () => {
					this._indexStateWatch = locator.search.indexState.map((newValue) => {
						this._enableMailIndexing(newValue.mailIndexEnabled)
						m.redraw()
					})
				},
				onremove: () => {
					if (this._indexStateWatch) {
						this._indexStateWatch.end(true)
					}
				}
			}, [
				m(".h4.mt-l", lang.get('emailSending_label')),
				m(DropDownSelectorN, defaultSenderAttrs),
				m(TextFieldN, senderNameAttrs),
				m(TextFieldN, signatureAttrs),
				logins.isEnabled(FeatureType.InternalCommunication) ? null : m(DropDownSelectorN, defaultUnconfidentialAttrs),
				logins.isEnabled(FeatureType.InternalCommunication) ? null : m(DropDownSelectorN, sendPlaintextAttrs),
				logins.isEnabled(FeatureType.DisableContacts) ? null : m(DropDownSelectorN, noAutomaticContactsAttrs),
				m(DropDownSelectorN, enableMailIndexingAttrs),
				m(DropDownSelectorN, reportMovedMailsAttrs),
				m(TextFieldN, outOfOfficeAttrs),
				(logins.getUserController().isGlobalAdmin()) ? m(EditAliasesFormN, this._editAliasFormAttrs) : null,
				logins.isEnabled(FeatureType.InternalCommunication) ? null : [
					m(".flex-space-between.items-center.mt-l.mb-s", [
						m(".h4", lang.get('inboxRulesSettings_action')),
						m(ExpanderButtonN, {label: "showInboxRules_action", expanded: this._inboxRulesExpanded})
					]),
					m(ExpanderPanelN, {expanded: this._inboxRulesExpanded}, m(TableN, inboxRulesTableAttrs)),
					m(".small", lang.get("nbrOfInboxRules_msg", {"{1}": logins.getUserController().props.inboxRules.length})),
				],
				m(this._identifierListViewer),

			])
		]
	}


	_updateTutanotaPropertiesSettings(props: TutanotaProperties) {
		if (props.defaultSender) {
			this._defaultSender(props.defaultSender)
		}
		this._defaultUnconfidential(props.defaultUnconfidential)
		this._noAutomaticContacts(props.noAutomaticContacts)
		this._sendPlaintext(props.sendPlaintextOnly)
		this._signature(getSignatureType(props).name)
	}

	_updateMailboxPropertiesSettings() {
		this._mailboxProperties.getAsync().then(props => {
			this._reportMovedMails(getReportMovedMailsType(props))
			m.redraw()
		})
	}

	_updateInboxRules(props: TutanotaProperties): void {
		locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
			this._inboxRulesTableLines(props.inboxRules.map((rule, index) => {
				return {
					cells: [getInboxRuleTypeName(rule.type), rule.value, this._getTextForTarget(mailboxDetails, rule.targetFolder)],
					actionButtonAttrs: createRowActions({
						getArray: () => props.inboxRules,
						updateInstance: () => update(props).catch(ofClass(LockedError, noOp))
					}, rule, index, [
						{
							label: "edit_action",
							click: () => AddInboxRuleDialog.show(mailboxDetails, rule),
							type: ButtonType.Dropdown,
						}
					])
				}
			}))
			m.redraw()
		})
	}

	_updateOutOfOfficeNotification(): void {
		const notification = this._outOfOfficeNotification.getLoaded()
		this._outOfOfficeStatus(formatActivateState(notification))
		m.redraw()
	}

	_getTextForTarget(mailboxDetails: MailboxDetail, targetFolderId: IdTuple): string {
		let folder = mailboxDetails.folders.find(folder => isSameId(folder._id, targetFolderId))
		if (folder) {
			return getFolderName(folder)
		} else {
			return "?"
		}
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>): Promise<void> {
		return promiseMap(updates, update => {
			let p = Promise.resolve()
			const {instanceListId, instanceId, operation} = update
			if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				p = load(TutanotaPropertiesTypeRef, logins.getUserController().props._id).then(props => {
					this._updateTutanotaPropertiesSettings(props)
					this._updateInboxRules(props)
				})
			} else if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
				this._updateInboxRules(logins.getUserController().props)
			} else if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE
				&& isSameId(logins.getUserController().userGroupInfo._id, [neverNull(instanceListId), instanceId])) {
				p = load(GroupInfoTypeRef, [neverNull(instanceListId), instanceId]).then(groupInfo => {
					this._senderName(groupInfo.name)
					this._editAliasFormAttrs.userGroupInfo = groupInfo
					m.redraw()
				})
			} else if (isUpdateForTypeRef(OutOfOfficeNotificationTypeRef, update)) {
				this._outOfOfficeNotification.reload().then(() => this._updateOutOfOfficeNotification())
			} else if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update)) {
				this._mailboxProperties.reload().then(() => this._updateMailboxPropertiesSettings())
			}
			return p.then(() => {
				this._identifierListViewer.entityEventReceived(update)
			})
		}).then(() => m.redraw())
	}
}

function makeReportMovedMailsDropdownAttrs(reportMovedMailsSetting: Stream<ReportMovedMailsTypeEnum>, mailboxProperties: LazyLoaded<?MailboxProperties>): DropDownSelectorAttrs<ReportMovedMailsTypeEnum> {
	return {
		label: "spamReports_label",
		helpLabel: () => lang.get("unencryptedTransmission_msg"),
		items: [
			{name: lang.get("alwaysAsk_action"), value: ReportMovedMailsType.ALWAYS_ASK},
			{name: lang.get("alwaysReport_action"), value: ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM},
			{name: lang.get("neverReport_action"), value: ReportMovedMailsType.NEVER}
		],
		selectedValue: reportMovedMailsSetting,
		selectionChangedHandler: (reportMovedMails) => {
			mailboxProperties.getAsync().then(props => saveReportMovedMails(props, reportMovedMails))
		},
		dropdownWidth: 250
	}
}