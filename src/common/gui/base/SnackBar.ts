import m, { Component, Vnode } from "mithril"
import { layout_size, px, size } from "../size"
import { DefaultAnimationTime } from "../animation/Animations"
import { displayOverlay } from "./Overlay"
import type { ButtonAttrs } from "./Button.js"
import { Button, ButtonType } from "./Button.js"
import { lang, MaybeTranslation } from "../../misc/LanguageViewModel"
import { styles } from "../styles"
import { LayerType } from "../../../RootView"
import type { ClickHandler } from "./GuiUtils"
import { assertMainOrNode } from "../../api/common/Env"
import { isNotEmpty, remove } from "@tutao/tutanota-utils"
import { IconButton, IconButtonAttrs } from "./IconButton"
import { AllIcons, Icon, IconSize } from "./Icon"
import { theme } from "../theme"

assertMainOrNode()
const SNACKBAR_SHOW_TIME = 6000 // ms
const SNACKBAR_HIDE_DELAY_TIME = 1500 // ms
const MAX_SNACKBAR_WIDTH = 400
export type SnackBarButtonAttrs = {
	label: MaybeTranslation
	click: ClickHandler
}
type SnackBarAttrs = {
	message: MaybeTranslation
	button: ButtonAttrs | null
	dismissButton?: IconButtonAttrs
	onHoverChange: (hovered: boolean) => void
	leadingIcon?: AllIcons
}
type QueueItem = Omit<SnackBarAttrs, "onHoverChange"> & {
	onClose: ((timedOut: boolean) => unknown) | null
	onShow: (() => unknown) | null
	doCancel: { cancel: () => unknown }
	/** display time in ms */
	showingTime: number
}
const notificationQueue: QueueItem[] = []
let currentAnimationTimeout: TimeoutID | null = null
let cancelCurrentSnackbar: (() => unknown) | null = null

class SnackBar implements Component<SnackBarAttrs> {
	view(vnode: Vnode<SnackBarAttrs>) {
		const a = vnode.attrs
		// use same padding as MinimizedEditor
		return m(
			".snackbar",
			{
				class: vnode.attrs.dismissButton ? "pl-16" : "plr-16",
				onmouseenter: () => {
					vnode.attrs.onHoverChange(true)
				},
				onmouseleave: () => {
					vnode.attrs.onHoverChange(false)
				},
			},
			[
				m(".flex.gap-8.items-center", [
					a.leadingIcon &&
						m(Icon, {
							size: IconSize.PX20,
							icon: a.leadingIcon,
							style: {
								fill: theme.on_surface_variant,
							},
						}),
					m(".flex.center-vertically.smaller", lang.getTranslationText(vnode.attrs.message)),
				]),
				m(".flex.gap-8.items-center", [
					vnode.attrs.button ? m(".flex-end.center-vertically.pl-12", m(Button, vnode.attrs.button)) : null,
					vnode.attrs.dismissButton ? m(".flex.items-center.justify-right", [m(IconButton, vnode.attrs.dismissButton)]) : null,
				]),
			],
		)
	}
}

function makeButtonAttrsForSnackBar(button: SnackBarButtonAttrs): ButtonAttrs {
	return {
		label: button.label,
		click: button.click,
		type: ButtonType.Secondary,
	}
}

/**
 * Shows a SnackBar overlay at the bottom for low priority notifications that do not require (but might allow) user interaction and disappear after 6 seconds.
 * @param args.message The message to be shown. It must be short enough to ensure it is always shown in 2 lines of text at max in any language.
 * @param args.snackBarButton will close the snackbar if it is clicked (onClose() will be called)
 * @param args.onShow called when the snackbar is about to be displayed
 * @param args.onClose called when the snackbar is closed (either by timeout or button click)
 * @param args.waitingTime number of milliseconds to wait before showing the snackbar
 * @param args.showingTime number of milliseconds to display the snackbar (default = {@link SNACKBAR_SHOW_TIME})
 * @param args.replace if true, the snackbar should immediately replace the previous one
 *
 * @return a callback that will cancel or close the snackbar
 */
