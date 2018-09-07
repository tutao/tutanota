//@flow

import m from "mithril"
import {Icons} from "./icons/Icons"
import {theme} from "../theme"
import {lang} from "../../misc/LanguageViewModel"
import {px, size} from "../size"
import {transform} from "../animation/Animations"
import {displayOverlay} from "./Overlay"

type NotificationOverlayAttrs = {|
	message: string,
	padding: string,
	closeFunction: () => void
|}

class NotificationOverlay implements MComponent<NotificationOverlayAttrs> {

	view(vnode: Vnode<NotificationOverlayAttrs>) {
		return m(".flex.items-center.fill-absolute", {
				style: {
					padding: vnode.attrs.padding
				},
			},
			[
				m(".flex-grow.center", vnode.attrs.message),
				m("button.icon-large", {
					title: lang.get("close_alt"),
					style: {
						fill: theme.content_accent,
						background: "transparent"
					},
					onclick: vnode.attrs.closeFunction,
				}, m.trust(Icons.Close))
			])
	}
}

export function show(message: string) {
	const width = window.innerWidth
	const margin = (width - Math.min(400, width)) / 2
	const padding = px(6)
	const height = size.navbar_height_mobile
	const closeFunction = displayOverlay({top: px(0), left: px(margin), right: px(margin), height: px(height)}, {
			view: () => m(NotificationOverlay, {message, padding, closeFunction})
		},
		transform(transform.type.translateY, -height, 0),
		transform(transform.type.translateY, 0, -height))
	m.redraw();
}