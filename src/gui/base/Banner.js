//@flow

import type {AllIconsEnum} from "./Icon"
import {Icon} from "./Icon"
import m from "mithril"
import {MessageBoxN} from "./MessageBoxN"
import {px, size} from "../size"
import {BootIcons} from "./icons/BootIcons"
import {theme} from "../theme"
import {styles} from "../styles"
import type {InfoLink, TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"

export type ButtonParams = {
	text: TranslationKey | lazy<string>,
	click: () => mixed,
}

export const BannerType = Object.freeze({
	Info: "info",
	Warning: "warning",
})
export type BannerTypeEnum = $Values<typeof BannerType>

export type BannerAttrs = {
	icon: AllIconsEnum,
	title: TranslationKey | lazy<string>,
	message: TranslationKey | lazy<string>,
	helpLink?: ?InfoLink,
	buttons: $ReadOnlyArray<ButtonParams>,
	type: BannerTypeEnum
}

export class Banner implements MComponent<BannerAttrs> {
	view({attrs}: Vnode<BannerAttrs>): Children {
		const colors = getColors(attrs.type)
		const isVertical = attrs.type === BannerType.Warning
		return m(MessageBoxN, {
			style: {
				marginTop: px(size.vpad),
				maxWidth: "100%",
				backgroundColor: colors.bg,
				color: colors.fg,
				border: colors.border,
				"text-align": "left",
				display: "flex",
				"justify-content": "start",
				"align-items": "center",
				paddingTop: isVertical ? "16px" : "8px",
				paddingBottom: isVertical ? "16px" : "8px",
			},
		}, [
			styles.isDesktopLayout()
				? m(Icon, {icon: attrs.icon, style: {fill: colors.button}, class: "icon-xl ml-m mr-m"})
				: null,
			m(".flex.col", [
				m("", [
					m("span.text-break" + (attrs.type === BannerType.Warning ? ".b" : ""), lang.getMaybeLazy(attrs.title)),
					isVertical ? m("br") : m("span", " "),
					m("span.text-break", lang.getMaybeLazy(attrs.message)),
				]),
				m(".flex", attrs.buttons.map((b) => m("button.border-radius.mt-s.mr-s.center", {
					style: {
						border: `2px solid ${colors.button}`,
						background: "transparent",
						color: colors.fg,
						width: "min-content",
						padding: px(size.hpad_button),
						minWidth: "60px",
					},
					onclick: b.click,
				}, lang.getMaybeLazy(b.text)))),

			]),
			m(".flex-grow"),
			attrs.helpLink
				? m(BannerHelpLink, {link: attrs.helpLink, color: colors.button, align: "end"})
				: null
		]);
	}
}

export type BannerHelpLinkAttrs = {
	link: InfoLink,
	color: string,
	align: string // passed to css "align-self"
}

export class BannerHelpLink implements MComponent<BannerHelpLinkAttrs> {
	view(vnode: Vnode<BannerHelpLinkAttrs>): Children {
		const a = vnode.attrs
		return m("a.ml-s.bg-transparent", {
			style: {"align-self": a.align},
			href: lang.getInfoLink(a.link),
			target: "_blank",
		}, m(Icon, {icon: BootIcons.Help, large: true, style: {fill: a.color, display: "block"}}))
	}
}

function getColors(type: BannerTypeEnum): BannerColors {
	if (type === BannerType.Warning) {
		return {bg: "#ca0606", fg: "white", button: "white", border: "none"}
	} else {
		return {bg: theme.content_bg, fg: theme.content_fg, button: theme.content_button, border: `2px solid ${theme.content_border}`}
	}
}

export type BannerColors = {
	bg: string,
	fg: string,
	border: string,
	button: string,
}

export type BannerButtonAttrs = {
	borderColor: string,
	color: string,
	click: () => mixed,
	text: TranslationKey | lazy<string>
}

export class BannerButton implements MComponent<BannerButtonAttrs> {
	view({attrs}: Vnode<BannerButtonAttrs>): Children {
		return m("button.border-radius.mr-s.center", {
			style: {
				border: `2px solid ${attrs.borderColor}`,
				background: "transparent",
				color: attrs.color,
				width: "min-content",
				padding: px(size.hpad_button),
				minWidth: "60px",
			},
			onclick: attrs.click,
		}, lang.getMaybeLazy(attrs.text))
	}
}