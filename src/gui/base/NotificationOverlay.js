//@flow

import m from "mithril"
import {px, size} from "../size"
import {transform} from "../animation/Animations"
import {displayOverlay} from "./Overlay"
import {assertMainOrNodeBoot} from "../../api/Env"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, ButtonType} from "./ButtonN"

assertMainOrNodeBoot()

type NotificationOverlayAttrs = {|
	message: Component,
	buttons: Array<ButtonAttrs>,
	closeFunction: () => void
|}

class NotificationOverlay implements MComponent<NotificationOverlayAttrs> {

	view(vnode: Vnode<NotificationOverlayAttrs>) {
		return m(".flex.flex-column.flex-space-between", {
			style: {
				marginLeft: px(size.vpad),
				marginRight: px(size.vpad),
				marginTop: px(size.vpad_ml - 5), // take line-height into account
			},
		}, [
			m(vnode.attrs.message),
			m(".flex.justify-end.flex-wrap",
				vnode.attrs.buttons.map((b, index) => m(ButtonN, b)))
		])
	}
}

export function show(message: Component, buttons: Array<ButtonAttrs>) {
	const width = window.innerWidth
	const margin = (width - Math.min(400, width)) / 2
	const height = size.notification_overlay_height
	const buttonsWithDismiss = buttons.slice()
	const closeFunction = displayOverlay({top: px(0), left: px(margin), right: px(margin)}, {
			view: () => m(NotificationOverlay, {message, closeFunction, buttons: buttonsWithDismiss})
		},
		(dom) => transform(transform.type.translateY, -dom.offsetHeight, 0),
		(dom) => transform(transform.type.translateY, 0, -dom.offsetHeight)
	)
	buttonsWithDismiss.unshift({
		label: "dismissNotification_action",
		click: closeFunction,
		type: ButtonType.Secondary
	})
	m.redraw();
}