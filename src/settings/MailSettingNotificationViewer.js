//@flow
import m from "mithril"
import {Mode} from "../api/Env"
import {HttpMethod as HttpMethodEnum} from "../api/common/EntityFunctions"
import {lang} from "../misc/LanguageViewModel"
import {Table, ColumnWidth} from "../gui/base/Table"
import {loadAll, erase} from "../api/main/Entity"
import TableLine from "../gui/base/TableLine"
import {neverNull} from "../api/common/utils/Utils"
import {PushIdentifierTypeRef, createPushIdentifier} from "../api/entities/sys/PushIdentifier"
import {Button} from "../gui/base/Button"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {pushServiceApp} from "../native/PushServiceApp"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {PushServiceType} from "../api/common/TutanotaConstants"
import {getCleanedMailAddress} from "../misc/Formatter"
import {showNotAvailableForFreeDialog} from "../misc/ErrorHandlerImpl"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {worker} from "../api/main/WorkerClient"
import {Dialog} from "../gui/base/Dialog"
import {TextField} from "../gui/base/TextField"

export class MailSettingNotificationViewer {
	view: Function;
	_user: ?User;
	_pushIdentifiersTable: Table;

	constructor() {
		let addPushIdentifierButton = new Button("emailPushNotification_action", () => this._showAddNotificationEmailAddressDialog(), () => Icons.Add)
		this._pushIdentifiersTable = new Table(["pushIdentifierDeviceType_label", "pushRecipient_label"], [ColumnWidth.Small, ColumnWidth.Largest], true, addPushIdentifierButton)
		let pushIdentifiersExpander = new ExpanderButton("show_action", new ExpanderPanel(this._pushIdentifiersTable), false)

		this.view = () => {
			return [
				m(".flex-space-between.items-center.mt-l.mb-s", [
					m(".h4", lang.get('notificationSettings_action')),
					m(pushIdentifiersExpander)
				]),
				m(pushIdentifiersExpander.panel),
				m(".small", lang.get("pushIdentifierInfoMessage_msg"))
			]
		}
	}

	loadPushIdentifiers(user: User) {
		this._user = user
		let list = user.pushIdentifierList
		if (list) {
			loadAll(PushIdentifierTypeRef, neverNull(list).list).then(identifiers => {
				this._pushIdentifiersTable.updateEntries(identifiers.map(identifier => {
					let emailTypeName = lang.get("adminEmailSettings_action")
					let typeName = ["Android", "iOS", emailTypeName][Number(identifier.pushServiceType)]
					let isCurrentPushIdentifier = env.mode == Mode.App && identifier.identifier == pushServiceApp.currentPushIdentifier;
					let identifierText = (isCurrentPushIdentifier) ? lang.get("pushIdentifierCurrentDevice_label") + " - " + identifier.identifier : identifier.identifier
					let actionButton = new Button("delete_action", () => erase(identifier), () => Icons.Cancel)
					return new TableLine([typeName, identifierText], actionButton)
				}))
			})
		} else {
			this._pushIdentifiersTable.updateEntries([])
		}
	}

	_showAddNotificationEmailAddressDialog() {
		if (!this._user) return
		const user = this._user
		if (logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog()
		} else {

			let emailAddressInputField = new TextField("mailAddress_label")
			return Dialog.smallDialog(lang.get("notificationSettings_action"), {
				view: () => [
					m(emailAddressInputField),
					m(".small.mt-s", lang.get("emailPushNotification_msg"))
				]
			}, () => {
				return getCleanedMailAddress(emailAddressInputField.value()) == null ? "mailAddressInvalid_msg" : null // TODO check if it is a Tutanota mail address
			}).then(ok => {
				if (ok) {
					let pushIdentifier = createPushIdentifier()
					pushIdentifier.identifier = neverNull(getCleanedMailAddress(emailAddressInputField.value()))
					pushIdentifier.language = lang.code
					pushIdentifier.pushServiceType = PushServiceType.EMAIL
					pushIdentifier._ownerGroup = user.userGroup.group
					pushIdentifier._owner = user.userGroup.group // legacy
					pushIdentifier._area = "0" // legacy
					let p = worker.entityRequest(PushIdentifierTypeRef, HttpMethodEnum.POST, neverNull(user.pushIdentifierList).list, null, pushIdentifier);
					showProgressDialog("pleaseWait_msg", p)
				}
			})
		}
	}

}