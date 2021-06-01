//@flow

import m from "mithril"
import {px, size} from "../size"
import {DefaultAnimationTime, transform} from "../animation/Animations"
import {displayOverlay} from "./Overlay"
import {assertMainOrNode} from "../../api/common/Env"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, ButtonType} from "./ButtonN"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {styles} from "../styles"

assertMainOrNode()

export const SNACKBAR_SHOW_TIME = 6000
const MAX_SNACKBAR_WIDTH = 400

export type SnackBarButtonAttrs = {|
	label: TranslationKey | lazy<string>,
	click: clickHandler,
|}

type SnackBarAttrs = {|
	message: TranslationKey | lazy<string>,
	button?: ButtonAttrs,
|}

const notificationQueue = []
let currentAnimationTimeout: ?TimeoutID = null

class SnackBar implements MComponent<SnackBarAttrs> {
	view(vnode: Vnode<SnackBarAttrs>) {
		return m(".snackbar-content.flex.flex-space-between.snackbar-bg.border-radius.plr.snackbar-shadow", [
			m(".flex.center-vertically.fg-icon-selected.smaller.pt-s.pb-s", lang.getMaybeLazy(vnode.attrs.message)),
			vnode.attrs.button ? m(".flex-end.center-vertically.pl", m(ButtonN, vnode.attrs.button)) : null
		])
	}
}

function makeButtonAttrsForSnackBar(button?: SnackBarButtonAttrs): ?ButtonAttrs {
	if (!button) {
		return null
	}
	const upperCaseLabel = lang.getMaybeLazy(button.label).toLocaleUpperCase()
	return {
		label: () => upperCaseLabel,
		click: button.click,
		type: ButtonType.Primary
	}
}

export function showSnackBar(message: TranslationKey | lazy<string>, snackBarButton?: SnackBarButtonAttrs, onClose: ?() => void) {
	const button = makeButtonAttrsForSnackBar(snackBarButton)
	notificationQueue.push({message, button, onClose})
	if (notificationQueue.length > 1) {
		//Next notification will be shown when closing current notification
		return
	}
	showNextNotification()
}

function showNextNotification() {
	const {message, button, onClose} = notificationQueue[0] //we shift later because it is still shown
	currentAnimationTimeout = null
	const margin = size.hpad
	const leftOffset = styles.isDesktopLayout() ? size.drawer_menu_width : 0
	const width = Math.min(window.innerWidth - leftOffset - 2 * margin, MAX_SNACKBAR_WIDTH)
	const bottomOffset = (styles.isUsingBottomNavigation() ? size.bottom_nav_bar : 0) + size.vpad_small
	const closeFunction = displayOverlay({bottom: px(bottomOffset), left: px(leftOffset + margin), width: px(width)}, {
			view: () => m(SnackBar, {message, button})
		},
		(dom) => transform(transform.type.translateY, dom.offsetHeight + bottomOffset, 0),
		(dom) => transform(transform.type.translateY, 0, dom.offsetHeight + bottomOffset)
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
