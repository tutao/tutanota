import type { EasingFunction } from "./Easing"
import { ease } from "./Easing"
import { downcast } from "@tutao/tutanota-utils"
import { hexToRgb } from "../base/Color"
import { assertMainOrNodeBoot } from "../../api/common/Env"

assertMainOrNodeBoot()

export interface DomMutation {
	updateDom(target: HTMLElement, percent: number, easing: EasingFunction): void

	willChange(): string
}

interface DomTransform extends DomMutation {
	chain(type: TransformEnum, begin: number, end: number): DomTransform
}

export const enum AlphaEnum {
	BackgroundColor = "backgroundColor",
	Color = "color",
}

export const enum TransformEnum {
	/** shift the element in left-right direction. begin and end denote the target offset from the "natural" position */
	TranslateX = "translateX",
	/** shift the element in top-bottom direction. begin and end denote the target offset from the "natural" position */
	TranslateY = "translateY",
	RotateY = "rotateY",
	RotateZ = "rotateZ",
	/** scale the element both horizontally and vertically. begin and end denote the desired scale in 0-1 range. */
	Scale = "scale",
}

type TransformValues = Record<
	TransformEnum,
	{
		begin: number
		end: number
	}
>
export const DefaultAnimationTime = 200 // ms

const InitializedOptions = {
	stagger: 0,
	delay: 0,
	easing: ease.linear,
	duration: DefaultAnimationTime,
}
export type AnimationPromise = {
	animations?: Array<Animation>
} & Promise<unknown>

class Animations {
	activeAnimations: Animation[]
	_animate: (...args: Array<any>) => any

	constructor() {
		this.activeAnimations = []

		this._animate = () => {
			let finished: Animation[] = []
			let now = window.performance.now()

			for (let animation of this.activeAnimations) {
				animation.animateFrame(now)

				if (animation.isFinished()) {
					finished.push(animation)
				}
			}

			for (let animation of finished) {
				this.activeAnimations.splice(this.activeAnimations.indexOf(animation), 1)

				if (animation.resolve) {
					animation.resolve()
				}
			}

			if (this.activeAnimations.length > 0) {
				window.requestAnimationFrame(this._animate)
			}
		}
	}

	/**
	 * Adds an animation that should be executed immediately. Returns a promise that resolves after the animation is complete.
	 */
	add(
		targets: HTMLElement | HTMLElement[] | HTMLCollection,
		mutations: DomMutation | DomMutation[],
		options?: {
			stagger?: number
			delay?: number
			easing?: EasingFunction
			duration?: number
		},
	): AnimationPromise {
		const targetsArray: Array<HTMLElement> = targets instanceof HTMLElement ? [targets] : (Array.from(targets) as Array<HTMLElement>)

		let targetMutations: DomMutation[]

		if (!(mutations instanceof Array)) {
			targetMutations = [mutations]
		} else {
			targetMutations = mutations
		}

		let verifiedOptions = Animations.verifiyOptions(options)
		const willChange = targetMutations
			.map((mutation) => mutation.willChange())
			.filter((willChange) => willChange.length)
			.join(" ")
		for (const t of targetsArray) {
			t.style.willChange = willChange
		}
		const animations: Animation[] = []
		const promise = new Promise((resolve) => {
			let start = this.activeAnimations.length ? false : true

			for (let i = 0; i < targetsArray.length; i++) {
				let delay = verifiedOptions.delay

				if (verifiedOptions.stagger) {
					delay += verifiedOptions.stagger * i
				}

				const animation = new Animation(
					targetsArray[i],
					targetMutations,
					i === targetsArray.length - 1 ? resolve : null,
					delay,
					verifiedOptions.easing,
					verifiedOptions.duration,
				)
				animations.push(animation)
				this.activeAnimations.push(animation)
			}

			if (start) {
				window.requestAnimationFrame(this._animate)
			}
		})
		const animationPromise = downcast<AnimationPromise>(promise)
		animationPromise.animations = animations
		return animationPromise
	}

	cancel(animation: Animation) {
		this.activeAnimations.splice(this.activeAnimations.indexOf(animation), 1)

		if (animation.resolve) {
			animation.resolve()
		}
	}

	static verifiyOptions(
		options:
			| {
					stagger?: number
					delay?: number
					easing?: EasingFunction
			  }
			| null
			| undefined,
	): {
		stagger: number
		delay: number
		easing: EasingFunction
		duration: number
	} {
		return Object.assign({}, InitializedOptions, options)
	}
}

export class Animation {
	target: HTMLElement
	mutations: DomMutation[]
	resolve: ((...args: Array<any>) => any) | null
	duration: number
	delay: number
	animationStart: number | null
	runTime: number | null
	easing: EasingFunction

