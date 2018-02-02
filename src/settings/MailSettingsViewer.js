// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {lang} from "../misc/LanguageViewModel"
import {Table, ColumnWidth} from "../gui/base/Table"
import {isSameTypeRef, isSameId} from "../api/common/EntityFunctions"
import {TutanotaPropertiesTypeRef} from "../api/entities/tutanota/TutanotaProperties"
import type {OperationTypeEnum} from "../api/common/TutanotaConstants"
import {OperationType, InboxRuleType, FeatureType} from "../api/common/TutanotaConstants"
import {load, update} from "../api/main/Entity"
import TableLine from "../gui/base/TableLine"
import {neverNull, getEnabledMailAddressesForGroupInfo} from "../api/common/utils/Utils"
import {MailFolderTypeRef} from "../api/entities/tutanota/MailFolder"
import {getInboxRuleTypeName} from "../mail/InboxRuleHandler"
import * as AddInboxRuleDialog from "./AddInboxRuleDialog"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import {Button} from "../gui/base/Button"
import * as EditSignatureDialog from "./EditSignatureDialog"
import {EditAliasesForm} from "./EditAliasesForm"
import {Dialog} from "../gui/base/Dialog"
import {GroupInfoTypeRef} from "../api/entities/sys/GroupInfo"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {UserTypeRef} from "../api/entities/sys/User"
import {logins} from "../api/main/LoginController"
import {getDefaultSenderFromUser, getFolderName} from "../mail/MailUtils"
import {Icons} from "../gui/base/icons/Icons"
import {worker} from "../api/main/WorkerClient"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {mailModel} from "../mail/MailModel"
import {locator} from "../api/main/MainLocator"
import {MailSettingNotificationViewer} from "./MailSettingNotificationViewer"

assertMainOrNode()

export class MailSettingsViewer {
	view: Function

	_senderName: TextField;
	_signature: TextField;
	_defaultSender: DropDownSelector<string>;
	_defaultUnconfidential: DropDownSelector<boolean>;
	_sendPlaintext: DropDownSelector<boolean>;
	_noAutomaticContacts: DropDownSelector<boolean>;
	_enableMailIndexing: DropDownSelector<boolean>;
	_aliases: EditAliasesForm;
	_inboxRulesTable: Table;
	_notificationViewer: MailSettingNotificationViewer;

	oncreate: Function;
	onbeforeremove: Function;

	constructor() {
		this._senderName = new TextField("mailName_label").setValue(logins.getUserController().userGroupInfo.name).setDisabled()
		let editSenderNameButton = new Button("edit_action", () => {
			Dialog.showTextInputDialog("edit_action", "mailName_label", null, this._senderName.value()).then(newName => {
				logins.getUserController().userGroupInfo.name = newName
				update(logins.getUserController().userGroupInfo)
			})
		}, () => Icons.Edit)

		this._senderName._injectionsRight = () => logins.getUserController().isGlobalAdmin() ? [m(editSenderNameButton)] : []

		this._defaultSender = new DropDownSelector("defaultSenderMailAddress_label", () => lang.get("defaultSenderMailAddressInfo_msg"), getEnabledMailAddressesForGroupInfo(logins.getUserController().userGroupInfo).map(a => {
			return {name: a, value: a}
		}), getDefaultSenderFromUser(), 250).setSelectionChangedHandler(v => {
			logins.getUserController().props.defaultSender = v
			update(logins.getUserController().props)
		})

		this._defaultUnconfidential = new DropDownSelector("defaultExternalDelivery_label", () => lang.get("defaultExternalDeliveryInfo_msg"), [
			{name: lang.get("confidential_action"), value: false},
			{name: lang.get("nonConfidential_action"), value: true}
		], logins.getUserController().props.defaultUnconfidential, 250).setSelectionChangedHandler(v => {
			logins.getUserController().props.defaultUnconfidential = v
			update(logins.getUserController().props)
		})

		this._sendPlaintext = new DropDownSelector("externalFormatting_label", () => lang.get("externalFormattingInfo_msg"), [
			{name: lang.get("html_action"), value: false},
			{name: lang.get("plaintext_action"), value: true}
		], logins.getUserController().props.sendPlaintextOnly, 250).setSelectionChangedHandler(v => {
			logins.getUserController().props.sendPlaintextOnly = v
			update(logins.getUserController().props)
		})

		this._noAutomaticContacts = new DropDownSelector("createContacts_label", () => lang.get("createContactsForRecipients_action"), [
			{name: lang.get("activated_label"), value: false},
			{name: lang.get("deactivated_label"), value: true}
		], logins.getUserController().props.noAutomaticContacts, 250).setSelectionChangedHandler(v => {
			logins.getUserController().props.noAutomaticContacts = v
			update(logins.getUserController().props)
		})

		this._enableMailIndexing = new DropDownSelector("searchMailbox_label", () => lang.get("enableSearchMailbox_msg"), [
			{name: lang.get("activated_label"), value: true},
			{name: lang.get("deactivated_label"), value: false}
		], locator.search.indexState().mailIndexEnabled, 250).setSelectionChangedHandler(mailIndexEnabled => {
			if (mailIndexEnabled) {
				if (locator.search.indexState().indexingSupported) {
					showProgressDialog("pleaseWait_msg", worker.enableMailIndexing())
				} else {
					Dialog.error("searchDisabled_msg")
				}
			} else {
				showProgressDialog("pleaseWait_msg", worker.disableMailIndexing())
			}
		})

		this._signature = new TextField("userEmailSignature_label").setValue(EditSignatureDialog.getSignatureType(logins.getUserController().props).name).setDisabled()
		let changeSignatureButton = new Button("edit_action", () => EditSignatureDialog.show(), () => Icons.Edit)
		this._signature._injectionsRight = () => [m(changeSignatureButton)]

		this._aliases = new EditAliasesForm(logins.getUserController().userGroupInfo)

		let addInboxRuleButton = new Button("addInboxRule_action", () => AddInboxRuleDialog.show(mailModel.getUserMailboxDetails(), InboxRuleType.RECIPIENT_TO_EQUALS, ""), () => Icons.Add)
		this._inboxRulesTable = new Table(["inboxRuleField_label", "inboxRuleValue_label", "inboxRuleTargetFolder_label"], [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small], true, addInboxRuleButton)
		let inboxRulesExpander = new ExpanderButton("showInboxRules_action", new ExpanderPanel(this._inboxRulesTable), false)

		this._notificationViewer = new MailSettingNotificationViewer()

		this.view = () => {
			return [
				m("#user-settings.fill-absolute.scroll.plr-l", [
					m(".h4.mt-l", lang.get('emailSending_label')),
					m(this._defaultSender),
					m(this._senderName),
					m(this._signature),
					logins.isEnabled(FeatureType.InternalCommunication) ? null : m(this._defaultUnconfidential),
					logins.isEnabled(FeatureType.InternalCommunication) ? null : m(this._sendPlaintext),
					logins.isEnabled(FeatureType.DisableContacts) ? null : m(this._noAutomaticContacts),
					m(this._enableMailIndexing),
					(logins.getUserController().isGlobalAdmin()) ? m(this._aliases) : null,
					logins.isEnabled(FeatureType.InternalCommunication) ? null : [
							m(".flex-space-between.items-center.mt-l.mb-s", [
								m(".h4", lang.get('inboxRulesSettings_action')),
								m(inboxRulesExpander)
							]),
							m(inboxRulesExpander.panel),
							m(".small", lang.get("nbrOfInboxRules_msg", {"{1}": logins.getUserController().props.inboxRules.length})),
						],
					m(this._notificationViewer)
				])
			]
		}

		this._updateInboxRules(logins.getUserController().props)
		this._notificationViewer.loadPushIdentifiers(logins.getUserController().user)

		let indexStateWatch = null
		this.oncreate = () => {
			indexStateWatch = locator.search.indexState.map((newValue) => {
				this._enableMailIndexing.selectedValue(newValue.mailIndexEnabled)
				m.redraw()
			})
		}
		this.onbeforeremove = () => {
			if (indexStateWatch) {
				indexStateWatch.end(true)
			}
		}
	}


