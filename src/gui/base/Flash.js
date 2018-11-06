// @flow
import {animations, opacity} from "../animation/Animations"
import {assertMainOrNodeBoot} from "../../api/Env"
import {client} from "../../misc/ClientDetector"

assertMainOrNodeBoot()

const flashedIn: Map<HTMLElement, number> = new Map() // currently flashed in element -> target opacity value
const PREVENT = (e) => e.preventDefault()

const eventListenerArgs = client.passive() ? {passive: true} : false
window.document.addEventListener("mouseup", () => flashedIn.forEach((computedOpacity: number, target: HTMLElement) => flashOutElement(target, computedOpacity)), eventListenerArgs)

export function addFlash(target: any) {
	if (client.isDesktopDevice()) {
		target.addEventListener("mousedown", flashIn, eventListenerArgs)
		target.addEventListener("dragstart", PREVENT, client.passive() ? {passive: false} : false)
	} else {
		target.addEventListener("touchstart", flashIn, eventListenerArgs)
		target.addEventListener("touchend", flashOut, eventListenerArgs)
		target.addEventListener("touchcancel", flashOut, eventListenerArgs)
	}
}

export function removeFlash(target: any) {
	if (client.isDesktopDevice()) {
		target.removeEventListener("mousedown", flashIn, eventListenerArgs)
		target.removeEventListener("dragstart", PREVENT)
	} else {
		target.removeEventListener("touchstart", flashIn, eventListenerArgs)
		target.removeEventListener("touchend", flashOut, eventListenerArgs)
		target.removeEventListener("touchcancel", flashOut, eventListenerArgs)
	}
}

export function flashIn(event: MouseEvent) {
	let target = (event.currentTarget: any)
	let computedValue = getComputedOpacity(target) // use the computed value as begin value because hover only changes the computed opacity
	// keep the opacity value for the flash animation to avoid flicker on element
	animations.add(target, opacity(computedValue, 0.4, true))
	flashedIn.set(target, computedValue)
}

export function flashOut(event: MouseEvent) {
	let target = (event.currentTarget: any)
	let computedValue = flashedIn.get(target)
	flashOutElement(target, computedValue)
}

export function flashOutElement(target: HTMLElement, computedOpacity: ?number) {
	if (computedOpacity) {
		flashedIn.delete(target)
		// don't keep the opacity value after the animation. hover on elements won't work otherwise.
		animations.add(target, opacity(0.4, computedOpacity, false), {delay: 300}).then(() => target.style.opacity = '')
	}
}

function getComputedOpacity(target: HTMLElement) {
	let computedValue = 0;
	if (window.getComputedStyle) {
		computedValue = Number(window.getComputedStyle(target).opacity)
	} else if ((target: any).currentStyle) {
		computedValue = Number(((target: any).currentStyle: any).opacity)
	}
	return computedValue;
}
