//@flow
import m from "mithril"
import {isApp} from "../api/Env"
import {HttpMethod as HttpMethodEnum} from "../api/common/EntityFunctions"
import {lang} from "../misc/LanguageViewModel"
import {erase, loadAll, update} from "../api/main/Entity"
import {neverNull, noOp} from "../api/common/utils/Utils"
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
import {NotFoundError} from "../api/common/error/RestError"
import {attachDropdown} from "../gui/base/DropdownN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"

type NotificationRowAttrs = {|
	name: string,
	identifier: string,
	disabled: boolean,
	current: boolean,
	formatIdentifier: boolean,
	removeClicked: () => void,
	disableClicked: () => void
|}

class NotificationRowView implements MComponent<NotificationRowAttrs> {
	view(vnode: Vnode<NotificationRowAttrs>): Children {

		const dropdownAttrs = attachDropdown({
			label: "edit_action",
			icon: () => Icons.Edit,
		}, () => [
			{
				label: () => lang.get(vnode.attrs.disabled ? "activate_action" : "deactivate_action"),
				type: ButtonType.Dropdown,
				click: vnode.attrs.disableClicked,
			},
			{
				label: "delete_action",
				type: ButtonType.Dropdown,
				click: vnode.attrs.removeClicked,
			}
		])

		return m(".flex.flex-column.full-width", [
				m(".flex.items-center.selectable",
					[
						m("span" + (vnode.attrs.current ? ".b" : ""), vnode.attrs.name),
						vnode.attrs.disabled
							? m(".mlr", `(${lang.get("notificationsDisabled_label")})`)
							: null,
						m(".flex-grow"),
						m(ButtonN, dropdownAttrs),
					]),
				this._identifier(vnode)
			]
		)
	}

	_identifier(vnode: Vnode<NotificationRowAttrs>): Child {
		const identifierText = vnode.attrs.formatIdentifier ? (
			neverNull(vnode.attrs.identifier.match(/.{2}/g))
				.map((el, i) => m("span.pr-s" + (i % 2 === 0 ? ".b" : ""), el))
		) : vnode.attrs.identifier
		return m(".text-break.small.monospace.mt-negative-s.selectable", identifierText)
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
					disabled: identifier.disabled,
					identifier: identifier.identifier,
					current: current,
					removeClicked: () => {erase(identifier).catch(NotFoundError, noOp)},
					formatIdentifier: identifier.pushServiceType !== PushServiceType.EMAIL,
					disableClicked: () => this._disableIdentifier(identifier)
				})
			}).sort((l, r) => (+r.attrs.current) - (+l.attrs.current))
			return m(".flex.flex-column.items-end.mb", [rowAdd].concat(rows))
		},
	}

	_disableIdentifier(identifier: PushIdentifier) {
		identifier.disabled = !identifier.disabled
		update(identifier).then(m.redraw)
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
		this._currentIdentifier = pushServiceApp.getPushIdentifier()
		const list = user.pushIdentifierList
		if (list) {
			loadAll(PushIdentifierTypeRef, list.list)
				.then((identifiers) => {
					this._identifiers = identifiers
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
			showNotAvailableForFreeDialog(true)
		} else {

			let emailAddressInputField = new TextField("mailAddress_label")
			let form = {
				view: () => [
					m(emailAddressInputField),
					m(".small.mt-s", lang.get("emailPushNotification_msg"))
				]
			}
			let addNotificationEmailAddressOkAction = (dialog) => {
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
				dialog.close()
			}

			Dialog.showActionDialog({
				title: lang.get("notificationSettings_action"),
				child: form,
				validator: () => this._validateAddNotificationEmailAddressInput(emailAddressInputField.value()),
				okAction: addNotificationEmailAddressOkAction
			})
		}
	}

	_validateAddNotificationEmailAddressInput(emailAddress: string): ?string {
		return getCleanedMailAddress(emailAddress) == null
			? "mailAddressInvalid_msg"
			: null // TODO check if it is a Tutanota mail address
	}
}