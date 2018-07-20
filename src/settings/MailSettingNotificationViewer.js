//@flow
import m from "mithril"
import {Mode} from "../api/Env"
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

type NotiificationRowAttrs = {|
	name: string,
	identifier: string,
	current: boolean,
	removeClicked: () => void
|}

class NotificationRowView implements MComponent<NotiificationRowAttrs> {
	view(vnode: Vnode<NotiificationRowAttrs>): Children {
		return m(".flex.flex-column.full-width", [
				m(".flex-space-between.items-center",
					[m("span", vnode.attrs.name), this._buttonRemove(vnode.attrs.removeClicked)]),
				vnode.attrs.current ? m(".b.mt-negative-s", lang.get("pushIdentifierCurrentDevice_label")) : null,
				m(".text-break.small.monospace", neverNull(vnode.attrs.identifier.match(/.{2}/g))
					.map((el, i) => m("span.pr-s" + (i % 2 === 0 ? ".b" : ""), el)))
			]
		)
	}

	_buttonRemove(clickCallback: () => void): Child {
		return m(new Button("delete_action", clickCallback, () => Icons.Cancel))
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

			const rows = this._identifiers.map(identifier => m(NotificationRowView, {
				name: this._identifierTypeName(identifier.pushServiceType),
				identifier: identifier.identifier,
				current: env.mode === Mode.App && identifier.identifier === this._currentIdentifier,
				removeClicked: () => erase(identifier)
			})).sort((l, r) => r.attrs.current - l.attrs.current)
			return m(".flex.flex-column.items-end.mb", [rowAdd].concat(rows))
		},
	}

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
		pushServiceApp.getPushIdentifier().then((identifier) => {
			this._currentIdentifier = identifier
			m.redraw()
		})
	}

	_identifierTypeName(type: NumberString): string {
		return [
			"Android FCM", "iOS", lang.get("adminEmailSettings_action"), "Android Tutanota"
		][Number(type)]
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