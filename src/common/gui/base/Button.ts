import m, { Children, ClassComponent, CVnode } from "mithril"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { getContentButtonIconBackground, getElevatedBackground, getNavButtonIconBackground, getNavigationMenuIcon, theme } from "../theme"
import type { lazy } from "@tutao/tutanota-utils"
import { noOp } from "@tutao/tutanota-utils"
import type { ClickHandler } from "./GuiUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { BaseButton } from "./buttons/BaseButton.js"

assertMainOrNode()

export const enum ButtonType {
	Primary = "primary",
	Secondary = "secondary",
}

export const enum ButtonColor {
	Nav = "nav",
	Content = "content",
	Elevated = "elevated",
	DrawerNav = "drawernav",
	Fab = "fab",
}

export function getColors(buttonColors: ButtonColor | null | undefined): {
	border: string
	button: string
	button_icon_bg: string
	button_selected: string
	icon: string
	icon_selected: string
} {
	switch (buttonColors) {
		case ButtonColor.Nav:
			return {
				button: theme.navigation_button,
				button_selected: theme.navigation_button_selected,
				button_icon_bg: getNavButtonIconBackground(),
				icon: theme.navigation_button_icon,
				icon_selected: theme.navigation_button_icon_selected,
				border: theme.navigation_bg,
			}

		case ButtonColor.DrawerNav:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				button_icon_bg: "transparent",
				icon: getNavigationMenuIcon(),
				icon_selected: theme.content_button_icon_selected,
				border: getElevatedBackground(),
			}

		case ButtonColor.Elevated:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				button_icon_bg: getContentButtonIconBackground(),
				icon: theme.content_button_icon,
				icon_selected: theme.content_button_icon_selected,
				border: getElevatedBackground(),
			}

		case ButtonColor.Fab:
			return {
				button: theme.content_button_icon_selected,
				button_selected: theme.content_button_selected,
				button_icon_bg: getContentButtonIconBackground(),
				icon: theme.content_button_icon,
				icon_selected: theme.content_button_icon_selected,
				border: getElevatedBackground(),
			}

		case ButtonColor.Content:
		default:
			return {
				button: theme.content_button,
				button_selected: theme.content_button_selected,
				button_icon_bg: getContentButtonIconBackground(),
				icon: theme.content_button_icon,
				icon_selected: theme.content_button_icon_selected,
				border: theme.content_bg,
			}
	}
}

export interface ButtonAttrs {
	label: TranslationKey | lazy<string>
	title?: TranslationKey | lazy<string>
	click?: ClickHandler
	type: ButtonType
	colors?: ButtonColor
}

/**
 * A button.
 */
export class Button implements ClassComponent<ButtonAttrs> {
	view({ attrs }: CVnode<ButtonAttrs>): Children {
		const getKey = lang.getMaybeLazy
		const title = attrs.title == null ? getKey(attrs.label) : getKey(attrs.title)
		let classes =
			"limit-width noselect bg-transparent button-height text-ellipsis content-accent-fg flex items-center plr-button button-content justify-center flash"
		if (attrs.type === ButtonType.Primary) {
			classes += " b"
		}
		return m(BaseButton, {
			label: title,
			text: getKey(attrs.label),
			class: classes,
			style: {
				borderColor: getColors(attrs.colors).border,
			},
			onclick: attrs.click ?? noOp,
		})
	}
}
