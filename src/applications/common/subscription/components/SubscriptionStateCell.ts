import m, { Component, Vnode } from "mithril"
import { TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { IconButton, IconButtonAttrs } from "../../../../ui/base/IconButton"
import { TextField } from "../../../../ui/base/TextField"

export type SubscriptionStateCellAttrs = {
	label: TranslationKey
	value: string
	button?: IconButtonAttrs
}

/* Single cell with information about a subscription
 * @param label - Label that describes the information
 * @param value - Value that will be shown in the cell
 * @param button - Optional button if the state of the cell should be changed in some way
 */
export class SubscriptionStateCell implements Component<SubscriptionStateCellAttrs> {
	view({ attrs }: Vnode<SubscriptionStateCellAttrs>) {
		const { label, value, button } = attrs
		return m(TextField, {
			label,
			value,
			isReadOnly: true,
			class: "bg-white",
			style: {
				"background-color": "white",
			},
			injectionsRight: () => this.renderButton(button),
		})
	}

	private renderButton(button?: IconButtonAttrs) {
		if (!button) {
			return null
		}
		return m(IconButton, button)
	}
}
