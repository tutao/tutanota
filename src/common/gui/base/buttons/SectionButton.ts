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
	/**
	 * The icon displayed on the very left of the button.
	 */
	leftIcon?: { icon: AllIcons; title: TranslationKey; fill?: string }

	/**
	 * The icon displayed on the very right of the button. Defaults to an arrow pointing to the right.
	 */
	rightIcon?: { icon: AllIcons; title: TranslationKey; fill?: string }

	/**
	 * An optional element displayed right hand side of the left icon.
	 */
	injectionLeft?: Children

	/**
	 * An optional element displayed on the left hand side of the right icon.
	 */
	injectionRight?: Children
	isDisabled?: boolean
	text: string
	onclick: ClickHandler
}

/**
 * A dark NavButton-like button with an arrow.
 */
export class SectionButton implements Component<SectionButtonAttrs> {
	view(vnode: Vnode<SectionButtonAttrs>): Children {
		const { leftIcon, injectionLeft, onclick, injectionRight, rightIcon, isDisabled, text } = vnode.attrs

		const leftPart = m.fragment({}, [
			leftIcon == null
				? null
				: m(Icon, {
						icon: leftIcon.icon,
						style: { fill: leftIcon.fill ?? getColors(ButtonColor.Content).button },
						title: lang.get(leftIcon.title),
						size: IconSize.Medium,
				  }),
			injectionLeft == null ? null : injectionLeft,
		])

		const rightPart = m.fragment({}, [
			rightIcon == null
				? m(Icon, {
						icon: Icons.ArrowForward,
						style: { fill: getColors(ButtonColor.Content).button },
						title: text,
						size: IconSize.Medium,
				  })
				: m(Icon, {
						icon: rightIcon.icon,
						style: { fill: rightIcon.fill ?? getColors(ButtonColor.Content).button },
						title: lang.get(rightIcon.title),
						size: IconSize.Medium,
				  }),
			injectionRight == null ? null : injectionRight,
		])

		return m(
			Card,
			{ classes: ["button-min-height", "flex", "items-center"] },
			m(".flex.gap-vpad-s.flash.items-center.flex-grow", [
				m(".flex.items-center", [leftPart]),
				m(
					BaseButton,
					{
						class: "flex items-center justify-between flex-grow flash",
						label: text,
						text,
						disabled: isDisabled,
						role: AriaRole.MenuItem,
						onclick,
					},
					m(".flex", rightPart),
				),
			]),
		)
	}
}
