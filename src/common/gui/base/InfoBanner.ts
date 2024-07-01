import { AllIcons, Icon } from "./Icon.js"
import m, { Children, Component, Vnode } from "mithril"
import { theme } from "../theme.js"
import type { InfoLink, TranslationKey } from "../../misc/LanguageViewModel.js"
import { lang } from "../../misc/LanguageViewModel.js"
import type { ButtonAttrs } from "./Button.js"
import { Button, ButtonType } from "./Button.js"
import { NavButton } from "./NavButton.js"
import type { lazy } from "@tutao/tutanota-utils"
import { isNotNull } from "@tutao/tutanota-utils"
import { Icons } from "./icons/Icons.js"
import { px, size } from "../size.js"

const WARNING_RED = "#ca0606"

export const enum BannerType {
	Info = "info",
	Warning = "warning",
}

export type BannerButtonAttrs = Omit<ButtonAttrs, "type">

export interface InfoBannerAttrs {
	message: TranslationKey | lazy<Children>
	icon: AllIcons
	helpLink?: InfoLink | null
	buttons: ReadonlyArray<BannerButtonAttrs | null>
	type?: BannerType
}

/**
 * A low profile banner with a message and 0 or more buttons
 */
export class InfoBanner implements Component<InfoBannerAttrs> {
	view(vnode: Vnode<InfoBannerAttrs>): Children {
		const { message, icon, helpLink, buttons, type } = vnode.attrs
		// Adjust the top and bottom spacing because the buttons have a minimum height of 44px.
		// This way the clickable area of the button overlaps with the text and the border a bit without having
		// too much empty space
		const buttonContainerStyle =
			helpLink != null || buttons.length > 0
				? {
						marginTop: "-10px",
						marginBottom: "-6px",
				  }
				: undefined
		return m(
			".center-vertically.border-bottom.pr-s.pl.border-radius.mt-xs",
			{
				style: {
					border: `solid 2px ${type === BannerType.Warning ? WARNING_RED : theme.content_border}`,
					// keep the distance to the bottom of the banner the same in the case that buttons aren't present
					minHeight: buttons.length > 0 ? undefined : px(37),
				},
			},
			[
				m(".mt-s.mr-s.abs", this.renderIcon(icon, type ?? null)), // absolute position makes the icon fixed to the top left corner of the banner
				m(
					"",
					{ style: { "margin-left": px(size.icon_size_large + 1) } }, // allow room for the icon
					[
						m(".mr.pt-s.pb-s", typeof message === "function" ? message() : m(".small.text-break", lang.get(message))),
						m(".flex.ml-negative-s", { style: buttonContainerStyle }, [this.renderButtons(buttons), this.renderHelpLink(helpLink)]),
					],
				),
			],
		)
	}

	renderIcon(icon: AllIcons, type: BannerType | null): Children {
		return m(Icon, {
			icon,
			style: {
				fill: type === BannerType.Warning ? WARNING_RED : theme.content_button,
				display: "block",
			},
		})
	}

	renderButtons(buttons: ReadonlyArray<BannerButtonAttrs | null>): Children {
		if (buttons.length === 0) return null
		return m(
			".small.flex.row",
			buttons.filter(isNotNull).map((attrs) => m(Button, { ...attrs, type: ButtonType.Secondary })),
		)
	}

	renderHelpLink(helpLink?: InfoLink | null): Children | null {
		if (helpLink == null) return null

		return [
			// Push the help button all the way to the right
			m(".flex-grow"),
			m(
				".button-content",
				{
					style: {
						marginRight: "-10px",
					},
				},
				m(NavButton, {
					icon: () => Icons.QuestionMark,
					href: helpLink,
					small: true,
					hideLabel: true,
					centred: true,
					label: "help_label",
				}),
			),
		]
	}
}
