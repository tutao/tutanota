//@flow
import m from "mithril"
import {px, size} from "../size"
import {DefaultAnimationTime, transform} from "../animation/Animations"
import {displayOverlay} from "./Overlay"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, ButtonType} from "./ButtonN"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {styles} from "../styles"
import {LayerType} from "../../RootView"
import type {lazy} from "@tutao/tutanota-utils"
import type {clickHandler} from "./GuiUtils"
import {assertMainOrNode} from "../../api/common/Env"

assertMainOrNode()

export const SNACKBAR_SHOW_TIME = 6000
const MAX_SNACKBAR_WIDTH = 400

export type SnackBarButtonAttrs = {|
	label: TranslationKey | lazy<string>,
	click: clickHandler,
|}

type SnackBarAttrs = {|
	message: TranslationKey | lazy<string>,
	button: ?ButtonAttrs,
|}

const notificationQueue = []
let currentAnimationTimeout: ?TimeoutID = null

class SnackBar implements MComponent<SnackBarAttrs> {
	view(vnode: Vnode<SnackBarAttrs>) {
		// use same padding as MinimizedEditor
		return m(".snackbar-content.flex.flex-space-between.border-radius.plr.pb-xs.pt-xs", [
			m(".flex.center-vertically.smaller", lang.getMaybeLazy(vnode.attrs.message)),
			vnode.attrs.button ? m(".flex-end.center-vertically.pl", m(ButtonN, vnode.attrs.button)) : null
		])
	}
}

function makeButtonAttrsForSnackBar(button: SnackBarButtonAttrs): ButtonAttrs {
	return {
		label: button.label,
		click: button.click,
		type: ButtonType.Secondary
	}
}

/**
 * Shows a SnackBar overlay at the bottom for low priority notifications that do not require (but might allow) user interaction and disappear after 6 seconds.
 * @param message The message to be shown. It must be short enough to ensure it is always shown in 2 lines of text at max in any language.
 * @param snackBarButton will close the snackbar if it is clicked (onClose() will be called)
 * @param onClose called when the snackbar is closed (either by timeout or button click)
 */
export function showSnackBar(message: TranslationKey | lazy<string>, snackBarButton: SnackBarButtonAttrs, onClose: ?() => void) {
	const button = makeButtonAttrsForSnackBar(snackBarButton)
	notificationQueue.push({message, button, onClose})
	if (notificationQueue.length > 1) {
		//Next notification will be shown when closing current notification
		return
	}
	showNextNotification()
}

function getSnackBarPosition() {
	// The snackbar will be moved up from off the bottom of the viewport by the transformation animation.
	const snackBarMargin = styles.isUsingBottomNavigation() ? size.hpad : size.hpad_medium
	const leftOffset = styles.isDesktopLayout() ? size.drawer_menu_width : 0
	const snackBarWidth = Math.min(window.innerWidth - leftOffset - 2 * snackBarMargin, MAX_SNACKBAR_WIDTH)
	return {
		top: "100%",
		// The SnackBar is only shown at the right in single column layout
		left: styles.isSingleColumnLayout()
			? px(window.innerWidth - snackBarMargin - snackBarWidth)
			: px(leftOffset + snackBarMargin),
		width: px(snackBarWidth),
		zIndex: LayerType.LowPriorityNotification
	}
}

function showNextNotification() {
	const {message, button, onClose} = notificationQueue[0] //we shift later because it is still shown
	currentAnimationTimeout = null
	const bottomOffset = (styles.isUsingBottomNavigation() ? size.bottom_nav_bar + size.hpad : size.hpad_medium)
	const closeFunction = displayOverlay(() => getSnackBarPosition(), {
			view: () => m(SnackBar, {message, button})
		},
		(dom) => transform(transform.type.translateY, 0, -(bottomOffset + dom.offsetHeight)),
		(dom) => transform(transform.type.translateY, -(bottomOffset + dom.offsetHeight), 0),
		"minimized-shadow"
	)

	const closeAndOpenNext = () => {
		if (currentAnimationTimeout !== null) {
			return
		}
		closeFunction()
		if (onClose) {
			onClose()
		}
		notificationQueue.shift()
		if (notificationQueue.length > 0) {
			currentAnimationTimeout = setTimeout(showNextNotification, 2 * DefaultAnimationTime)
		}
	}
	// close the notification by default when pressing the button
	if (button) {
		const originClickHandler = button.click
		button.click = (e, dom) => {
			clearTimeout(autoRemoveTimer)
			originClickHandler(e, dom)
			closeAndOpenNext()
		}
	}

	const autoRemoveTimer = setTimeout(closeAndOpenNext, SNACKBAR_SHOW_TIME)

	m.redraw();
}
