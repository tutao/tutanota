//@flow
import m from "mithril"
import {isApp} from "../api/Env"
import {HttpMethod as HttpMethodEnum} from "../api/common/EntityFunctions"
import {lang} from "../misc/LanguageViewModel"
import {erase, loadAll} from "../api/main/Entity"
import {neverNull} from "../api/common/utils/Utils"
import {createPushIdentifier, PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
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

type NotificationRowAttrs = {|
	name: string,
	identifier: ?string,
	current: boolean,
	removeClicked: () => void,
	enableClicked: (enable: boolean) => void
|}

class NotificationRowView implements MComponent<NotificationRowAttrs> {
	view(vnode: Vnode<NotificationRowAttrs>): Children {
		return m(".flex.flex-column.full-width", [
				m(".flex-space-between.items-center.selectable",
					[
						m("span" + (vnode.attrs.current ? ".b" : ""), vnode.attrs.name),
						this._buttonRemove(vnode),
					]),
				this._identifier(vnode)
			]
		)
	}

	_identifier(vnode: Vnode<NotificationRowAttrs>): Child {
		if (vnode.attrs.identifier) {
			return m(".text-break.small.monospace.mt-negative-s.selectable", neverNull(vnode.attrs.identifier.match(/.{2}/g))
				.map((el, i) => m("span.pr-s" + (i % 2 === 0 ? ".b" : ""), el)))
		} else {
			return m(".small.i.mt-negative-s.selectable", "Disabled")
		}
	}

	_buttonRemove(vnode: Vnode<NotificationRowAttrs>): Child {
		/*		if (vnode.attrs.current) {
		 const disabled = !vnode.attrs.identifier
		 return m(createDropDownButton("more_label", () => Icons.More, () => (disabled ? [] : [
		 new Button("delete_action", vnode.attrs.removeClicked)
		 .setType(ButtonType.Dropdown)
		 ]).concat([
		 new Button(disabled ? "enableForThisDevice_action" : "disableForThisDevice_action",
		 () => vnode.attrs.enableClicked(disabled))
		 .setType(ButtonType.Dropdown)
		 ]), /!*width=*!/ vnode.dom ? Math.min(300, vnode.dom.offsetWidth) : 300))
		 } else {*/
		return m(new Button("notificationsDisabled_label", vnode.attrs.removeClicked, () => Icons.Cancel))
//		}
	}
}

export class MailSettingNotificationViewer {
	view: Function;
	_user: ?User;
	_identifiers: PushIdentifier[] = [];
	_currentIdentifier: ?string;

	expanderContent = {
		view: () => {
			const buttonAdd = new Button("emailPushNotification_action",
				() => this._showAddNotificationEmailAddressDialog(), () => Icons.Add)
			const rowAdd = m(".full-width.flex-space-between.items-center.mb-s", [
				lang.get("emailPushNotification_action"), m(buttonAdd)
			])

			const rows = this._identifiers.map(identifier => {
				const current = isApp() && identifier.identifier === this._currentIdentifier
				return m(NotificationRowView, {
					name: this._identifierTypeName(current, identifier.pushServiceType),
					identifier: identifier.identifier,
					current: current,
					removeClicked: () => erase(identifier),
					//enableClicked: this._enableNotifications
				})
			}).sort((l, r) => r.attrs.current - l.attrs.current)

			// If notifications were disabled, add a row for the current device
			/*			if (isApp() && (rows.length === 0 || rows.length > 0 && !rows[0].attrs.current)) {
			 rows.unshift(m(NotificationRowView, {
			 name: lang.get("pushIdentifierCurrentDevice_label"),
			 identifier: null,
			 current: true,
			 removeClicked: () => {
			 },
			 enableClicked: this._enableNotifications
			 }))
			 }*/
			return m(".flex.flex-column.items-end.mb", [rowAdd].concat(rows))
		},
	}

	/*	_enableNotifications(enabled: boolean) {
	 pushServiceApp.enableNotifications(enabled).then(m.redraw)
	 }*/

	pushIdentifiersExpander =
		new ExpanderButton("show_action", new ExpanderPanel(this.expanderContent), false)

	view() {
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get('notificationSettings_action')),
				m(this.pushIdentifiersExpander)
			]),
			m(this.pushIdentifiersExpander.panel),
			m(".small", lang.get("pushIdentifierInfoMessage_msg"))
		]
	}

	loadPushIdentifiers(user: User) {
		this._user = user
		const list = user.pushIdentifierList
		if (list) {
			Promise.all([loadAll(PushIdentifierTypeRef, list.list), pushServiceApp.getPushIdentifier()])
			       .spread((identifiers, currentIdentifier) => {
				       this._identifiers = identifiers;
				       this._currentIdentifier = currentIdentifier;
				       m.redraw()
			       })
		}
	}

	_identifierTypeName(current: boolean, type: NumberString): string {
		if (current) {
			return lang.get("pushIdentifierCurrentDevice_label")
		} else {
			return [
				"Android FCM", "iOS", lang.get("adminEmailSettings_action"), "Android Tutanota"
			][Number(type)]
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
				return getCleanedMailAddress(emailAddressInputField.value()) == null ?
					"mailAddressInvalid_msg" : null // TODO check if it is a Tutanota mail address
			}).then(ok => {
				if (ok) {
					let pushIdentifier = createPushIdentifier()
					pushIdentifier.identifier = neverNull(getCleanedMailAddress(emailAddressInputField.value()))
					pushIdentifier.language = lang.code
					pushIdentifier.pushServiceType = PushServiceType.EMAIL
					pushIdentifier._ownerGroup = user.userGroup.group
					pushIdentifier._owner = user.userGroup.group // legacy
					pushIdentifier._area = "0" // legacy
					let p = worker.entityRequest(PushIdentifierTypeRef, HttpMethodEnum.POST,
						neverNull(user.pushIdentifierList).list, null, pushIdentifier);
					showProgressDialog("pleaseWait_msg", p)
				}
			})
		}
	}
}