// @flow
import type {SettingsSection, SettingsTableAttrs, SettingsValue} from "./SettingsModel"
import {SettingsTable} from "./SettingsModel"
import stream from "mithril/stream/stream.js"
import {getDefaultSenderFromUser, getFolderName} from "../../mail/model/MailUtils"
import {getSignatureType, show as showEditSignatureDialog} from "../EditSignatureDialog"
import {lang} from "../../misc/LanguageViewModel"
import {locator} from "../../api/main/MainLocator"
import type {MailboxProperties} from "../../api/entities/tutanota/MailboxProperties"
import {MailboxPropertiesTypeRef} from "../../api/entities/tutanota/MailboxProperties"
import {getReportMovedMailsType, loadMailboxProperties} from "../../misc/MailboxPropertiesUtils"
import type {ReportMovedMailsTypeEnum} from "../../api/common/TutanotaConstants"
import {InboxRuleType, OperationType} from "../../api/common/TutanotaConstants"
import type {DropDownSelectorAttrs} from "../../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import {getEnabledMailAddressesForGroupInfo} from "../../api/common/utils/GroupUtils"
// import {load, update} from "../../api/main/Entity"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {Dialog} from "../../gui/base/Dialog"
import {Icons} from "../../gui/base/icons/Icons"
import type {TextFieldAttrs} from "../../gui/base/TextFieldN"
import {TextFieldN} from "../../gui/base/TextFieldN"
import m from "mithril"
import {showEditOutOfOfficeNotificationDialog} from "../EditOutOfOfficeNotificationDialog"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {IndexingNotSupportedError} from "../../api/common/error/IndexingNotSupportedError"
import {isApp} from "../../api/common/Env"
import type {EntityUpdateData} from "../../api/main/EventController"
import {isUpdateForTypeRef} from "../../api/main/EventController"
import {makeReportMovedMailsDropdownAttrs} from "../MailSettingsViewer"
import type {OutOfOfficeNotification} from "../../api/entities/tutanota/OutOfOfficeNotification"
import {formatActivateState, loadOutOfOfficeNotification} from "../../misc/OutOfOfficeNotificationUtils"
import type {EditAliasesFormAttrs} from "../EditAliasesFormN"
import {createEditAliasFormAttrs, getAliasLineAttrs, showAddAliasDialog} from "../EditAliasesFormN"
import type {TableAttrs, TableLineAttrs} from "../../gui/base/TableN"
import {ColumnWidth, createRowActions} from "../../gui/base/TableN"
import * as AddInboxRuleDialog from "../AddInboxRuleDialog"
import {createInboxRuleTemplate} from "../AddInboxRuleDialog"
import {IdentifierListViewer, showAddNotificationEmailAddressDialog} from "../IdentifierListViewer"
import type {IUserController} from "../../api/main/UserController"
import type {TutanotaProperties} from "../../api/entities/tutanota/TutanotaProperties"
import {TutanotaPropertiesTypeRef} from "../../api/entities/tutanota/TutanotaProperties"
import {logins} from "../../api/main/LoginController"
import {getInboxRuleTypeName} from "../../mail/model/InboxRuleHandler"
import {LockedError} from "../../api/common/error/RestError"
import {GroupInfoTypeRef} from "../../api/entities/sys/GroupInfo"
import {isSameId} from "../../api/common/utils/EntityUtils"
import {MailFolderTypeRef} from "../../api/entities/tutanota/MailFolder"
import type {MailboxDetail} from "../../mail/model/MailModel"
import {EntityClient} from "../../api/common/EntityClient"
import {LazyLoaded, neverNull, noOp, ofClass, promiseMap} from "@tutao/tutanota-utils"
import type {Indexer} from "../../api/worker/search/Indexer"

export class MailSettingsSection implements SettingsSection {
	heading: string
	category: string
	settingsValues: Array<SettingsValue<any>>

	defaultSender: Stream<?string>
	senderName: Stream<string>
	defaultUnconfidential: Stream<?boolean>
	sendPlaintext: Stream<?boolean>
	noAutomaticContacts: Stream<?boolean>
	enableMailIndexing: Stream<?boolean>
	mailboxProperties: LazyLoaded<?MailboxProperties>
	reportMovedMails: Stream<ReportMovedMailsTypeEnum>
	identifierListViewer: IdentifierListViewer
	outOfOfficeStatus: Stream<string>
	outOfOfficeNotification: LazyLoaded<?OutOfOfficeNotification>
	entityClient: EntityClient
	signature: Stream<string>
	indexerFacade: Indexer