export function showSnackBar(args: {
	message: MaybeTranslation
	button?: SnackBarButtonAttrs
	dismissButton?: IconButtonAttrs
	onShow?: () => unknown
	onClose?: (timedOut: boolean) => unknown
	waitingTime?: number
	showingTime?: number
	replace?: boolean
	leadingIcon?: AllIcons
}): () => void {
	const { message, button, dismissButton, onClose, onShow, waitingTime, showingTime = SNACKBAR_SHOW_TIME, leadingIcon, replace = false } = args

	const doCancel = {
		/** cancel will be overwritten in {@link showNextNotification } once the snackbar  is shown */
		cancel: () => {
			remove(notificationQueue, queueEntry)
		},
	}

	const buttonAttrs = button ? makeButtonAttrsForSnackBar(button) : null

	const queueEntry: QueueItem = {
		message: message,
		button: buttonAttrs,
		dismissButton: dismissButton,
		onClose: onClose ?? null,
		onShow: onShow ?? null,
		doCancel,
		showingTime,
		leadingIcon,
	}

	let currentSnackbarTimeout: TimeoutID | null = null
	const cancelSnackbar = () => {
		if (currentSnackbarTimeout != null) {
			// The Snackbar was cancelled before it was shown (triggerSnackbar not yet called)
			clearTimeout(currentSnackbarTimeout)
			currentSnackbarTimeout = null
		}
		doCancel.cancel()
	}

	const triggerSnackbar = () => {
		if (replace && isNotEmpty(notificationQueue)) {
			// there is currently a notification being displayed, so we should put this one after it and then run the
			// currently displayed notification's cancel function
			notificationQueue.splice(1, 0, queueEntry)
			if (cancelCurrentSnackbar) {
				cancelCurrentSnackbar()
			}
		} else {
			notificationQueue.push(queueEntry)
		}

		if (notificationQueue.length > 1) {
			//Next notification will be shown when closing current notification
			return
		}

		showNextNotification()
	}

	if (waitingTime) {
		currentSnackbarTimeout = setTimeout(triggerSnackbar, waitingTime)
	} else {
		triggerSnackbar()
	}

	return cancelSnackbar
}

function getSnackBarPosition() {
	// The snackbar will be moved up from off the bottom of the viewport by the transformation animation.
	const snackBarMargin = styles.isUsingBottomNavigation() ? size.spacing_12 : size.spacing_24
	const leftOffset = styles.isDesktopLayout() ? layout_size.drawer_menu_width : 0
	const snackBarWidth = Math.min(window.innerWidth - leftOffset - 2 * snackBarMargin, MAX_SNACKBAR_WIDTH)
	return {
		bottom: px(snackBarMargin),
		// The SnackBar is only shown at the right in single column layout
		left: styles.isSingleColumnLayout() ? px(window.innerWidth - snackBarMargin - snackBarWidth) : px(leftOffset + snackBarMargin),
		"max-width": px(snackBarWidth),
		zIndex: LayerType.Modal,
	}
}

function showNextNotification() {
	const { message, button, dismissButton, onClose, onShow, doCancel, showingTime, leadingIcon } = notificationQueue[0] //we shift later because it is still shown
	clearTimeout(currentAnimationTimeout)
	currentAnimationTimeout = null

	let hovered = false
	let hoveredTimer: TimeoutID | null = null

	const closeFunction = displayOverlay(
		() => getSnackBarPosition(),
		{
			view: () =>
				m(SnackBar, {
					message,
					button,
					dismissButton: dismissButton,
					onHoverChange: (isHovered) => {
						hovered = isHovered
					},
					leadingIcon,
				}),
		},
		"slide-bottom",
		undefined,
		"",
	)

	let closed = false

	const closeAndOpenNext = (timedOut: boolean) => {
		if (timedOut && hovered) {
			hoveredTimer = setTimeout(closeAndOpenNext, SNACKBAR_HIDE_DELAY_TIME, true)
			return
		}

		closed = true
		cancelCurrentSnackbar = null

		if (currentAnimationTimeout !== null) {
			return
		}

		closeFunction()

		onClose?.(timedOut)

		notificationQueue.shift()

		if (notificationQueue.length > 0) {
			currentAnimationTimeout = setTimeout(showNextNotification, 2 * DefaultAnimationTime)
		}
	}

	// close the notification by default when pressing the button
	if (button) {
		const originClickHandler: ClickHandler | undefined = button.click

		button.click = (e, dom) => {
			clearTimeout(hoveredTimer)
			clearTimeout(autoRemoveTimer)
			originClickHandler?.(e, dom)
			closeAndOpenNext(false)
		}
	}

	// add a cancel-early function
	doCancel.cancel = () => {
		if (!closed) {
			closed = true
			clearTimeout(hoveredTimer)
			clearTimeout(autoRemoveTimer)
			closeAndOpenNext(false)
		}
	}
	cancelCurrentSnackbar = doCancel.cancel

	const autoRemoveTimer = setTimeout(closeAndOpenNext, showingTime, true)
	onShow?.()
	m.redraw()
}
