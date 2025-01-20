import { AllIcons, Icon, IconSize } from "../Icon.js"
import { lang, TranslationKey } from "../../../misc/LanguageViewModel.js"
import m, { Children, Component, Vnode } from "mithril"
import { ClickHandler } from "../GuiUtils.js"
import { Card } from "../Card.js"
import { ButtonColor, getColors } from "../Button.js"
import { Icons } from "../icons/Icons.js"
import { BaseButton } from "./BaseButton.js"
import { AriaRole } from "../../AriaUtils.js"

export interface SectionButtonAttrs {
	leftIcon?: { icon: AllIcons; title: TranslationKey; fill?: string }
	inject?: Children
	disabled?: boolean
	text: string
	onclick: ClickHandler
}

/**
 * A dark NavButton-like button with an arrow.
 */
export class SectionButton implements Component<SectionButtonAttrs> {
	view(vnode: Vnode<SectionButtonAttrs>): Children {
		const { leftIcon, onclick, inject, disabled, text } = vnode.attrs
		return m(
			Card,
			{ classes: ["button-min-height", "flex", "items-center"] },
			m(".flex.gap-vpad-s.flash.items-center.flex-grow", [
				m(".flex.items-center", [
					leftIcon == null
						? null
						: m(Icon, {
								icon: leftIcon.icon,
								style: { fill: leftIcon.fill ?? getColors(ButtonColor.Content).button },
								title: lang.get(leftIcon.title),
								size: IconSize.Medium,
						  }),
				]),
				m(
					BaseButton,
					{
						class: "flex items-center justify-between flex-grow flash",
						label: text,
						text,
						disabled,
						role: AriaRole.MenuItem,
						onclick,
					},
					m(".flex", [
						inject,
						m(Icon, {
							icon: Icons.ArrowForward,
							class: "flex items-center",
							style: { fill: getColors(ButtonColor.Content).button },
							title: text,
							size: IconSize.Medium,
						}),
					]),
				),
			]),
		)
	}
}