	constructor(userController: IUserController, entityClient: EntityClient, indexerFacade: Indexer) {
		this.heading = "Sending Mails"
		this.category = "Mails"
		this.settingsValues = []

		this.defaultSender = stream(getDefaultSenderFromUser(userController))
		this.senderName = stream(userController.userGroupInfo.name)
		this.signature = stream(getSignatureType(userController.props).name)
		this.reportMovedMails = stream(getReportMovedMailsType(null)) // loaded later
		this.defaultUnconfidential = stream(userController.props.defaultUnconfidential)
		this.sendPlaintext = stream(userController.props.sendPlaintextOnly)
		this.noAutomaticContacts = stream(userController.props.noAutomaticContacts)
		this.enableMailIndexing = stream(locator.search.indexState().mailIndexEnabled)
		this.outOfOfficeStatus = stream(lang.get("deactivated_label"))
		this.identifierListViewer = new IdentifierListViewer(logins.getUserController().user)
		this.mailboxProperties = new LazyLoaded(() => {
			return loadMailboxProperties()
		}, null)
		this.outOfOfficeNotification = new LazyLoaded(() => {
			return loadOutOfOfficeNotification()
		}, null)
		this.entityClient = entityClient
		this.indexerFacade = indexerFacade
		this.outOfOfficeNotification.getAsync().then(() => this.updateOutOfOfficeNotification())

		this.settingsValues.push(this.createDefaultSenderSettings(userController))
		this.settingsValues.push(this.createSenderNameSettings(userController))
		this.settingsValues.push(this.createSignaturSettings(userController))
		this.settingsValues.push(this.createDefaultDeliverySettings(userController))
		this.settingsValues.push(this.createFormattingSettings(userController))
		this.settingsValues.push(this.createAutomaticContactsSettings(userController))
		this.settingsValues.push(this.createSearchMailboxSettings())
		this.settingsValues.push(this.createReportSpamSettings())
		this.settingsValues.push(this.createOutOfOfficeSettings())
	}


	createDefaultSenderSettings(userController: IUserController): SettingsValue<DropDownSelectorAttrs<string>> {

		const defaultSenderAttrs: DropDownSelectorAttrs<string> = {
			label: "defaultSenderMailAddress_label",
			items: getEnabledMailAddressesForGroupInfo(userController.userGroupInfo)
				.sort()
				.map(a => {
					return {name: a, value: a}
				}),
			selectedValue: this.defaultSender,
			selectionChangedHandler: v => {
				userController.props.defaultSender = v
				this.entityClient.update(userController.props)
			},
			helpLabel: () => lang.get("defaultSenderMailAddressInfo_msg"),
			dropdownWidth: 250,
		}

		return {
			name: "defaultSenderMailAddress_label",
			component: DropDownSelectorN,
			attrs: defaultSenderAttrs
		}
	}

	createSenderNameSettings(userController: IUserController): SettingsValue<TextFieldAttrs> {

		const editSenderNameButtonAttrs: ButtonAttrs = {
			label: "mailName_label",
			click: () => {
				Dialog.showTextInputDialog("edit_action", "mailName_label", null, this.senderName())
				      .then(newName => {
					      userController.userGroupInfo.name = newName
					      this.entityClient.update(userController.userGroupInfo)
				      })
			},
			icon: () => Icons.Edit,
		}

		const senderNameAttrs: TextFieldAttrs = {
			label: "mailName_label",
			value: this.senderName,
			disabled: true,
			injectionsRight: () => userController
				.isGlobalAdmin() ? [m(ButtonN, editSenderNameButtonAttrs)] : []
		}

		return {
			name: "mailName_label",
			component: TextFieldN,
			attrs: senderNameAttrs
		}
	}