	_updatePropertiesSettings(props: TutanotaProperties) {
		if (props.defaultSender) {
			this._defaultSender.selectedValue(props.defaultSender)
		}
		this._defaultUnconfidential.selectedValue(props.defaultUnconfidential)
		this._noAutomaticContacts.selectedValue(props.noAutomaticContacts)
		this._sendPlaintext.selectedValue(props.sendPlaintextOnly)
		this._signature.setValue(EditSignatureDialog.getSignatureType(props).name)
		m.redraw()
	}

	_updateInboxRules(props: TutanotaProperties) {
		mailModel.init().then(() => {
			this._inboxRulesTable.updateEntries(props.inboxRules.map((rule, index) => {
				let actionButton = new Button("delete_action", () => {
					props.inboxRules.splice(index, 1)
					update(props)
				}, () => Icons.Cancel)
				return new TableLine([getInboxRuleTypeName(rule.type), rule.value, this._getTextForTarget(rule.targetFolder)], actionButton)
			}))
		})
	}

	_getTextForTarget = function (targetFolderId: IdTuple) {
		let folder = mailModel.getUserMailboxDetails().folders.find(folder => isSameId(folder._id, targetFolderId))
		if (folder) {
			return getFolderName(folder)
		} else {
			return "?"
		}
	}

	entityEventReceived<T>(typeRef: TypeRef<any>, listId: ?string, elementId: string, operation: OperationTypeEnum): void {
		if (isSameTypeRef(typeRef, TutanotaPropertiesTypeRef) && operation == OperationType.UPDATE) {
			load(TutanotaPropertiesTypeRef, logins.getUserController().props._id).then(props => {
				this._updatePropertiesSettings(props)
				this._updateInboxRules(props)
			})
		} else if (isSameTypeRef(typeRef, MailFolderTypeRef)) {
			this._updateInboxRules(logins.getUserController().props)
		} else if (isSameTypeRef(typeRef, PushIdentifierTypeRef)) {
			this._notificationViewer.loadPushIdentifiers(logins.getUserController().user)
		} else if (isSameTypeRef(typeRef, GroupInfoTypeRef) && operation == OperationType.UPDATE && isSameId(logins.getUserController().userGroupInfo._id, [neverNull(listId), elementId])) {
			load(GroupInfoTypeRef, [neverNull(listId), elementId]).then(groupInfo => {
				this._senderName.setValue(groupInfo.name)
			})
		} else if (isSameTypeRef(typeRef, UserTypeRef) && operation == OperationType.UPDATE && isSameId(logins.getUserController().user._id, elementId)) {
			// for editing sender name and email aliases
			m.redraw()
		}
		this._aliases.entityEventReceived(typeRef, listId, elementId, operation)
	}
}