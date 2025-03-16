import m, { Children, ClassComponent, CVnode } from "mithril"
import type { Translation, TranslationKey, MaybeTranslation } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { getElevatedBackground, theme } from "../theme"
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
} {
	switch (buttonColors) {
		case ButtonColor.Nav:
			return {
				button: theme.navigation_button,
				border: theme.navigation_bg,
			}

		case ButtonColor.DrawerNav:
			return {
				button: theme.content_button,
				border: getElevatedBackground(),
			}

		case ButtonColor.Elevated:
			return {
				button: theme.content_button,
				border: getElevatedBackground(),
			}

		case ButtonColor.Fab:
			return {
				button: theme.content_button_icon_selected,
				border: getElevatedBackground(),
			}

		case ButtonColor.Content:
		default:
			return {
				button: theme.content_button,
				border: theme.content_bg,
			}
	}
}

export interface ButtonAttrs {
	label: MaybeTranslation
	title?: MaybeTranslation
	click?: ClickHandler
	type: ButtonType
	colors?: ButtonColor
}

/**
 * A button.
 */
export class Button implements ClassComponent<ButtonAttrs> {
	view({ attrs }: CVnode<ButtonAttrs>): Children {
		let classes = this.resolveClasses(attrs.type)

		return m(BaseButton, {
			label: attrs.title == null ? attrs.label : attrs.title,
			text: lang.getTranslationText(attrs.label),
			class: classes.join(" "),
			style: {
				borderColor: getColors(attrs.colors).border,
			},
			onclick: attrs.click ?? noOp,
			icon: attrs.icon,
		})
	}

	private resolveClasses(type: ButtonType) {
		let classes = [
			"limit-width",
			"noselect",
			"bg-transparent",
			"button-height",
			"text-ellipsis",
			"content-accent-fg",
			"flex",
			"items-center",
			"justify-center",
			"flash",
		]

		if (type === ButtonType.Primary) {
			classes.push("b")
		} else {
			classes.push("plr-button", "button-content")
		}

		return classes
	}
}
