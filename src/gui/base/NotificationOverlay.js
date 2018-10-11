//@flow

import m from "mithril"
import {theme} from "../theme"
import {px, size} from "../size"
import {transform} from "../animation/Animations"
import {displayOverlay} from "./Overlay"
import {lang} from "../../misc/LanguageViewModel"
import {assertMainOrNodeBoot} from "../../api/Env"

assertMainOrNodeBoot()

export type OverlayButtonAttrs = {|
	label: string,
	onclick: clickHandler,
|}

type NotificationOverlayAttrs = {|
	message: string,
	buttons: Array<OverlayButtonAttrs>,
	closeFunction: () => void
|}

const OverlayButton: MComponent<OverlayButtonAttrs> = {
	view(vnode) {
		const {label, onclick} = vnode.attrs
		return m("button.b.uppercase.mr-s", {
			onclick,
			style: {
				color: theme.content_accent,
				padding: px(size.vpad_small),
				backgroundColor: "initial",
				fontSize: "14px",
			}
		}, label)
	}
}

class NotificationOverlay implements MComponent<NotificationOverlayAttrs> {

	view(vnode: Vnode<NotificationOverlayAttrs>) {
		return m(".flex.flex-column.flex-space-between.mb-s", [
			m("", {
				style: {
					marginLeft: px(size.vpad),
					marginRight: px(size.vpad),
					marginTop: px(size.vpad_ml - 5), // take line-height into account
				},
			}, vnode.attrs.message),
			m(".flex.justify-end.flex-wrap",
				vnode.attrs.buttons.map((b, index) => m(OverlayButton, b)))
		])
	}
}

export function show(message: string, buttons: Array<OverlayButtonAttrs>) {
	const width = window.innerWidth
	const margin = (width - Math.min(400, width)) / 2
	const height = size.notification_overlay_height
	const buttonsWithDismiss = buttons.slice()
	const closeFunction = displayOverlay({top: px(0), left: px(margin), right: px(margin)}, {
			view: () => m(NotificationOverlay, {message, closeFunction, buttons: buttonsWithDismiss})
		},
		(dom) => transform(transform.type.translateY, -dom.offsetHeight, 0),
		() => transform(transform.type.translateY, 0, -height)
	)
	buttonsWithDismiss.unshift({label: lang.get("dismissNotification_action"), onclick: closeFunction})
	m.redraw();
}