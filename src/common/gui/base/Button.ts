import m, { Children, ClassComponent, CVnode } from "mithril"
import type { MaybeTranslation } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { getElevatedBackground, theme } from "../theme"
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
	Dialog = "dialog",
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

		case ButtonColor.Dialog:
			return {
				button: theme.content_button,
				border: theme.content_border,
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
	icon?: Children
	class?: Array<string>
	inline?: boolean
}

/**
 * A button.
 */
export class Button implements ClassComponent<ButtonAttrs> {
	view({ attrs }: CVnode<ButtonAttrs>): Children {
		const classes = this.resolveClasses(attrs.type, attrs.class, attrs.inline || false)

		return m(BaseButton, {
			label: attrs.title == null ? attrs.label : attrs.title,
			text: lang.getTranslationText(attrs.label),
			icon: attrs.icon,
			class: classes.join(" "),
			style: {
				borderColor: getColors(attrs.colors).border,
			},
			onclick: attrs.click ?? noOp,
		})
	}

	private resolveClasses(type: ButtonType, customClasses?: Array<string>, inline?: boolean) {
		const classes = ["limit-width", "noselect", "bg-transparent", "text-ellipsis", "content-accent-fg", "items-center", "justify-center", "flash"]

		if (!inline) {
			classes.push("button-height")
			if (!customClasses?.includes("block")) {
				classes.push("flex")
			}
		}

		if (type === ButtonType.Primary) {
			classes.push("b")
		} else {
			if (!inline) {
				classes.push("plr-button")
				classes.push("button-content")
			}
		}

		classes.push(...(customClasses ?? []))

		return classes
	}
}
