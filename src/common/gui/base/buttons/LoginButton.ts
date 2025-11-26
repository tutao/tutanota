/* eslint-disable @typescript-eslint/no-empty-object-type */
import m, { Children, ClassComponent, Vnode } from "mithril"
import { BaseButton, BaseButtonAttrs } from "./BaseButton.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { DefaultAnimationTime } from "../../animation/Animations.js"
import { ButtonSize, ButtonVariant, ButtonWidth, resolveButtonClasses } from "../../ButtonStyles"
import { AllIcons, Icon } from "../Icon"

const BUTTON_TRANSITION = `background ${DefaultAnimationTime}ms ease-in-out, color ${DefaultAnimationTime}ms ease-in-out, opacity ${DefaultAnimationTime}ms ease-in-out`

export interface CommonButtonAttrs extends Omit<BaseButtonAttrs, "icon"> {
	icon?: AllIcons | Children
	size?: ButtonSize
	width?: ButtonWidth
}

function resolveButtonIcon(icon: AllIcons | Children | undefined): Children | undefined {
	if (icon == null) return undefined
	if (typeof icon === "object") return icon
	return m(Icon, {
		icon: icon as AllIcons,
	})
}

function renderVariantButton(attrs: CommonButtonAttrs, variant: ButtonVariant): Children {
	const { size, width, icon, ...rest } = attrs

	const classes = resolveButtonClasses({
		variant,
		size,
		width,
		className: rest.class,
		disabled: rest.disabled,
	})

	const text = rest.text ?? lang.getTranslationText(rest.label)

	return m(BaseButton, {
		...rest,
		text,
		icon: resolveButtonIcon(icon),
		class: classes.filter(Boolean).join(" "),
		style: {
			...rest.style,
			transition: BUTTON_TRANSITION,
		},
	})
}

// disable eslint errors as long as the extended ButtonAttrs are empty
// eslint-disable-next-line
export interface LoginButtonAttrs extends CommonButtonAttrs {}
// eslint-disable-next-line
export interface SecondaryButtonAttrs extends CommonButtonAttrs {}
// eslint-disable-next-line
export interface TertiaryButtonAttrs extends CommonButtonAttrs {}

export class LoginButton implements ClassComponent<LoginButtonAttrs> {
	view({ attrs }: Vnode<LoginButtonAttrs>): Children {
		return renderVariantButton(attrs, "primary")
	}
}

export class SecondaryButton implements ClassComponent<SecondaryButtonAttrs> {
	view({ attrs }: Vnode<SecondaryButtonAttrs>): Children {
		return renderVariantButton(attrs, "secondary")
	}
}

export class TertiaryButton implements ClassComponent<TertiaryButtonAttrs> {
	view({ attrs }: Vnode<TertiaryButtonAttrs>): Children {
		return renderVariantButton(attrs, "tertiary")
	}
}
