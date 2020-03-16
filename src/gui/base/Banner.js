//@flow

import type {AllIconsEnum} from "./Icon"
import {Icon} from "./Icon"
import m from "mithril"
import {MessageBoxN} from "./MessageBoxN"
import {px, size} from "../size"
import {BootIcons} from "./icons/BootIcons"
import {theme} from "../theme"

export const BannerType = Object.freeze({
	Info: "info",
	Warning: "warning",
})
export type BannerTypeEnum = $Values<typeof BannerType>

export type Attrs = {
	icon: AllIconsEnum,
	title: string,
	message: string,
	helpLink: string,
	buttonText: string,
	buttonClick: () => mixed,
	type: BannerTypeEnum
}

export class Banner implements MComponent<Attrs> {
	view({attrs}: Vnode<Attrs>) {
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
			m(Icon, {icon: attrs.icon, style: {fill: colors.fg}, class: "icon-xl ml-m mr-m"}),
			m(".flex" + (isVertical ? ".col" : ".items-center"), [
				m("span.b", attrs.title),
				m("span", attrs.message),
				m("button.border-radius" + (isVertical ? ".mt-s" : ".ml-s.mr-s"), {
					style: {
						border: `2px solid ${colors.fg}`,
						background: "transparent",
						color: colors.fg,
						width: "min-content",
						padding: px(size.hpad_button),
					},
					onclick: () => attrs.buttonClick(),
				}, attrs.buttonText)
			]),
			m(".flex-grow"),
			m("a", {
				style: {"align-self": "end", background: "transparent"},
				href: attrs.helpLink,
				target: "_blank",
			}, m(Icon, {icon: BootIcons.Help, large: true, style: {fill: colors.fg, display: "block"}}))
		]);
	}
}

function getColors(type: BannerTypeEnum): Colors {
	if (type === BannerType.Warning) {
		return {bg: "#ca0606", fg: "white", border: "none"}
	} else {
		return {bg: "transparent", fg: theme.content_fg, border: `2px solid ${theme.content_border}`}
	}
}

type Colors = {
	bg: string,
	fg: string,
	border: string,
}