import m, { Children, Component, Vnode } from "mithril"
import { px } from "../size"
import { DefaultAnimationTime } from "../animation/Animations"
import { displayOverlay } from "./Overlay"
import type { ButtonAttrs } from "./Button.js"
import { Button, ButtonType } from "./Button.js"
import { assertMainOrNode } from "../../api/common/Env"
import { ClickHandler } from "./GuiUtils"

assertMainOrNode()

interface NotificationOverlayAttrs {
	message: Component
	buttons: Array<ButtonAttrs>
}

interface QueueItem extends NotificationOverlayAttrs {
	closeButtonAttrs: Partial<ButtonAttrs>
}

const notificationQueue: QueueItem[] = []
let currentAnimationTimeout: TimeoutID | null = null

class NotificationOverlay implements Component<NotificationOverlayAttrs> {
	view(vnode: Vnode<NotificationOverlayAttrs>): Children {
		return m(".notification-overlay-content.flex.flex-column.flex-space-between", [
			m(vnode.attrs.message),
			m(
				".flex.justify-end.flex-wrap",
				vnode.attrs.buttons.map((b) => m(Button, b)),
			),
		])
	}
}

/**
 * @param message What will be shown inside notification
 * @param closeButtonAttrs To define the close button in the notification
 * @param buttons The postpone button is automatically added and does not have to be passed from outside
 */

export function show(message: Component, closeButtonAttrs: Partial<ButtonAttrs>, buttons: Array<ButtonAttrs>) {
	notificationQueue.push({
		message,
		buttons,
		closeButtonAttrs,
	})

	if (notificationQueue.length > 1) {
		// another notification is already visible. Next notification will be shown when closing current notification
		return
	}

	showNextNotification()
}

function showNextNotification() {
	const { message, buttons, closeButtonAttrs } = notificationQueue[0]
	currentAnimationTimeout = null
	const width = window.innerWidth
	const margin = (width - Math.min(400, width)) / 2
	const allButtons = buttons.slice()
	const overlayRect = {
		width: "fit-content",
		top: px(0),
		left: px(0),
		right: px(0),
	}
	const closeFunction = displayOverlay(
		() => overlayRect,
		{
			view: () =>
				m(NotificationOverlay, {
					message,
					buttons: allButtons,
				}),
		},
		"slide-top",
		undefined,
		"dropdown-shadow center-h notification-min-width",
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
	for (const b of allButtons) {
		const originClickHandler: ClickHandler | undefined = b.click

		b.click = (e, dom) => {
			originClickHandler?.(e, dom)
			closeAndOpenNext()
		}
	}
	// add the postpone button
	const closeFinalAttrs: ButtonAttrs = Object.assign(
		{},
		{
			label: "close_alt",
			click: closeAndOpenNext,
			type: ButtonType.Secondary,
		},
		closeButtonAttrs,
	)

	closeFinalAttrs.click = (e, dom) => {
		closeButtonAttrs.click && closeButtonAttrs.click(e, dom)
		closeAndOpenNext()
	}

	allButtons.unshift(closeFinalAttrs)
	m.redraw()
}
