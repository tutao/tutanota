// @flow

import m from "mithril"
import type {InfoLink, TranslationKey} from "../../../misc/LanguageViewModel"
import {lang} from "../../../misc/LanguageViewModel"
import type {AllIconsEnum} from "../Icon"
import {Icon} from "../Icon"
import {BootIcons} from "./BootIcons"
import {mapNullable} from "../../../api/common/utils/Utils"
import {theme} from "../../theme"

export type ActionBannerAttrs = {
	text: TranslationKey | lazy<string>,
	action: () => mixed,
	icon?: ?AllIconsEnum,
	helpLink?: ?InfoLink,
}

/**
 * A banner for the top of the mail viewer, which will give a message and allow for some action to be taken when pressed.
 * Designed to be used for the mobile layout, but it could theoretically be used in desktop too
 */
export class ActionBanner implements MComponent<ActionBannerAttrs> {

	view(vnode: Vnode<ActionBannerAttrs>): Children {
		const {text, action, icon, helpLink} = vnode.attrs
		return m(".action-banner.full-width.border-top.border-bottom.mt-s.pt-s.pb-s", [
			m(".flex.center-vertically", [
				m("button.flex.center-vertically.center-horizontally.center.content-fg.bg-transparent.mlr-s.flex-grow", {
					onclick: action,
				}, [
					mapNullable(icon, renderIcon),
					m(".ml-s.text-prewrap.text-fade.left", lang.getMaybeLazy(text))
				]),
				mapNullable(helpLink, renderHelpLink)
			]),
		])
	}
}

function renderHelpLink(link: InfoLink): Children {
	return m("a.bg-transparent.border-left.pl-s.pr-s", {
		href: lang.getInfoLink(link),
		target: "_blank",
	}, m(Icon, {
		icon: BootIcons.Help,
		large: true,
		style: {
			fill: theme.content_button,
			display: "block"
		}
	}))
}

function renderIcon(icon: AllIconsEnum): Children {
	return m(Icon, {
		icon,
		large: true,
		style: {
			fill: theme.content_button,
		}
	})
}

