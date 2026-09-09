import m, { Component, Vnode } from "mithril"
import { TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { IconButton, IconButtonAttrs } from "../../../../ui/base/IconButton"
import { TextField } from "../../../../ui/base/TextField"
import { theme } from "../../../../ui/theme"
import { InfoIcon, InfoIconAttrs } from "../../../../ui/base/InfoIcon"

export type SubscriptionStateCellAttrs = {
	label: TranslationKey
	value: string
	button?: IconButtonAttrs
	infoIcon?: InfoIconAttrs
}

/* Single cell with information about a subscription
 * @param label - Label that describes the information
 * @param value - Value that will be shown in the cell
 * @param button - Optional button if the state of the cell should be changed in some way
 */
export class SubscriptionStateCell implements Component<SubscriptionStateCellAttrs> {
	view({ attrs }: Vnode<SubscriptionStateCellAttrs>) {
		const { label, value, button, infoIcon } = attrs
		return m(TextField, {
			label,
			value,
			isReadOnly: true,
			class: "bg-white",
			style: {
				"background-color": theme.surface,
				flex: "0 0 0",
			},
			injectionsRight: () => [button ? this.renderButton(button) : null, infoIcon ? this.renderInfoIcon(infoIcon) : null],
		})
	}

	private renderButton(button: IconButtonAttrs) {
		return m(IconButton, button)
	}
	private renderInfoIcon(infoIcon: InfoIconAttrs) {
		return m(".abs", m(InfoIcon, infoIcon))
	}
}