	createSignaturSettings(userController: IUserController): SettingsValue<TextFieldAttrs> {

		const changeSignatureButtonAttrs: ButtonAttrs = {
			label: "userEmailSignature_label",
			click: () => showEditSignatureDialog(userController.props),
			icon: () => Icons.Edit
		}

		const signatureAttrs: TextFieldAttrs = {
			label: "userEmailSignature_label",
			value: this.signature,
			disabled: true,
			injectionsRight: () => [m(ButtonN, changeSignatureButtonAttrs)]
		}

		return {
			name: "userEmailSignature_label",
			component: TextFieldN,
			attrs: signatureAttrs
		}
	}

	createDefaultDeliverySettings(userController: IUserController): SettingsValue<DropDownSelectorAttrs<boolean>> {

		const defaultUnconfidentAttrs: DropDownSelectorAttrs<boolean> = {
			label: "defaultExternalDelivery_label",
			items: [
				{name: lang.get("confidential_action"), value: false},
				{name: lang.get("nonConfidential_action"), value: true}
			],
			selectedValue: this.defaultUnconfidential,
			selectionChangedHandler: v => {
				userController.props.defaultUnconfidential = v
				this.entityClient.update(userController.props)
			},
			helpLabel: () => lang.get("defaultExternalDeliveryInfo_msg"),
			dropdownWidth: 250,
		}

		return {
			name: "defaultExternalDelivery_label",
			component: DropDownSelectorN,
			attrs: defaultUnconfidentAttrs
		}
	}

	createFormattingSettings(userController: IUserController): SettingsValue<DropDownSelectorAttrs<boolean>> {

		const sendPlaintextAttrs: DropDownSelectorAttrs<boolean> = {
			label: "externalFormatting_label",
			helpLabel: () => lang.get("externalFormattingInfo_msg"),
			items: [
				{name: lang.get("html_action"), value: false},
				{name: lang.get("plaintext_action"), value: true}
			],
			selectedValue: this.sendPlaintext,
			selectionChangedHandler: v => {
				userController.props.sendPlaintextOnly = v
				this.entityClient.update(userController.props)
			},
			dropdownWidth: 250,
		}

		return {
			name: "externalFormatting_label",
			component: DropDownSelectorN,
			attrs: sendPlaintextAttrs
		}
	}

	createAutomaticContactsSettings(userController: IUserController): SettingsValue<DropDownSelectorAttrs<boolean>> {

		const noAutomaticContactsAttrs: DropDownSelectorAttrs<boolean> = {
			label: "createContacts_label",
			helpLabel: () => lang.get("createContactsForRecipients_action"),
			items: [
				{name: lang.get("activated_label"), value: false},
				{name: lang.get("deactivated_label"), value: true}
			],
			selectedValue: this.noAutomaticContacts,
			selectionChangedHandler: v => {
				userController.props.noAutomaticContacts = v
				this.entityClient.update(userController.props)
			},
			dropdownWidth: 250
		}

		return {
			name: "createContacts_label",
			component: DropDownSelectorN,
			attrs: noAutomaticContactsAttrs
		}
	}

	createSearchMailboxSettings(): SettingsValue<DropDownSelectorAttrs<boolean>> {

		const enableMailIndexingAttrs: DropDownSelectorAttrs<boolean> = {
			label: "searchMailbox_label",
			helpLabel: () => lang.get("enableSearchMailbox_msg"),
			items: [
				{name: lang.get("activated_label"), value: true},
				{name: lang.get("deactivated_label"), value: false}
			],
			selectedValue: this.enableMailIndexing,
			selectionChangedHandler: mailIndexEnabled => {
				if (mailIndexEnabled) {
					showProgressDialog("pleaseWait_msg", this.indexerFacade.enableMailIndexing())
						.catch(ofClass(IndexingNotSupportedError, () => {
							Dialog.message(isApp() ? "searchDisabledApp_msg" : "searchDisabled_msg")
						}))
				} else {
					showProgressDialog("pleaseWait_msg", this.indexerFacade.disableMailIndexing("Disabled by user"))
				}
			},
			dropdownWidth: 250
		}

		return {
			name: "searchMailbox_label",
			component: DropDownSelectorN,
			attrs: enableMailIndexingAttrs
		}
	}

	createReportSpamSettings(): SettingsValue<DropDownSelectorAttrs<ReportMovedMailsTypeEnum>> {

		const reportMovedMailsAttrs = makeReportMovedMailsDropdownAttrs(
			this.reportMovedMails, this.mailboxProperties)

		return {
			name: "spamReports_label",
			component: DropDownSelectorN,
			attrs: reportMovedMailsAttrs
		}
	}

