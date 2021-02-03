// @flow
import {ease} from "./Easing"
import {assertMainOrNodeBoot} from "../../api/common/Env"
import {downcast} from "../../api/common/utils/Utils"
import {hexToRgb} from "../base/Color"
import type {EasingFunction} from "./Easing"

assertMainOrNodeBoot()


export interface DomMutation {
	updateDom(target: HTMLElement, percent: number, easing: EasingFunction): void;

	willChange(): string;
}

interface DomTransform extends DomMutation {
	chain(type: TransformEnum, begin: number, end: number): DomTransform;
}

type AlphaEnum = 'backgroundColor' | 'color'
type TransformEnum = 'translateX' | 'translateY' | 'rotateY' | 'rotateZ' | 'scale'
type TransformValues = {
	[key: TransformEnum]: {begin: number, end: number}
}


export const DefaultAnimationTime = 200 // ms

const InitializedOptions = {
	stagger: 0,
	delay: 0,
	easing: ease.linear,
	duration: DefaultAnimationTime
}

export type AnimationPromise = {animations?: Array<Animation>} & Promise<void>

class Animations {
	activeAnimations: Animation[];
	_animate: Function;

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
	add(targets: HTMLElement | HTMLElement[] | HTMLCollection<HTMLElement>, mutations: DomMutation | DomMutation[], options: ?{stagger?: number, delay?: number, easing?: EasingFunction, duration?: number}): AnimationPromise {
		const targetsArray: Array<HTMLElement> = targets instanceof HTMLElement ? [targets] : Array.from(targets)
		let targetMutations: DomMutation[]
		if (!(mutations instanceof Array)) {
			targetMutations = [mutations]
		} else {
			targetMutations = mutations
		}
		let verifiedOptions = Animations.verifiyOptions(options)

		const willChange = targetMutations.map(mutation => mutation.willChange()).filter(willChange => willChange.length).join(" ")
		targetsArray.forEach((t) => t.style.willChange = willChange)
		const animations = []
		const promise = new Promise((resolve) => {
			let start = this.activeAnimations.length ? false : true
			for (let i = 0; i < targetsArray.length; i++) {
				let delay = verifiedOptions.delay
				if (verifiedOptions.stagger) {
					delay += verifiedOptions.stagger * i
				}
				const animation = new Animation(targetsArray[i], targetMutations,
					i === targetsArray.length - 1 ? resolve : null, delay, verifiedOptions.easing, verifiedOptions.duration)

				animations.push(animation)
				this.activeAnimations.push(animation)
			}
			if (start) {
				window.requestAnimationFrame(this._animate)
			}
		})
		downcast(promise).animations = animations
		return promise
	}

	cancel(animation: Animation) {
		this.activeAnimations.splice(this.activeAnimations.indexOf(animation), 1)
		if (animation.resolve) {
			animation.resolve()
		}
	}

	static verifiyOptions(options: ?{stagger?: number, delay?: number, easing?: EasingFunction}): {stagger: number, delay: number, easing: EasingFunction, duration: number} {
		return Object.assign({}, InitializedOptions, options)
	}

}

export class Animation {
	target: HTMLElement;
	mutations: DomMutation[];
	resolve: ?Function;
	duration: number;
	delay: number;
	animationStart: ?number;
	runTime: ?number;
	easing: EasingFunction;

	constructor(target: HTMLElement, mutations: DomMutation[], resolve: ?Function, delay: number, easing: EasingFunction, duration: number = DefaultAnimationTime) {
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
	const values: TransformValues = {}
	values[type] = {begin, end}
	let updateDom = function (target: HTMLElement, percent: number, easing: EasingFunction): void {
		target.style.transform = buildTransformString(values, percent, easing)
	}
	const willChange = () => "transform"
	let chain = function (type: TransformEnum, begin: number, end: number) {
		values[type] = {begin, end}
		return {updateDom, chain, willChange}
	}
	return {updateDom, chain, willChange}
}

transform.type = {
	translateX: 'translateX', // movement along X-Axis
	translateY: 'translateY', // movement along Y-Axis
	rotateY: 'rotateY', // rotates an element
	rotateZ: 'rotateZ', // rotates an element
	scale: 'scale'
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
	[transform.type.translateX]: 'px',
	[transform.type.translateY]: 'px',
	[transform.type.rotateY]: 'deg',
	[transform.type.rotateZ]: 'deg',
	[transform.type.scale]: ''
}

function buildTransformString(values: TransformValues, percent: number, easing: EasingFunction) {
	let transform = []
	let types: TransformEnum[] = (Object.keys(TransformUnits): any[]) // the order is important (e.g. 'rotateY(45deg) translateX(10px)' leads to other results than 'translateX(10px) rotateY(45deg)'
	for (let type of types) {
		if (values[type]) {
			let value = calculateValue(percent, values[type].begin, values[type].end, easing)
			transform.push(type + '(' + value + TransformUnits[type] + ')')
		}
	}
	return transform.join(' ')
}


export function alpha(type: AlphaEnum, colorHex: string, begin: number, end: number): DomMutation {
	let color = hexToRgb(colorHex)

	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			let alphaChannel = calculateValue(percent, begin, end, easing)
			if (type === alpha.type.backgroundColor) {
				target.style.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alphaChannel})`
			} else if (type === alpha.type.color) {
				target.style.color = `rgba(${color.r}, ${color.g}, ${color.b}, ${alphaChannel})`
			}
		},
		willChange: () => "alpha",
	}
}

alpha.type = {
	backgroundColor: 'backgroundColor',
	color: 'color'
}

/**
 * Only use on small elements. You should use Alpha for fading large backgrounds which is way faster on mobiles.
 */
export function opacity(begin: number, end: number, keepValue: boolean): DomMutation {
	let initialOpacity = null;
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			if (percent === 0 && initialOpacity === null) {
				initialOpacity = target.style.opacity
			}
			let opacity = calculateValue(percent, begin, end, easing)
			if (percent === 1 && !keepValue) {
				// on some elements the value hast to be set to the initial value because hover using opacity won't work otherwise.
				target.style.opacity = initialOpacity ? initialOpacity : ''
			} else {
				target.style.opacity = opacity + ''
			}
		},
		willChange: () => "opacity",
	}
}

export function height(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.style.height = calculateValue(percent, begin, end, easing) + 'px'
		},
		willChange: () => "height",
	}
}

export function width(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.style.width = calculateValue(percent, begin, end, easing) + 'px'
		},
		willChange: () => "width",
	}
}

export function fontSize(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.style.fontSize = calculateValue(percent, begin, end, easing) + 'px'
		},
		willChange: () => "",
	}
}

function calculateValue(percent: number, begin: number, end: number, easing: Function): number {
	return (end - begin) * easing(percent) + begin
}

export const animations: Animations = new Animations()


export function get(element: ?HTMLElement): HTMLElement {
	if (!element) throw new Error('tried to update a non existing element')
	return element
}

