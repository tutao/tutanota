import m, {Children, Component, Vnode} from "mithril"
import stream from "mithril/stream/stream.js"
import type {SelectorItemList} from "../../gui/base/DropDownSelectorN"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import {Dialog} from "../../gui/base/Dialog"
import {Icons} from "../../gui/base/icons/Icons"
import {ButtonN} from "../../gui/base/ButtonN"
import {TextFieldN} from "../../gui/base/TextFieldN"
export type WhitelabelRegistrationSettingsAttrs = {
    whitelabelCode: string
    onWhitelabelCodeChanged: (arg0: string) => unknown
    currentRegistrationDomain: string | null
    possibleRegistrationDomains: SelectorItemList<string | null>
    onRegistrationDomainSelected: (arg0: string | null) => unknown
}
export class WhitelabelRegistrationSettings implements Component<WhitelabelRegistrationSettingsAttrs> {
    constructor(vnode: Vnode<WhitelabelRegistrationSettingsAttrs>) {}

    view(vnode: Vnode<WhitelabelRegistrationSettingsAttrs>): Children {
        const {currentRegistrationDomain, possibleRegistrationDomains, onRegistrationDomainSelected, whitelabelCode, onWhitelabelCodeChanged} = vnode.attrs
        return m("", [
            this._renderRegistrationDomain(currentRegistrationDomain, possibleRegistrationDomains, onRegistrationDomainSelected),
            this._renderWhitelabelCodeField(whitelabelCode, onWhitelabelCodeChanged),
        ])
    }

    _renderRegistrationDomain(
        currentRegistrationDomain: string | null,
        possibleRegistrationDomains: SelectorItemList<string | null>,
        onRegistrationDomainSelected: (arg0: string | null) => unknown,
    ): Children {
        const registrationDomainsAttrs = {
            label: "whitelabelRegistrationEmailDomain_label",
            selectedValue: stream(currentRegistrationDomain),
            items: possibleRegistrationDomains,
            selectionChangedHandler: onRegistrationDomainSelected
                ? selectedValue => {
                      onRegistrationDomainSelected(selectedValue)
                  }
                : null,
            disabled: !onRegistrationDomainSelected,
        } as const
        return m(DropDownSelectorN, registrationDomainsAttrs)
    }

    _renderWhitelabelCodeField(whitelabelCode: string, onWhitelabelCodeChanged: ((arg0: string) => unknown) | null): Children {
        let editButtonAttrs = null

        if (onWhitelabelCodeChanged) {
            editButtonAttrs = {
                label: "edit_action",
                click: () => {
                    Dialog.showTextInputDialog("edit_action", "whitelabelRegistrationCode_label", null, whitelabelCode).then(newCode => {
                        onWhitelabelCodeChanged(newCode)
                    })
                },
                icon: () => Icons.Edit,
            }
        }

        const whitelabelRegistrationTextfieldAttrs = {
            label: "whitelabelRegistrationCode_label",
            value: stream(whitelabelCode),
            disabled: true,
            injectionsRight: () => [editButtonAttrs ? m(ButtonN, editButtonAttrs) : null],
        } as const
        return m(TextFieldN, whitelabelRegistrationTextfieldAttrs)
    }
}