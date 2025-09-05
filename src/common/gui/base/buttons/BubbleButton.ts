import m, { Children, Component, Vnode } from "mithril"
import { BaseButton, BaseButtonAttrs } from "./BaseButton.js"
import { lang, MaybeTranslation } from "../../../misc/LanguageViewModel.js"
import { AllIcons, Icon } from "../Icon.js"
import { theme } from "../../theme.js"
import { styles } from "../../styles.js"
import { component_size, px, size } from "../../size.js"

export interface BubbleButtonAttrs {
	label: MaybeTranslation
	text?: MaybeTranslation
	icon?: AllIcons
	onclick: BaseButtonAttrs["onclick"]
}

export function bubbleButtonHeight(): number {
	return usingMobileBubbleButton() ? component_size.button_height : component_size.button_height_bubble
}

export function usingMobileBubbleButton() {
	return styles.isUsingBottomNavigation()
}

export function bubbleButtonPadding(): string {
	return usingMobileBubbleButton() ? "plr-16" : "plr-8"
}

/**
 * Button that renders an icon, some text next to it and additional children on the right.
 * The text will be ellipsized if it doesn't fit, unlike most buttons.
 * It will change it's look based on mobile/desktop layout to have bigger touch area for mobile devices.
 */
export class BubbleButton implements Component<BubbleButtonAttrs> {
	view({ attrs, children }: Vnode<BubbleButtonAttrs>): Children {
		return m(
			BaseButton,
			{
				label: attrs.label,
				text: attrs.text ? m("span.text-ellipsis", lang.getTranslationText(attrs.text)) : lang.getTranslationText(attrs.label),
				icon:
					attrs.icon &&
					m(Icon, {
						icon: attrs.icon,
						container: "div",
						class: "mr-4 mb-4",
						style: { fill: theme.on_surface },
					}),
				iconWrapperSelector: ".icon.mr-4",
				style: { height: px(bubbleButtonHeight()), maxHeight: px(bubbleButtonHeight()) },
				class: `smaller bubble flex center-vertically limit-width ${bubbleButtonPadding()} flash`,
				onclick: attrs.onclick,
			},
			children,
		)
	}
}
