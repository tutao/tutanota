// @flow

import m from "mithril"
import stream from "mithril/stream/stream.js"
import {DropDownSelectorN} from "../../gui/base/DropDownSelectorN"
import {Dialog} from "../../gui/base/Dialog"
import {Icons} from "../../gui/base/icons/Icons"
import {ButtonN} from "../../gui/base/ButtonN"
import {TextFieldN} from "../../gui/base/TextFieldN"

export type WhitelabelRegistrationSettingsAttrs = {
	whitelabelCode: string,
	onWhitelabelCodeChanged: ?(string) => mixed,
	currentRegistrationDomain: string,
	possibleRegistrationDomains: Array<{name: string, value: string}>,
	onRegistrationDomainSelected: ?(string => mixed),
}

export class WhitelabelRegistrationSettings implements MComponent<WhitelabelRegistrationSettingsAttrs> {
	constructor(vnode: Vnode<WhitelabelRegistrationSettingsAttrs>) {}

	view(vnode: Vnode<WhitelabelRegistrationSettingsAttrs>): Children {
		const {
			currentRegistrationDomain,
			possibleRegistrationDomains,
			onRegistrationDomainSelected,
			whitelabelCode,
			onWhitelabelCodeChanged
		} = vnode.attrs

		return m("", [
			this._renderRegistrationDomain(currentRegistrationDomain, possibleRegistrationDomains, onRegistrationDomainSelected,),
			this._renderWhitelabelCodeField(whitelabelCode, onWhitelabelCodeChanged)
		])
	}

	_renderRegistrationDomain(currentRegistrationDomain: string, possibleRegistrationDomains: Array<{name: string, value: string}>, onRegistrationDomainSelected: ?(string) => mixed): Children {
		const registrationDomainsAttrs = {
			label: "whitelabelRegistrationEmailDomain_label",
			selectedValue: stream(currentRegistrationDomain),
			items: possibleRegistrationDomains,
			selectionChangedHandler: (onRegistrationDomainSelected)
				? (selectedValue) => {onRegistrationDomainSelected(selectedValue)}
				: null,
			disabled: (onRegistrationDomainSelected) ? false : true
		}
		return m(DropDownSelectorN, registrationDomainsAttrs)
	}

	_renderWhitelabelCodeField(whitelabelCode: string, onWhitelabelCodeChanged: ?(string) => mixed): Children {
		let editButtonAttrs = null
		if (onWhitelabelCodeChanged) {
			editButtonAttrs = {
				label: "edit_action",
				click: () => {
					Dialog.showTextInputDialog("edit_action", "whitelabelRegistrationCode_label", null, whitelabelCode)
					      .then(newCode => {
						      onWhitelabelCodeChanged(newCode)
					      })
				},
				icon: () => Icons.Edit
			}
		}

		const whitelabelRegistrationTextfieldAttrs = {
			label: "whitelabelRegistrationCode_label",
			value: stream(whitelabelCode),
			disabled: true,
			injectionsRight: () => [(editButtonAttrs) ? m(ButtonN, editButtonAttrs) : null]
		}

		return m(TextFieldN, whitelabelRegistrationTextfieldAttrs)
	}
}