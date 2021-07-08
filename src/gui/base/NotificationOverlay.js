//@flow

import m from "mithril"
import {px} from "../size"
import {DefaultAnimationTime, transform} from "../animation/Animations"
import {displayOverlay} from "./Overlay"
import {assertMainOrNode} from "../../api/common/Env"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, ButtonType} from "./ButtonN"

assertMainOrNode()

type NotificationOverlayAttrs = {|
	message: MComponent<mixed>,
	buttons: Array<ButtonAttrs>
|}


const notificationQueue = []
let currentAnimationTimeout: ?TimeoutID = null

class NotificationOverlay implements MComponent<NotificationOverlayAttrs> {
	view(vnode: Vnode<NotificationOverlayAttrs>): ?Children {
		return m(".notification-overlay-content.flex.flex-column.flex-space-between", [
			m(vnode.attrs.message),
			m(".flex.justify-end.flex-wrap",
				vnode.attrs.buttons.map((b) => m(ButtonN, b)))
		])
	}
}

/**
 * @param buttons The postpone button is automatically added and does not have to be passed from outside
 */
export function show(message: MComponent<mixed>, closeButtonAttrs: $Shape<ButtonAttrs>, buttons: Array<ButtonAttrs>) {
	notificationQueue.push({message, buttons, closeButtonAttrs})
	if (notificationQueue.length > 1) {
		// another notification is already visible. Next notification will be shown when closing current notification
		return
	}
	showNextNotification()
}

function showNextNotification() {
	const {message, buttons, closeButtonAttrs} = notificationQueue[0]

	currentAnimationTimeout = null
	const width = window.innerWidth
	const margin = (width - Math.min(400, width)) / 2
	const allButtons = buttons.slice()
	const overlayRect = {top: px(0), left: px(margin), right: px(margin)}
	const closeFunction = displayOverlay(() => overlayRect, {
			view: () => m(NotificationOverlay, {message, buttons: allButtons})
		},
		(dom) => transform(transform.type.translateY, -dom.offsetHeight, 0),
		(dom) => transform(transform.type.translateY, 0, -dom.offsetHeight)
	)


	const closeAndOpenNext = () => {
		if (currentAnimationTimeout !== null) {
			return
		}
		closeFunction()
		notificationQueue.shift()
		if (notificationQueue.length > 0) {
			currentAnimationTimeout = setTimeout(showNextNotification, 2 * DefaultAnimationTime)
		}
	}

	// close the notification by default when pressing any button
	allButtons.forEach(b => {
		const originClickHandler = b.click
		b.click = (e, dom) => {
			originClickHandler(e, dom)
			closeAndOpenNext()
		}
	})

	// add the postpone button
	const closeFinalAttrs = Object.assign({}, {
		label: "close_alt",
		click: closeAndOpenNext,
		type: ButtonType.Secondary
	}, closeButtonAttrs)
	closeFinalAttrs.click = (e, dom) => {
		closeButtonAttrs.click && closeButtonAttrs.click(e, dom)
		closeAndOpenNext()
	}

	allButtons.unshift(closeFinalAttrs)
	m.redraw();
}
