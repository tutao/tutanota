//@flow

import type {AllIconsEnum} from "./Icon"
import {Icon} from "./Icon"
import m from "mithril"
import {theme} from "../theme"
import type {InfoLink, TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, ButtonType} from "./ButtonN"
import {NavButtonN} from "./NavButtonN"
import {mapNullable} from "@tutao/tutanota-utils"
import {Icons} from "./icons/Icons"
import {ifAllowedTutanotaLinks} from "./GuiUtils"
import type {lazy} from "@tutao/tutanota-utils"

const WARNING_RED = "#ca0606"

export const BannerType = Object.freeze({
	Info: "info",
	Warning: "warning",
})


type BannerTypeEnum = $Values<typeof BannerType>

export type InfoBannerAttrs = {
	message: TranslationKey | lazy<string>,
	icon: AllIconsEnum,
	helpLink?: ?InfoLink,
	buttons?: ?$ReadOnlyArray<?ButtonAttrs>,
	type?: BannerTypeEnum
}

/**
 * A low profile banner with a message and 0 or more buttons
 */
export class InfoBanner implements MComponent<InfoBannerAttrs> {
	view(vnode: Vnode<InfoBannerAttrs>): Children {
		const {message, icon, helpLink, buttons, type} = vnode.attrs
		return m(".info-banner.center-vertically.full-width.border-bottom.pr-s.pl.mt-xs"
			// keep the distance to the bottom of the banner the same in the case that buttons aren't present
			+ (buttons && buttons.length > 0 ? "" : ".pb-s"), {
			style: {
				border: `solid 2px ${type === BannerType.Warning ? WARNING_RED : theme.content_border}`,
			}
		}, [
			m(".flex", [
				m(".mt-s.mr-s", this.renderIcon(icon, type)),
				m(".flex-grow", [
					m(".mr.pt-s", [
						m(".small", lang.getMaybeLazy(message))
					]),
					m(".flex.ml-negative-s", {
						// Adjust the top and bottom spacing because the buttons have a minimum height of 44px.
						// This way the clickable area of the button overlaps with the text and the border a bit without having
						// too much empty space
						style: {marginTop: "-10px", marginBottom: "-6px"}
					}, [
						m(".small", this.renderButtons(buttons || [])),
						// Push the help button all the way to the right
						m(".flex-grow"),
						mapNullable(helpLink, helpLink => this.renderHelpLink(helpLink))
					])
				])
			]),
		])
	}

	renderIcon(icon: AllIconsEnum, type: ?BannerTypeEnum): Children {
		return m(Icon, {
			icon,
			style: {
				fill: type === BannerType.Warning ? WARNING_RED : theme.content_button,
				display: "block"
			},
		})
	}

	renderButtons(buttons: $ReadOnlyArray<?ButtonAttrs>): Children {
		return buttons.filter(Boolean).map((attrs) => m(ButtonN, {
				...attrs,
			type: ButtonType.Secondary,
		}))
	}

	renderHelpLink(helpLink: InfoLink): ?Children {
		return ifAllowedTutanotaLinks(helpLink, link => {
			return m(".button-content",
				{style: {marginRight: "-10px"}},
				m(NavButtonN, {
					icon: () => Icons.QuestionMark,
					href: link,
					small: true,
					hideLabel: true,
					centred: true,
				label: "help_label"}))
		})
	}
}