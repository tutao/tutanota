//@flow

import type {AllIconsEnum} from "./Icon"
import {Icon} from "./Icon"
import m from "mithril"
import {theme} from "../theme"
import type {InfoLink, TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import type {ButtonParams} from "./Banner"
import {BannerHelpLink} from "./Banner"
import {mapNullable} from "../../api/common/utils/Utils"

export const BannerType = Object.freeze({
	Info: "info",
	Warning: "warning",
})

export type InfoBannerAttrs = {
	message: TranslationKey | lazy<string>,
	icon: AllIconsEnum,
	helpLink?: ?InfoLink,
	buttons: $ReadOnlyArray<ButtonParams>,
}

/**
 * A low profile banner with a message and 0 or more buttons
 */
export class InfoBanner implements MComponent<InfoBannerAttrs> {
	view(vnode: Vnode<InfoBannerAttrs>): Children {

		const {message, icon, helpLink, buttons} = vnode.attrs

		return m(".info-banner.flex-space-between.center-vertically.full-width.border-top.border-bottom.pt-s.pb-s.mt-s.pr-s", [
			m(".flex.center-vertically", [
				this.renderIcon(icon),
				m("small.smaller.text-break.mr", lang.getMaybeLazy(message)),
				m("small.no-wrap.ml", buttons.map(button => this.renderButton(button))),
			]),
			mapNullable(helpLink, helpLink => this.renderHelpLink(helpLink))
		])
	}

	renderIcon(icon: AllIconsEnum): Children {
		return m(".mr", m(Icon, {
			icon,
			large: true,
			style: {
				fill: theme.content_button,
			},
			container: "div"
		}))
	}

	renderButton(button: ButtonParams): Children {
		return m("button.border.border-radius.content-fg.bg-transparent.mr-s.center.plr", {
			style: {
				minWidth: "60px",
			},
			onclick: button.click,
		}, m("", lang.getMaybeLazy(button.text)))
	}

	renderHelpLink(link: InfoLink): Children {
		return m(BannerHelpLink, {
			link,
			color: theme.content_button,
			align: "center"
		})
	}
}