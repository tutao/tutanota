import o from "@tutao/otest"
import type { DomMutation } from "../../../../src/common/gui/animation/Animations.js"
import { alpha, AlphaEnum, Animation, animations, DefaultAnimationTime, transform, TransformEnum } from "../../../../src/common/gui/animation/Animations.js"
import { ease } from "../../../../src/common/gui/animation/Easing.js"
import { client } from "../../../../src/common/misc/ClientDetector.js"
import { DeviceType } from "../../../../src/common/misc/ClientConstants.js"
import { assertNotNull, downcast } from "@tutao/tutanota-utils"
import { spy } from "@tutao/tutanota-test-utils"

client.device = DeviceType.DESKTOP

globalThis.HTMLElement =
	window.HTMLElement ||
	class HTMLElement {
		style: CSSStyleDeclaration

		constructor() {
			this.style = downcast({})
		}
	}

const defaultMutation: DomMutation = {
	updateDom(target, percent, easing) {},
	willChange() {
		return "nothing"
	},
}

function newTarget() {
	return document.createElement("div")
}

o.spec("Animations", function () {
	o.spec("base", function () {
		let originalRequestAnimationFrame = window.requestAnimationFrame
		let originalPerformance = window.performance
		let newPerformance = {
			now: () => time,
		}

		let time
		o.beforeEach(function () {
			animations.activeAnimations = []
			Object.defineProperty(window, "performance", {
				get() {
					return newPerformance
				},
			})
		})
		o.after(function () {
			window.requestAnimationFrame = originalRequestAnimationFrame
			Object.defineProperty(window, "performance", {
				get() {
					return originalPerformance
				},
			})
		})

		o("animation is created on add with default delay of 0", function () {
			let target = newTarget()

			window.requestAnimationFrame = spy()

			animations.add([target], defaultMutation)

			o(animations.activeAnimations.length).equals(1)
			o(animations.activeAnimations[0].delay).equals(0)
			o(animations.activeAnimations[0].mutations).deepEquals([defaultMutation])
			o(animations.activeAnimations[0].target).equals(target)
		})

		o("single element animation with delay", function () {
			let target = newTarget()

			window.requestAnimationFrame = spy()

			animations.add([target], defaultMutation, { delay: 55 })

			o(animations.activeAnimations.length).equals(1)
			o(animations.activeAnimations[0].delay).equals(55)
			o(animations.activeAnimations[0].mutations).deepEquals([defaultMutation])
			o(animations.activeAnimations[0].target).equals(target)
		})

		o("adding to an empty queue triggers the animation", function () {
			o(animations.activeAnimations).deepEquals([])
			let target = newTarget()

			window.requestAnimationFrame = spy()
			animations.add([target], defaultMutation)

			o(window.requestAnimationFrame.args).deepEquals([animations._animate])
		})
		o("adding to a non empty queue does not trigger multiple animation frame requests", function () {
			o(animations.activeAnimations).deepEquals([])
			let target = newTarget()

			window.requestAnimationFrame = spy()
			animations.add([target], defaultMutation)
			animations.add([target], defaultMutation)
			o(window.requestAnimationFrame.callCount).equals(1)
		})

		o("unfinished animations are invoked and a new animation frame is requested", function () {
			time = 5
			let animation = downcast({
				animateFrame: spy(),
				isFinished: spy(),
				resolve: spy(),
			})
			animations.activeAnimations = [animation]

			window.requestAnimationFrame = spy()

			animations._animate()

			o(animation.animateFrame.args).deepEquals([time])
			o(animations.activeAnimations).deepEquals([animation])
			o(window.requestAnimationFrame.args).deepEquals([animations._animate])
		})

		o("finished animations are removed from the queue and resolved", function () {
			let animation = downcast({
				animateFrame: spy(),
				isFinished: () => true,
				resolve: spy(),
			})
			animations.activeAnimations = [animation]

			window.requestAnimationFrame = spy()

			animations._animate()

			o(animation.animateFrame.callCount).equals(1)
			o(animations.activeAnimations).deepEquals([])

			o(window.requestAnimationFrame.callCount).equals(0)
		})

		o("stagger", function () {
			const targets = [newTarget(), newTarget(), newTarget()]

			window.requestAnimationFrame = spy()

			animations.add(targets, defaultMutation, { stagger: 55 })

			o(window.requestAnimationFrame.callCount).equals(1)
			o(animations.activeAnimations.length).equals(3)
			o(animations.activeAnimations[0].delay).equals(0)
			o(animations.activeAnimations[1].delay).equals(55)
			o(animations.activeAnimations[2].delay).equals(110)

			// resolve function is only initialized for the last animation
			o(animations.activeAnimations[0].resolve).equals(null)
			o(animations.activeAnimations[1].resolve).equals(null)
			o(animations.activeAnimations[2].resolve instanceof Function).equals(true)

			// remove difference for equality check
			animations.activeAnimations[0].delay = 0
			animations.activeAnimations[1].delay = 0
			animations.activeAnimations[2].delay = 0
			animations.activeAnimations[2].resolve = null
			o(JSON.stringify(animations.activeAnimations[0])).equals(JSON.stringify(animations.activeAnimations[1]))
			o(JSON.stringify(animations.activeAnimations[1])).equals(JSON.stringify(animations.activeAnimations[2]))
		})

		o("start and finish", function () {
			let target = newTarget()
			let mutation = Object.assign({}, defaultMutation, { updateDom: spy() })
			let resolve = spy()
			let a = new Animation(target, [mutation], resolve, 0, ease.linear)

			o(a.animationStart).equals(null)
			o(a.duration).equals(DefaultAnimationTime)
			o(a.isFinished()).equals(false)

			a.animateFrame(4)
			o(a.animationStart).equals(4)
			o(a.runTime).equals(0)
			o(a.isFinished()).equals(false)

			a.animateFrame(203)
			o(a.animationStart).equals(4)
			o(a.runTime).equals(199)
			o(a.isFinished()).equals(false)

			a.animateFrame(204)

			o(a.animationStart).equals(4)
			o(a.runTime).equals(200)
			o(a.isFinished()).equals(true)

			a.animateFrame(304)

			o(a.animationStart).equals(4)
			o(a.runTime).equals(200)
			o(a.isFinished()).equals(true)
		})

		o("delay and domMutation", function () {
			let target = newTarget()
			let mutation = Object.assign({}, defaultMutation, { updateDom: spy() })
			let resolve = spy()
			let delay = 150
			let a = new Animation(target, [mutation], resolve, delay, ease.linear)

			o(a.animationStart).equals(null)
			o(a.duration).equals(DefaultAnimationTime)
			o(a.isFinished()).equals(false)

			a.animateFrame(0)
			o(a.animationStart).equals(0)
			o(a.runTime).equals(-150)
			o(a.isFinished()).equals(false)
			o(mutation.updateDom.callCount).equals(0)

			a.animateFrame(150)
			o(a.animationStart).equals(0)
			o(a.runTime).equals(0)
			o(a.isFinished()).equals(false)
			o(mutation.updateDom.callCount).equals(1)
			o(mutation.updateDom.args).deepEquals([target, assertNotNull(a.runTime) / a.duration, ease.linear])

			a.animateFrame(250)
			o(a.animationStart).equals(0)
			o(a.runTime).equals(100)
			o(a.isFinished()).equals(false)
			o(mutation.updateDom.callCount).equals(2)
			o(mutation.updateDom.args).deepEquals([target, assertNotNull(a.runTime) / a.duration, ease.linear])

			a.animateFrame(350)
			o(a.animationStart).equals(0)
			o(a.runTime).equals(200)
			o(a.isFinished()).equals(true)
			o(mutation.updateDom.callCount).equals(3)
			o(mutation.updateDom.args).deepEquals([target, assertNotNull(a.runTime) / a.duration, ease.linear])
		})
	})

	o.spec("transform dom updates", function () {
		o("translateX with constant y", function () {
			const target = newTarget()

			let m = transform(TransformEnum.TranslateX, 0, 120).chain(TransformEnum.TranslateY, 8, 8)

			client.device = DeviceType.DESKTOP
			m.updateDom(target, 0 / 200, ease.linear)
			o(target.style.transform).equals("translateX(0px) translateY(8px)")

			m.updateDom(target, 20 / 200, ease.linear)
			o(target.style.transform).equals("translateX(12px) translateY(8px)")

			m.updateDom(target, 199 / 200, ease.linear)
			o(target.style.transform).equals("translateX(119.4px) translateY(8px)")

			m.updateDom(target, 200 / 200, ease.linear)
			o(target.style.transform).equals("translateX(120px) translateY(8px)")

			client.device = DeviceType.OTHER_MOBILE
			m.updateDom(target, 20 / 200, ease.linear)
			o(target.style.transform).equals("translateX(12px) translateY(8px)")
		})

		o("translateY", function () {
			const target = newTarget()

			let m = transform(TransformEnum.TranslateY, 0, 120)

			client.device = DeviceType.DESKTOP
			m.updateDom(target, 0 / 200, ease.linear)
			o(target.style.transform).equals("translateY(0px)")

			m.updateDom(target, 20 / 200, ease.linear)
			o(target.style.transform).equals("translateY(12px)")
		})

		o("force gpu on mobile devices (not on desktop)", function () {
			const target = newTarget()

			let m = transform(TransformEnum.TranslateX, 0, 120)

			client.device = DeviceType.DESKTOP
			m.updateDom(target, 0 / 200, ease.linear)
			o(target.style.transform).equals("translateX(0px)")

			client.device = DeviceType.OTHER_MOBILE
			m.updateDom(target, 0 / 200, ease.linear)
			o(target.style.transform).equals("translateX(0px)")
		})

		o("rotate", function () {
			const target = newTarget()

			let m = transform(TransformEnum.RotateY, 0, 120)

			client.device = DeviceType.DESKTOP
			m.updateDom(target, 0 / 200, ease.linear)
			o(target.style.transform).equals("rotateY(0deg)")

			m.updateDom(target, 20 / 200, ease.linear)
			o(target.style.transform).equals("rotateY(12deg)")
		})
	})

	o.spec("Alpha", function () {
		o("background-color", function () {
			const target = newTarget()

			let m = alpha(AlphaEnum.BackgroundColor, "#000000", 0, 1)

			client.device = DeviceType.DESKTOP
			m.updateDom(target, 0 / 200, ease.linear)
			o(target.style.backgroundColor).equals("rgba(0, 0, 0, 0)")

			m.updateDom(target, 100 / 200, ease.linear)
			o(target.style.backgroundColor).equals("rgba(0, 0, 0, 0.5)")

			m.updateDom(target, 200 / 200, ease.linear)

			browser(() => {
				o(target.style.backgroundColor).equals("rgba(0, 0, 0)")
			})
			node(() => {
				o(target.style.backgroundColor).equals("rgba(0, 0, 0, 1)")
			})
		})

		o("color", function () {
			const target = newTarget()

			let m = alpha(AlphaEnum.Color, "#ffffff", 0, 1)

			client.device = DeviceType.DESKTOP
			m.updateDom(target, 0 / 200, ease.linear)
			o(target.style.color).equals("rgba(255, 255, 255, 0)")

			m.updateDom(target, 100 / 200, ease.linear)
			o(target.style.color).equals("rgba(255, 255, 255, 0.5)")

			m.updateDom(target, 200 / 200, ease.linear)

			browser(() => {
				o(target.style.color).equals("rgba(255, 255, 255)")
			})
			node(() => {
				o(target.style.color).equals("rgba(255, 255, 255, 1)")
			})
		})
	})
})
