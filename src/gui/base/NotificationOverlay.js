//@flow

import m from "mithril"
import {Icons} from "./icons/Icons"
import {theme} from "../theme"
import {lang} from "../../misc/LanguageViewModel"
import {closeOverlay, displayOverlay} from "./Overlay"
import {px, size} from "../size"
import {transform} from "../animation/Animations"


type NotificationOverlayAttrs = {|
	message: string,
	padding: string,
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
					onclick: () => closeOverlay()
				}, m.trust(Icons.Close))
			])
	}
}

export function show(message: string) {
	const width = window.innerWidth
	const margin = (width - Math.min(400, width)) / 2
	const padding = px(6)
	const height = size.navbar_height_mobile
	displayOverlay({top: px(0), left: px(margin), right: px(margin), height: px(height)}, {
			view: () => m(NotificationOverlay, {message, padding})
		},
		transform(transform.type.translateY, -height, 0),
		transform(transform.type.translateY, 0, -height))
	m.redraw();
}