	createOutOfOfficeSettings(): SettingsValue<TextFieldAttrs> {

		const editOutOfOfficeNotificationButtonAttrs: ButtonAttrs = {
			label: "outOfOfficeNotification_title",
			click: () => {
				this.outOfOfficeNotification.getAsync().then(notification => showEditOutOfOfficeNotificationDialog(notification))
			},
			icon: () => Icons.Edit
		}

		const outOfOfficeAttrs: TextFieldAttrs = {
			label: "outOfOfficeNotification_title",
			value: this.outOfOfficeStatus,
			disabled: true,
			injectionsRight: () => [m(ButtonN, editOutOfOfficeNotificationButtonAttrs)]
		}

		return {
			name: "outOfOfficeNotification_title",
			component: TextFieldN,
			attrs: outOfOfficeAttrs
		}
	}

	updateTutanotaPropertiesSettings(props: TutanotaProperties) {
		if (props.defaultSender) {
			this.defaultSender(props.defaultSender)
		}
		this.defaultUnconfidential(props.defaultUnconfidential)
		this.noAutomaticContacts(props.noAutomaticContacts)
		this.sendPlaintext(props.sendPlaintextOnly)
		this.signature(getSignatureType(props).name)
	}

	updateMailboxPropertiesSettings() {
		this.mailboxProperties.getAsync().then(props => {
			this.reportMovedMails(getReportMovedMailsType(props))
			m.redraw()
		})
	}

	updateOutOfOfficeNotification(): void {
		const notification = this.outOfOfficeNotification.getLoaded()
		this.outOfOfficeStatus(formatActivateState(notification))
		m.redraw()
	}

	entityEventReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<mixed> {
		console.log("MailSettingsSection: Entity events received: ", updates)
		return promiseMap(updates, update => {
			let p = Promise.resolve()
			const {instanceListId, instanceId, operation} = update
			if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				p = this.entityClient.load(TutanotaPropertiesTypeRef, logins.getUserController().props._id).then(props => {
					this.updateTutanotaPropertiesSettings(props)
					// this.updateInboxRules(props)
				})
			} else if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE
				&& isSameId(logins.getUserController().userGroupInfo._id, [neverNull(instanceListId), instanceId])) {
				p = this.entityClient.load(GroupInfoTypeRef, [neverNull(instanceListId), instanceId]).then(groupInfo => {
					this.senderName(groupInfo.name)
					m.redraw()
				})
			} else if (isUpdateForTypeRef(MailboxPropertiesTypeRef, update)) {
				this.mailboxProperties.reload().then(() => this.updateMailboxPropertiesSettings())
			}
			return p.then(() => {
				this.identifierListViewer.entityEventReceived(update)
			})
		}).then(() => m.redraw())
	}
}

export class MailDropdownSettingsSection implements SettingsSection {

	heading: string
	category: string
	settingsValues: Array<SettingsValue<any>>

	editAliasFormAttrs: EditAliasesFormAttrs
	inboxRulesTableLines: Stream<Array<TableLineAttrs>>
	notificationTableLines: Stream<Array<TableLineAttrs>>
	identifierListViewer: IdentifierListViewer
	entityClient: EntityClient

	constructor(userController: IUserController, entityClient: EntityClient) {
		this.heading = "Mail Tables"
		this.category = "Mails"
		this.settingsValues = []

		this.editAliasFormAttrs = createEditAliasFormAttrs(userController.userGroupInfo)
		this.inboxRulesTableLines = stream([])
		this.notificationTableLines = stream([])
		this.identifierListViewer = new IdentifierListViewer(logins.getUserController().user)
		this.entityClient = entityClient

		this.settingsValues.push(this.createAliasSetting(userController))
		this.settingsValues.push(this.createInboxRulesSetting())
		this.settingsValues.push(this.createNotificationSetting(userController))
	}

