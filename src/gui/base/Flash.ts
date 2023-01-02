import { animations, opacity } from "../animation/Animations"
import { client } from "../../misc/ClientDetector"
import { assertMainOrNodeBoot } from "../../api/common/Env"

assertMainOrNodeBoot()
const flashedIn: Map<HTMLElement, number> = new Map() // currently flashed in element -> target opacity value

const PREVENT = (e: Event) => e.preventDefault()

const eventListenerArgs = client.passive()
	? {
			passive: true,
	  }
	: false

export function addFlash(target: any) {
	if (client.isDesktopDevice()) {
		target.addEventListener("mousedown", flashIn, eventListenerArgs)
		target.addEventListener("mouseup", flashOut, eventListenerArgs)
		target.addEventListener(
			"dragstart",
			PREVENT,
			client.passive()
				? {
						passive: false,
				  }
				: false,
		)
		target.addEventListener("mouseleave", flashOut, eventListenerArgs)
	} else {
		target.addEventListener("touchstart", flashIn, eventListenerArgs)
		target.addEventListener("touchend", flashOut, eventListenerArgs)
		target.addEventListener("touchcancel", flashOut, eventListenerArgs)
	}
}

export function removeFlash(target: any) {
	if (client.isDesktopDevice()) {
		target.removeEventListener("mousedown", flashIn, eventListenerArgs)
		target.removeEventListener("mouseup", flashOut, eventListenerArgs)
		target.removeEventListener("dragstart", PREVENT)
		target.removeEventListener("mouseleave", flashOut, eventListenerArgs)
	} else {
		target.removeEventListener("touchstart", flashIn, eventListenerArgs)
		target.removeEventListener("touchend", flashOut, eventListenerArgs)
		target.removeEventListener("touchcancel", flashOut, eventListenerArgs)
	}
}

export function flashIn(event: MouseEvent) {
	let target = event.currentTarget as any
	let computedValue = getComputedOpacity(target) // use the computed value as begin value because hover only changes the computed opacity

	// keep the opacity value for the flash animation to avoid flicker on element
	animations.add(target, opacity(computedValue, 0.4, true))
	flashedIn.set(target, computedValue)
}

export function flashOut(event: MouseEvent) {
	let target = event.currentTarget as any
	let computedValue = flashedIn.get(target)
	if (computedValue) {
		flashOutElement(target, computedValue)
	}
}

export function flashOutElement(target: HTMLElement, computedOpacity: number | null) {
	if (computedOpacity) {
		flashedIn.delete(target)
		// don't keep the opacity value after the animation. hover on elements won't work otherwise.
		animations
			.add(target, opacity(0.4, computedOpacity, false), {
				delay: 300,
			})
			.then(() => (target.style.opacity = ""))
	}
}

function getComputedOpacity(target: HTMLElement) {
	let computedValue = 0

	if (window.getComputedStyle) {
		computedValue = Number(window.getComputedStyle(target).opacity)
	} else if ((target as any).currentStyle) {
		computedValue = Number(((target as any).currentStyle as any).opacity)
	}

	return computedValue
}
