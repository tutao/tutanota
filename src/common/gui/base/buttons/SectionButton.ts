import { AllIcons, Icon, IconSize } from "../Icon.js"
import { lang, MaybeTranslation, TranslationKey } from "../../../misc/LanguageViewModel.js"
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
	classes?: string
	isDisabled?: boolean
	text: MaybeTranslation
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
						size: IconSize.PX24,
					}),
			injectionLeft == null ? null : injectionLeft,
		])

		const rightPart = m.fragment({}, [
			injectionRight == null ? null : injectionRight,
			rightIcon == null
				? m(Icon, {
						icon: Icons.ArrowForward,
						style: { fill: getColors(ButtonColor.Content).button },
						title: lang.get("next_action"),
						size: IconSize.PX24,
					})
				: m(Icon, {
						icon: rightIcon.icon,
						style: { fill: rightIcon.fill ?? getColors(ButtonColor.Content).button },
						title: lang.get(rightIcon.title),
						size: IconSize.PX24,
					}),
		])

		return m(
			BaseButton,
			{
				class: `flash button-min-height flex items-center full-width ${vnode.attrs.classes ?? ""}`,
				label: text,
				disabled: isDisabled,
				role: AriaRole.MenuItem,
				onclick,
			},
			m(Card, { classes: ["flex", "justify-between", "flex-grow", "items-center"] }, [
				leftIcon || injectionLeft ? m(".flex.items-center.mr-8", [leftPart]) : null,
				m("span.flex-grow.full-width.white-space", lang.getTranslationText(text)),
				rightPart,
			]),
		)
	}
}