	createAliasSetting(userController: IUserController): SettingsValue<SettingsTableAttrs> {

		const a: EditAliasesFormAttrs = {
			userGroupInfo: userController.userGroupInfo,
			aliasCount: {availableToCreate: 0, availableToEnable: 0},
			expanded: stream(true)
		}

		const addAliasButtonAttrs: ButtonAttrs = {
			label: "addEmailAlias_label",
			click: () => showAddAliasDialog(a),
			icon: () => Icons.Add
		}

		const aliasesTableAttrs: TableAttrs = {
			columnHeading: ["emailAlias_label", "state_label"],
			columnWidths: [ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: addAliasButtonAttrs,
			lines: getAliasLineAttrs(a),
		}

		const aliasSettingsTableAttrs: SettingsTableAttrs = {
			tableHeading: "mailAddressAliases_label",
			tableAttrs: aliasesTableAttrs
		}

		return {
			name: "mailAddressAliases_label",
			component: SettingsTable,
			attrs: aliasSettingsTableAttrs
		}
	}

	createInboxRulesSetting(): SettingsValue<SettingsTableAttrs> {

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
			lines: this.inboxRulesTableLines(),
		}

		const InboxRulesSettingsTableAttrs: SettingsTableAttrs = {
			tableHeading: "inboxRulesSettings_action",
			tableAttrs: inboxRulesTableAttrs
		}

		return {
			name: "inboxRulesSettings_action",
			component: SettingsTable,
			attrs: InboxRulesSettingsTableAttrs
		}
	}

	updateInboxRules(props: TutanotaProperties): void {
		locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
			this.inboxRulesTableLines(props.inboxRules.map((rule, index) => {
				return {
					cells: [getInboxRuleTypeName(rule.type), rule.value, this.getTextForTarget(mailboxDetails, rule.targetFolder)],
					actionButtonAttrs: createRowActions({
						getArray: () => props.inboxRules,
						updateInstance: () => this.entityClient.update(props).catch(ofClass(LockedError, noOp))
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

	createNotificationSetting(userController: IUserController): SettingsValue<SettingsTableAttrs> {

		const addNotificationRulesButtonAttrs: ButtonAttrs = {
			label: "emailPushNotification_action",
			click: () => showAddNotificationEmailAddressDialog(userController.user),
			icon: () => Icons.Add
		}
		const headings = lang.get("nbrOfInboxRules_msg", {"{1}": logins.getUserController().props.inboxRules.length})

		const notificationTableAttrs: TableAttrs = {
			columnHeading: [() => headings],
			columnWidths: [ColumnWidth.Small, ColumnWidth.Largest, ColumnWidth.Small],
			showActionButtonColumn: true,
			addButtonAttrs: addNotificationRulesButtonAttrs,
			lines: this.notificationTableLines()
		}

		const notificationSettingsTableAttrs: SettingsTableAttrs = {
			tableHeading: "notificationSettings_action",
			tableAttrs: notificationTableAttrs
		}

		return {
			name: "notificationSettings_action",
			component: SettingsTable,
			attrs: notificationSettingsTableAttrs
		}
	}

	getTextForTarget(mailboxDetails: MailboxDetail, targetFolderId: IdTuple): string {
		let folder = mailboxDetails.folders.find(folder => isSameId(folder._id, targetFolderId))
		if (folder) {
			return getFolderName(folder)
		} else {
			return "?"
		}
	}

	entityEventReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<mixed> {
		return promiseMap(updates, update => {
			let p = Promise.resolve()
			const {instanceListId, instanceId, operation} = update
			if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				p = this.entityClient.load(TutanotaPropertiesTypeRef, logins.getUserController().props._id).then(props => {
					this.updateInboxRules(props)
				})
			} else if (isUpdateForTypeRef(MailFolderTypeRef, update)) {
				this.updateInboxRules(logins.getUserController().props)
			} else if (isUpdateForTypeRef(GroupInfoTypeRef, update) && operation === OperationType.UPDATE
				&& isSameId(logins.getUserController().userGroupInfo._id, [neverNull(instanceListId), instanceId])) {
				p = this.entityClient.load(GroupInfoTypeRef, [neverNull(instanceListId), instanceId]).then(groupInfo => {
					this.editAliasFormAttrs.userGroupInfo = groupInfo
					m.redraw()
				})
			}
			return p.then(() => {
				this.identifierListViewer.entityEventReceived(update)
			})
		}).then(() => m.redraw())
	}
}