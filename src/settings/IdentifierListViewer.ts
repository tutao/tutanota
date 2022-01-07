import m from "mithril"
import {isApp, isDesktop, isBrowser} from "../api/common/Env"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {neverNull, noOp, ofClass} from "@tutao/tutanota-utils"
import type {PushIdentifier} from "../api/entities/sys/PushIdentifier"
import {createPushIdentifier, PushIdentifierTypeRef} from "../api/entities/sys/PushIdentifier"
import {logins} from "../api/main/LoginController"
import {Icons} from "../gui/base/icons/Icons"
import {PushServiceType} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {Dialog} from "../gui/base/Dialog"
import {NotFoundError} from "../api/common/error/RestError"
import {attachDropdown} from "../gui/base/DropdownN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import type {ExpanderAttrs} from "../gui/base/Expander"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"
import stream from "mithril/stream/stream.js"
import type {TextFieldAttrs} from "../gui/base/TextFieldN"
import {TextFieldN} from "../gui/base/TextFieldN"
import type {EntityUpdateData} from "../api/main/EventController"
import {isUpdateForTypeRef} from "../api/main/EventController"
import type {User} from "../api/entities/sys/User"
import {showNotAvailableForFreeDialog} from "../misc/SubscriptionDialogs"
import {getCleanedMailAddress} from "../misc/parsing/MailAddressParser"
import {locator} from "../api/main/MainLocator"
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
        const dropdownAttrs = attachDropdown(
            {
                label: "edit_action",
                icon: () => Icons.Edit,
            },
            () => [
                {
                    label: () => lang.get(vnode.attrs.disabled ? "activate_action" : "deactivate_action"),
                    type: ButtonType.Dropdown,
                    click: vnode.attrs.disableClicked,
                },
                {
                    label: "delete_action",
                    type: ButtonType.Dropdown,
                    click: vnode.attrs.removeClicked,
                },
            ],
        )
        return m(".flex.flex-column.full-width", [
            m(".flex.items-center.selectable", [
                m("span" + (vnode.attrs.current ? ".b" : ""), vnode.attrs.name),
                vnode.attrs.disabled ? m(".mlr", `(${lang.get("notificationsDisabled_label")})`) : null,
                m(".flex-grow"),
                m(ButtonN, dropdownAttrs),
            ]),
            this._identifier(vnode),
        ])
    }

    _identifier(vnode: Vnode<IdentifierRowAttrs>): Children {
        const identifierText = vnode.attrs.formatIdentifier
            ? neverNull(vnode.attrs.identifier.match(/.{2}/g)).map((el, i) => m("span.pr-s" + (i % 2 === 0 ? ".b" : ""), el))
            : vnode.attrs.identifier
        return m(".text-break.small.monospace.mt-negative-s.selectable", identifierText)
    }
}

export class IdentifierListViewer {
    _currentIdentifier: string | null
    _expanded: Stream<boolean>
    _user: User | null
    _identifiers: Stream<PushIdentifier[]>

    constructor(user: User | null) {
        this._expanded = stream(false)
        this._identifiers = stream([])
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
            expanded: this._expanded,
        }
        const expanderContent = {
            view: (): Children => {
                const buttonAddAttrs: ButtonAttrs = {
                    label: "emailPushNotification_action",
                    click: () => this._showAddNotificationEmailAddressDialog(this._user),
                    icon: () => Icons.Add,
                }
                const rowAdd = m(".full-width.flex-space-between.items-center.mb-s", [lang.get("emailPushNotification_action"), m(ButtonN, buttonAddAttrs)])

                const rows = this._identifiers()
                    .map(identifier => {
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
                m(ExpanderButtonN, pushIdentifiersExpanderAttrs),
            ]),
            m(
                ExpanderPanelN,
                {
                    expanded: this._expanded,
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
        if (isBrowser() || !this._user) {
            return
        }

        this._currentIdentifier = locator.pushService.getPushIdentifier()
        const list = neverNull(this._user).pushIdentifierList

        if (list) {
            const identifiers = await locator.entityClient.loadAll(PushIdentifierTypeRef, list.list)

            this._identifiers(identifiers)

            m.redraw()
        }
    }

    _showAddNotificationEmailAddressDialog(user: User | null) {
        if (!user) {
            return
        }

        const mailAddress = stream("")

        if (logins.getUserController().isFreeAccount()) {
            showNotAvailableForFreeDialog(true)
        } else {
            let emailAddressInputFieldAttrs: TextFieldAttrs = {
                label: "mailAddress_label",
                value: mailAddress,
            }
            let form = {
                view: () => [m(TextFieldN, emailAddressInputFieldAttrs), m(".small.mt-s", lang.get("emailPushNotification_msg"))],
            }

            let addNotificationEmailAddressOkAction = dialog => {
                user = neverNull(user)
                let pushIdentifier = createPushIdentifier()
                pushIdentifier.displayName = lang.get("adminEmailSettings_action")
                pushIdentifier.identifier = neverNull(getCleanedMailAddress(mailAddress()))
                pushIdentifier.language = lang.code
                pushIdentifier.pushServiceType = PushServiceType.EMAIL
                pushIdentifier._ownerGroup = user.userGroup.group
                pushIdentifier._owner = user.userGroup.group // legacy

                pushIdentifier._area = "0" // legacy

                let p = locator.entityClient.setup(neverNull(user.pushIdentifierList).list, pushIdentifier)
                showProgressDialog("pleaseWait_msg", p)
                dialog.close()
            }

            Dialog.showActionDialog({
                title: lang.get("notificationSettings_action"),
                child: form,
                validator: () => this._validateAddNotificationEmailAddressInput(mailAddress()),
                allowOkWithReturn: true,
                okAction: addNotificationEmailAddressOkAction,
            })
        }
    }

    _validateAddNotificationEmailAddressInput(emailAddress: string): TranslationKey | null {
        return getCleanedMailAddress(emailAddress) == null ? "mailAddressInvalid_msg" : null // TODO check if it is a Tutanota mail address
    }

    entityEventReceived(update: EntityUpdateData): void {
        if (isUpdateForTypeRef(PushIdentifierTypeRef, update)) {
            this._loadPushIdentifiers()
        }
    }
}