//@flow

import {downcast} from "@tutao/tutanota-utils"
import {assertMainOrNodeBoot} from "../api/common/Env"

assertMainOrNodeBoot()

export function applySafeAreaInsetMarginLR(element: HTMLElement) {
	element.style.marginRight = 'env(safe-area-inset-right)'
	element.style.marginLeft = 'env(safe-area-inset-left)'
}

export function getSafeAreaInsetLeft(): string {
	return window.orientation === 90 ? 'env(safe-area-inset-left)' : ""
}

export function getSafeAreaInsetRight(): string {
	return window.orientation === -90 ? 'env(safe-area-inset-right)' : ""
}

export function newMouseEvent(): MouseEvent {
	// We cannot use constructor because of IE11
	return downcast(document.createEvent("MouseEvent"))
}

export function stringifyFragment(fragment: DocumentFragment): string {
	let div = document.createElement("div")
	div.appendChild(fragment)
	return div.innerHTML
}