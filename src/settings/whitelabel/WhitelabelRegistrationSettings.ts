import m, { Children, Component, Vnode } from "mithril"
import type { SelectorItemList } from "../../gui/base/DropDownSelector.js"
import { DropDownSelector } from "../../gui/base/DropDownSelector.js"
import { Dialog } from "../../gui/base/Dialog"
import { Icons } from "../../gui/base/icons/Icons"
import { TextField } from "../../gui/base/TextField.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { ButtonSize } from "../../gui/base/ButtonSize.js"

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
		const { currentRegistrationDomain, possibleRegistrationDomains, onRegistrationDomainSelected, whitelabelCode, onWhitelabelCodeChanged } = vnode.attrs
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
		return m(DropDownSelector, {
			label: "whitelabelRegistrationEmailDomain_label",
			selectedValue: currentRegistrationDomain,
			items: possibleRegistrationDomains,
			selectionChangedHandler: onRegistrationDomainSelected
				? (selectedValue: string | null) => {
						onRegistrationDomainSelected(selectedValue)
				  }
				: null,
			disabled: !onRegistrationDomainSelected,
		})
	}

	_renderWhitelabelCodeField(whitelabelCode: string, onWhitelabelCodeChanged: ((arg0: string) => unknown) | null): Children {
		return m(TextField, {
			label: "whitelabelRegistrationCode_label",
			value: whitelabelCode,
			isReadOnly: true,
			injectionsRight: () =>
				onWhitelabelCodeChanged
					? m(IconButton, {
							title: "edit_action",
							click: () => this.editRegistrationCode(whitelabelCode, onWhitelabelCodeChanged),
							icon: Icons.Edit,
							size: ButtonSize.Compact,
					  })
					: null,
		} as const)
	}

	private editRegistrationCode(whitelabelCode: string, onWhitelabelCodeChanged: (arg0: string) => unknown) {
		Dialog.showTextInputDialog({
			title: "edit_action",
			label: "whitelabelRegistrationCode_label",
			defaultValue: whitelabelCode,
		}).then((newCode) => {
			onWhitelabelCodeChanged(newCode)
		})
	}
}
