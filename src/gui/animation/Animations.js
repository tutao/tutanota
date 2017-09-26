// @flow
import {client} from "../../misc/ClientDetector"
import {ease} from "./Easing"
import {assertMainOrNode} from "../../api/Env"

assertMainOrNode()

export const DefaultAnimationTime = 200 // ms

const InitializedOptions = {
	stagger: 0,
	delay: 0,
	easing: ease.linear,
	duration: DefaultAnimationTime
}

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
	add(targets: HTMLElement|HTMLElement[]|HTMLCollection<HTMLElement>, mutations: DomMutation|DomMutation[], options: ?{stagger?: number, delay?: number, easing?: EasingFunction, duration?:number}): Promise<void> {
		let target: any = targets // opt out of type checking as this Union Type is hard to differentiate with flow
		let targetArrayOrCollection = target['length'] != null
		if (!target || targetArrayOrCollection && target.length === 0) {
			return Promise.reject(new Error('tried to animate a non existing element'))
		}
		let mutation: any = mutations
		if (!(mutations instanceof Array)) {
			mutation = [mutation]
		}
		let verifiedOptions = Animations.verifiyOptions(options)
		if (!targetArrayOrCollection) target = [target]
		return Promise.fromCallback(resolve => {
			let start = this.activeAnimations.length ? false : true
			for (let i = 0; i < target.length; i++) {
				let delay = verifiedOptions.delay
				if (verifiedOptions.stagger) {
					delay += verifiedOptions.stagger * i
				}
				this.activeAnimations.push(new Animation(target[i], mutation, i == target.length - 1 ? resolve : null, delay, verifiedOptions.easing, verifiedOptions.duration))
			}
			if (start) {
				window.requestAnimationFrame(this._animate)
			}
		})
	}

	static verifiyOptions(options: ?{stagger?: number, delay?: number, easing?: EasingFunction}): {stagger: number, delay: number, easing: EasingFunction, duration:number} {
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

	isFinished() {
		return this.runTime != null && this.runTime >= this.duration
	}
}

export function transform(type: TransformEnum, begin: number, end: number): DomTransform {
	let values: TransformValues = {[type]: {begin, end}}
	let updateDom = function (target: HTMLElement, percent: number, easing: EasingFunction): void {
		let transform = buildTransformString(values, percent, easing);
		target.style.transform = transform
	}
	let chain = function (type: TransformEnum, begin: number, end: number) {
		values[type] = {begin, end}
		return {updateDom, chain}
	}
	return {updateDom, chain}
}
transform.type = {
	translateX: 'translateX', // movement along X-Axis
	translateY: 'translateY', // movement along Y-Axis
	rotateY: 'rotateY', // rotates an element
	rotateZ: 'rotateZ', // rotates an element
}

const TransformUnits = {
	[transform.type.translateX]: 'px',
	[transform.type.translateY]: 'px',
	[transform.type.rotateY]: 'deg',
	[transform.type.rotateZ]: 'deg',
}

function buildTransformString(values: TransformValues, percent: number, easing: EasingFunction) {
	let transform = []
	let types: TransformEnum[] = (Object.keys(TransformUnits) : any[]) // the order is important (e.g. 'rotateY(45deg) translateX(10px)' leads to other results than 'translateX(10px) rotateY(45deg)'
	for (let type of types) {
		if (values[type]) {
			let value = calculateValue(percent, values[type].begin, values[type].end, easing)
			transform.push(type + '(' + value + TransformUnits[type] + ')')
		}
	}
	if (client.isMobileDevice()) {
		transform.push('translate3d(0,0,0)') // use gpu on mobile devices
	}
	return transform.join(' ')
}

/**
 * We use the alpha channel instead of using opacity for fading colors. Opacity changes are slow on mobile devices as they
 * effect the whole tree of the dom element with changing opacity.
 *
 * See http://stackoverflow.com/a/14677373 for a more detailed explanation.
 */
export function hexToRgb(hexColor: string): {r:number, g:number, b:number} {
	hexColor = hexColor.substring(1)
	let split = hexColor.match(/.{1,2}/g)
	if (split && split.length === 3) {
		return {
			r: parseInt(split[0], 16),
			g: parseInt(split[1], 16),
			b: parseInt(split[2], 16)
		}
	}
	throw new Error("illegal color definition")
}

export function rgbToHex(color: {r:number, g:number, b:number}) {
	return "#" + ((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1);
}

export function alpha(type: AlphaEnum, colorHex: string, begin: number, end: number): DomMutation {
	let color = hexToRgb(colorHex)

	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			let alphaChannel = calculateValue(percent, begin, end, easing)
			if (type == alpha.type.backgroundColor) {
				target.style.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alphaChannel})`
			} else if (type == alpha.type.color) {
				target.style.color = `rgba(${color.r}, ${color.g}, ${color.b}, ${alphaChannel})`
			}
		}
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
	let initialOpacity = '';
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			if (percent == 0) {
				initialOpacity = target.style.opacity
			}
			let opacity = calculateValue(percent, begin, end, easing)
			if (percent == 1 && !keepValue) {
				// on some elements the value hast to be set to the initial value because hover using opacity won't work otherwise.
				target.style.opacity = initialOpacity
			} else {
				target.style.opacity = opacity + ''
			}

		}
	}
}

export function height(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.style.height = calculateValue(percent, begin, end, easing) + 'px'
		}
	}
}

export function width(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.style.width = calculateValue(percent, begin, end, easing) + 'px'
		}
	}
}

export function fontSize(begin: number, end: number): DomMutation {
	return {
		updateDom: function (target: HTMLElement, percent: number, easing: EasingFunction): void {
			target.style.fontSize = calculateValue(percent, begin, end, easing) + 'px'
		}
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

