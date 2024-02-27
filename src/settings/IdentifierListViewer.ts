import m, { Children, Component, Vnode } from "mithril"
import { isApp, isDesktop } from "../api/common/Env"
import type { TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import { assertNotNull, neverNull, noOp, ofClass } from "@tutao/tutanota-utils"
import type { PushIdentifier, User } from "../api/entities/sys/TypeRefs.js"
import { createPushIdentifier, PushIdentifierTypeRef } from "../api/entities/sys/TypeRefs.js"
import { Icons } from "../gui/base/icons/Icons"
import { PushServiceType } from "../api/common/TutanotaConstants"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { Dialog } from "../gui/base/Dialog"
import { NotFoundError } from "../api/common/error/RestError"
import { attachDropdown } from "../gui/base/Dropdown.js"
import type { ExpanderAttrs } from "../gui/base/Expander"
import { ExpanderButton, ExpanderPanel } from "../gui/base/Expander"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { TextField, TextFieldType } from "../gui/base/TextField.js"

import { showNotAvailableForFreeDialog } from "../misc/SubscriptionDialogs"
import { getCleanedMailAddress } from "../misc/parsing/MailAddressParser"
import { locator } from "../api/main/MainLocator"
import { IconButton, IconButtonAttrs } from "../gui/base/IconButton.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"

type IdentifierRowAttrs = {
	name: string
	identifier: string
	disabled: boolean
	current: boolean
	formatIdentifier: boolean
	removeClicked: () => void
	disableClicked: () => void
}

class IdentifierRow implements Component<IdentifierRowAttrs> {
	view(vnode: Vnode<IdentifierRowAttrs>): Children {
		const dropdownAttrs = attachDropdown({
			mainButtonAttrs: {
				title: "edit_action",
				icon: Icons.More,
				size: ButtonSize.Compact,
			},
			childAttrs: () => [
				{
					label: () => lang.get(vnode.attrs.disabled ? "activate_action" : "deactivate_action"),
					click: vnode.attrs.disableClicked,
				},
				{
					label: "delete_action",
					click: vnode.attrs.removeClicked,
				},
			],
		})
		return m(".flex.flex-column.full-width", [
			m(".flex.items-center.selectable", [
				m("span" + (vnode.attrs.current ? ".b" : ""), vnode.attrs.name),
				vnode.attrs.disabled ? m(".mlr", `(${lang.get("notificationsDisabled_label")})`) : null,
				m(".flex-grow"),
				m(IconButton, dropdownAttrs),
			]),
			this._identifier(vnode),
		])
	}

	_identifier(vnode: Vnode<IdentifierRowAttrs>): Children {
		const identifierText = vnode.attrs.formatIdentifier
			? neverNull(vnode.attrs.identifier.match(/.{2}/g)).map((el, i) => m("span.pr-s" + (i % 2 === 0 ? ".b" : ""), el))
			: vnode.attrs.identifier
		return m(".text-break.small.monospace.mt-negative-hpad-button.selectable", identifierText)
	}
}

export class IdentifierListViewer {
	private _currentIdentifier: string | null = null
	private readonly _expanded: Stream<boolean>
	private readonly _user: User
	private _identifiers: PushIdentifier[]

	constructor(user: User) {
		this._expanded = stream<boolean>(false)
		this._identifiers = []
		this._user = user

		this._loadPushIdentifiers()
	}

	_disableIdentifier(identifier: PushIdentifier) {
		identifier.disabled = !identifier.disabled
		locator.entityClient.update(identifier).then(m.redraw)
	}

	view(): Children {
		const pushIdentifiersExpanderAttrs: ExpanderAttrs = {
			label: "show_action",
			expanded: this._expanded(),
			onExpandedChange: this._expanded,
		}
		const expanderContent = {
			view: (): Children => {
				const buttonAddAttrs: IconButtonAttrs = {
					title: "emailPushNotification_action",
					click: () => this._showAddNotificationEmailAddressDialog(this._user),
					icon: Icons.Add,
					size: ButtonSize.Compact,
				}
				const rowAdd = m(".full-width.flex-space-between.items-center.mb-s", [lang.get("emailPushNotification_action"), m(IconButton, buttonAddAttrs)])

				const rows = this._identifiers
					.map((identifier) => {
						const isCurrentDevice = (isApp() || isDesktop()) && identifier.identifier === this._currentIdentifier

						return m(IdentifierRow, {
							name: this._identifierDisplayName(isCurrentDevice, identifier.pushServiceType, identifier.displayName),
							disabled: identifier.disabled,
							identifier: identifier.identifier,
							current: isCurrentDevice,
							removeClicked: () => {
								locator.entityClient.erase(identifier).catch(ofClass(NotFoundError, noOp))
							},
							formatIdentifier: identifier.pushServiceType !== PushServiceType.EMAIL,
							disableClicked: () => this._disableIdentifier(identifier),
						})
					})
					.sort((l, r) => +r.attrs.current - +l.attrs.current)

				return m(".flex.flex-column.items-end.mb", [rowAdd].concat(rows))
			},
		}
		return [
			m(".flex-space-between.items-center.mt-l.mb-s", [
				m(".h4", lang.get("notificationSettings_action")),
				m(ExpanderButton, pushIdentifiersExpanderAttrs),
			]),
			m(
				ExpanderPanel,
				{
					expanded: this._expanded(),
				},
				m(expanderContent),
			),
			m(".small", lang.get("pushIdentifierInfoMessage_msg")),
		]
	}

	_identifierDisplayName(current: boolean, type: NumberString, displayName: string): string {
		if (current) {
			return lang.get("pushIdentifierCurrentDevice_label")
		} else if (displayName) {
			return displayName
		} else {
			return ["Android FCM", "iOS", lang.get("adminEmailSettings_action"), "Android Tutanota"][Number(type)]
		}
	}

	async _loadPushIdentifiers() {
		if (!this._user) {
			return
		}

		this._currentIdentifier = this.getCurrentIdentifier()
		const list = this._user.pushIdentifierList

		if (list) {
			this._identifiers = await locator.entityClient.loadAll(PushIdentifierTypeRef, list.list)

			m.redraw()
		}
	}

	private getCurrentIdentifier(): string | null {
		return isApp() || isDesktop() ? locator.pushService.getLoadedPushIdentifier() : null
	}

	_showAddNotificationEmailAddressDialog(user: User) {
		if (locator.logins.getUserController().isFreeAccount()) {
			showNotAvailableForFreeDialog()
		} else {
			let mailAddress = ""

			Dialog.showActionDialog({
				title: lang.get("notificationSettings_action"),
				child: {
					view: () => [
						m(TextField, {
							label: "mailAddress_label",
							value: mailAddress,
							type: TextFieldType.Email,
							oninput: (newValue) => (mailAddress = newValue),
						}),
						m(".small.mt-s", lang.get("emailPushNotification_msg")),
					],
				},
				validator: () => this._validateAddNotificationEmailAddressInput(mailAddress),
				allowOkWithReturn: true,
				okAction: (dialog: Dialog) => {
					this.createNotificationEmail(mailAddress, user)
					dialog.close()
				},
			})
		}
	}

	private createNotificationEmail(mailAddress: string, user: User) {
		const pushIdentifier = createPushIdentifier({
			_area: "0", // legacy
			_owner: user.userGroup.group, // legacy
			_ownerGroup: user.userGroup.group,
			displayName: lang.get("adminEmailSettings_action"),
			identifier: assertNotNull(getCleanedMailAddress(mailAddress)),
			language: lang.code,
			pushServiceType: PushServiceType.EMAIL,
			lastUsageTime: new Date(),
			lastNotificationDate: null,
			disabled: false,
		})

		let p = locator.entityClient.setup(assertNotNull(user.pushIdentifierList).list, pushIdentifier)
		showProgressDialog("pleaseWait_msg", p)
	}

	_validateAddNotificationEmailAddressInput(emailAddress: string): TranslationKey | null {
		return getCleanedMailAddress(emailAddress) == null ? "mailAddressInvalid_msg" : null // TODO check if it is a Tutanota mail address
	}

	async entityEventReceived(update: EntityUpdateData): Promise<void> {
		if (isUpdateForTypeRef(PushIdentifierTypeRef, update)) {
			await this._loadPushIdentifiers()
		}
	}
}
