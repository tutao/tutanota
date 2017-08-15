// @flow
import {animations, width, height, transform, opacity} from "../animation/Animations"
import {ease} from "../animation/Easing"
import {assertMainOrNode} from "../../api/Env"

assertMainOrNode()


const ripple_light = 'rgba(255, 255, 255, 0.45)' // fadeout(@light, 55%) -> http://lesscss.org/less_preview
const ripple_dark = 'rgba(0, 0, 0, 0.25)' // fadeout(@dark, 75%) -> http://lesscss.org/less_preview

const rippleElement = document.createElement("div")
rippleElement.className = "ripple backface_fix fill-absolute"
rippleElement.style.zIndex = '10'
rippleElement.style.borderRadius = '50%'
rippleElement.style.background = ripple_dark

export const ripple = function (target: HTMLElement, event: MouseEvent, widthFactor: number = 0.9) {
	let position = target.getBoundingClientRect()
	let centerY = event.clientY - position.top
	let centerX = event.clientX - position.left

	rippleElement.style.transform = `translateX(${event.clientX}px) translateY(${event.clientY}px)`
	target.appendChild(rippleElement)


	let targetSize = Math.max(target.offsetWidth, target.offsetHeight) * widthFactor
	animations.add(rippleElement, [
		transform(transform.type.translateX, centerX, centerX - (targetSize / 2))
			.chain(transform.type.translateY, centerY, centerY - (targetSize / 2)),
		width(0, targetSize),
		height(0, targetSize)
	], {easing: ease.out}).then(() => {
		if (rippleElement.parentElement === target) target.removeChild(rippleElement)
	})
}

export const flash = function (target: HTMLElement): Promise<void> {
	let computedValue = getComputedOpacity(target) // use the computed value as begin value because hover only changes the computed opacity
	// keep the opacity value for the flash animation to avoid flicker on element
	animations.add(target, opacity(computedValue, 0.4, true))
	// don't keep the opacity value after the animation. hover on elements won't work otherwise.
	return animations.add(target, opacity(0.4, computedValue, false), {delay: 300})
}

function getComputedOpacity(target: HTMLElement) {
	let computedValue = 0;
	if (window.getComputedStyle) {
		computedValue = Number(window.getComputedStyle(target).opacity)
	} else if (target.currentStyle) {
		computedValue = Number((target.currentStyle:any).opacity)
	}
	return computedValue;
}
