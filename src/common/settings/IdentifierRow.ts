import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../misc/LanguageViewModel.js"
import { neverNull } from "@tutao/tutanota-utils"
import { Icons } from "../gui/base/icons/Icons.js"
import { attachDropdown } from "../gui/base/Dropdown.js"
import { IconButton } from "../gui/base/IconButton.js"
import { ButtonSize } from "../gui/base/ButtonSize.js"

export interface IdentifierRowAttrs {
	name: string
	identifier: string
	disabled: boolean
	current: boolean
	formatIdentifier: boolean
	removeClicked: () => void
	disableClicked: () => void
}

/**
 * Displays data for one push identifier
 */
export class IdentifierRow implements Component<IdentifierRowAttrs> {
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
			this.renderIdentifier(vnode.attrs),
		])
	}

	private renderIdentifier({ identifier, formatIdentifier }: IdentifierRowAttrs): Children {
		const identifierText = formatIdentifier
			? neverNull(identifier.match(/.{2}/g)).map((el, i) => m("span.pr-s" + (i % 2 === 0 ? ".b" : ""), el))
			: identifier
		return m(".text-break.small.monospace.mt-negative-hpad-button.selectable", identifierText)
	}
}
