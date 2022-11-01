import {AllIcons, Icon} from "./Icon"
import m, {Children, Component, Vnode} from "mithril"
import {theme} from "../theme"
import type {InfoLink, TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {ButtonAttrs} from "./Button.js"
import {Button, ButtonType} from "./Button.js"
import {NavButton} from "./NavButton.js"
import type {lazy} from "@tutao/tutanota-utils"
import {isNotNull, mapNullable} from "@tutao/tutanota-utils"
import {Icons} from "./icons/Icons"
import {ifAllowedTutanotaLinks} from "./GuiUtils"
import {px, size} from "../size.js"

const WARNING_RED = "#ca0606"

export const enum BannerType {
	Info = "info",
	Warning = "warning",
}

export interface InfoBannerAttrs {
	message: TranslationKey | lazy<string>
	icon: AllIcons
	helpLink?: InfoLink | null
	buttons?: ReadonlyArray<ButtonAttrs | null> | null
	type?: BannerType
}

/**
 * A low profile banner with a message and 0 or more buttons
 */
export class InfoBanner implements Component<InfoBannerAttrs> {
	view(vnode: Vnode<InfoBannerAttrs>): Children {
		const {message, icon, helpLink, buttons, type} = vnode.attrs
		return m(
			".info-banner.center-vertically.border-bottom.pr-s.pl.border-radius.mlr-l.mt-xs" + // keep the distance to the bottom of the banner the same in the case that buttons aren't present
			(buttons && buttons.length > 0 ? "" : ".pb-s"),
			{
				style: {
					border: `solid 2px ${type === BannerType.Warning ? WARNING_RED : theme.content_border}`,
				},
			},
			[
				m(".mt-s.mr-s.abs", this.renderIcon(icon, type ?? null)), // absolute position makes the icon fixed to the top left corner of the banner
				m("",
					{style: {"margin-left": px(size.icon_size_large + 1)}}, // allow room for the icon
					[
						m(".mr.pt-s", [m(".small.text-break", lang.getMaybeLazy(message))]),
						m(
							".flex.ml-negative-s",
							{
								// Adjust the top and bottom spacing because the buttons have a minimum height of 44px.
								// This way the clickable area of the button overlaps with the text and the border a bit without having
								// too much empty space
								style: {
									marginTop: "-10px",
									marginBottom: "-6px",
								},
							},
							[
								m(".small", this.renderButtons(buttons || [])), // Push the help button all the way to the right
								m(".flex-grow"),
								mapNullable(helpLink, helpLink => this.renderHelpLink(helpLink)),
							],
						),
					]),
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

	renderButtons(buttons: ReadonlyArray<ButtonAttrs | null>): Children {
		return buttons.filter(isNotNull).map(attrs => m(Button, {...attrs, type: ButtonType.Secondary}))
	}

	renderHelpLink(helpLink: InfoLink): Children | null {
		return ifAllowedTutanotaLinks(helpLink, link => {
			return m(
				".button-content",
				{
					style: {
						marginRight: "-10px",
					},
				},
				m(NavButton, {
					icon: () => Icons.QuestionMark,
					href: link,
					small: true,
					hideLabel: true,
					centred: true,
					label: "help_label",
				}),
			)
		})
	}
}