	constructor(
		target: HTMLElement,
		mutations: DomMutation[],
		resolve: ((...args: Array<any>) => any) | null,
		delay: number,
		easing: EasingFunction,
		duration: number = DefaultAnimationTime,
	) {
		this.target = target
		this.mutations = mutations
		this.resolve = resolve
		this.delay = delay
		this.duration = duration
		this.animationStart = null
		this.runTime = null
		this.easing = easing
	}

	animateFrame(now: number) {
		if (this.animationStart == null) this.animationStart = now
		this.runTime = Math.min(now - this.animationStart - this.delay, this.duration)

		if (this.runTime >= 0) {
			for (let m of this.mutations) {
				m.updateDom(this.target, this.runTime / this.duration, this.easing)
			}
		}
	}

	isFinished(): boolean {
		return this.runTime != null && this.runTime >= this.duration
	}
}

export function transform(type: TransformEnum, begin: number, end: number): DomTransform {
	const values = {} as TransformValues

	values[type] = {
		begin,
		end,
	}

	let updateDom = function (target: HTMLElement, percent: number, easing: EasingFunction): void {
		target.style.transform = buildTransformString(values, percent, easing)
	}

	const willChange = () => "transform"

	let chain = function (type: TransformEnum, begin: number, end: number) {
		values[type] = {
			begin,
			end,
		}
		return {
			updateDom,
			chain,
			willChange,
		}
	}

	return {
		updateDom,
		chain,
		willChange,
	}
}

export function scroll(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.scrollTop = calculateValue(percent, begin, end, easing)
		},
		willChange: () => "",
	}
}

const TransformUnits = {
	[TransformEnum.TranslateX]: "px",
	[TransformEnum.TranslateY]: "px",
	[TransformEnum.RotateY]: "deg",
	[TransformEnum.RotateZ]: "deg",
	[TransformEnum.Scale]: "",
}

function buildTransformString(values: TransformValues, percent: number, easing: EasingFunction) {
	let transform: string[] = []
	let types: TransformEnum[] = Object.keys(TransformUnits) as any[] // the order is important (e.g. 'rotateY(45deg) translateX(10px)' leads to other results than 'translateX(10px) rotateY(45deg)'

	for (let type of types) {
		if (values[type]) {
			let value = calculateValue(percent, values[type].begin, values[type].end, easing)
			transform.push(type + "(" + value + TransformUnits[type] + ")")
		}
	}

	return transform.join(" ")
}

/**
 * We use the alpha channel instead of using opacity for fading colors. Opacity changes are slow on mobile devices as they
 * effect the whole tree of the dom element with changing opacity.
 *
 * See http://stackoverflow.com/a/14677373 for a more detailed explanation.
 */
export function alpha(type: AlphaEnum, colorHex: string, begin: number, end: number): DomMutation {
	let color = hexToRgb(colorHex)
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			let alphaChannel = calculateValue(percent, begin, end, easing)

			if (type === AlphaEnum.BackgroundColor) {
				target.style.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alphaChannel})`
			} else if (type === AlphaEnum.Color) {
				target.style.color = `rgba(${color.r}, ${color.g}, ${color.b}, ${alphaChannel})`
			}
		},
		willChange: () => "alpha",
	}
}

/**
 * Only use on small elements. You should use Alpha for fading large backgrounds which is way faster on mobiles.
 */
export function opacity(begin: number, end: number, keepValue: boolean): DomMutation {
	let initialOpacity: string | null = null
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			if (percent === 0 && initialOpacity === null) {
				initialOpacity = target.style.opacity
			}

			let opacity = calculateValue(percent, begin, end, easing)

			if (percent === 1 && !keepValue) {
				// on some elements the value hast to be set to the initial value because hover using opacity won't work otherwise.
				target.style.opacity = initialOpacity ? initialOpacity : ""
			} else {
				target.style.opacity = opacity + ""
			}
		},
		willChange: () => "opacity",
	}
}

export function height(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.style.height = calculateValue(percent, begin, end, easing) + "px"
		},
		willChange: () => "height",
	}
}

export function width(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.style.width = calculateValue(percent, begin, end, easing) + "px"
		},
		willChange: () => "width",
	}
}

export function fontSize(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.style.fontSize = calculateValue(percent, begin, end, easing) + "px"
		},
		willChange: () => "",
	}
}

function calculateValue(percent: number, begin: number, end: number, easing: (...args: Array<any>) => any): number {
	return (end - begin) * easing(percent) + begin
}

export const animations: Animations = new Animations()

export function get(element: HTMLElement | null): HTMLElement {
	if (!element) throw new Error("tried to update a non existing element")
	return element
}
