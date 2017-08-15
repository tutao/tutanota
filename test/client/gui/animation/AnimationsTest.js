import o from "ospec/ospec.js"
import {
	animations,
	transform,
	DefaultAnimationTime,
	Animation,
	alpha,
	hexToRgb,
	rgbToHex
} from "../../../../src/gui/animation/Animations"
import {ease} from "../../../../src/gui/animation/Easing"
import {client, DeviceType} from "../../../../src/misc/ClientDetector"

client.device = DeviceType.DESKTOP

o.spec("gui > Animations", function () {
	let originalRequestAnimationFrame = window.requestAnimationFrame
	let originalPerformance = window.performance

	let time
	o.beforeEach(function () {
		animations.activeAnimations = []
		window.performance = {
			now: () => time
		}
	})
	o.after(function () {
		window.requestAnimationFrame = originalRequestAnimationFrame
		window.performance = originalPerformance
	})

	o("animation is created on add with default delay of 0", function () {
		let target = {}

		function mutation() {
		}

		window.requestAnimationFrame = o.spy()

		animations.add([target], mutation)

		o(animations.activeAnimations.length).equals(1)
		o(animations.activeAnimations[0].delay).equals(0)
		o(animations.activeAnimations[0].mutations).deepEquals([mutation])
		o(animations.activeAnimations[0].target).equals(target)
	})

	o("single element animation with delay", function () {
		let target = {}

		function mutation() {
		}

		window.requestAnimationFrame = o.spy()

		animations.add([target], mutation, {delay: 55})

		o(animations.activeAnimations.length).equals(1)
		o(animations.activeAnimations[0].delay).equals(55)
		o(animations.activeAnimations[0].mutations).deepEquals([mutation])
		o(animations.activeAnimations[0].target).equals(target)
	})

	o("adding to an empty queue triggers the animation", function () {
		o(animations.activeAnimations).deepEquals([])
		let target = {}

		function mutation() {
		}

		window.requestAnimationFrame = o.spy()
		animations.add([target], mutation)

		o(window.requestAnimationFrame.args).deepEquals([animations._animate])
	})
	o("adding to a non empty queue does not trigger multiple animation frame requests", function () {
		o(animations.activeAnimations).deepEquals([])
		let target = {}

		function mutation() {
		}

		window.requestAnimationFrame = o.spy()
		animations.add([target], mutation)
		animations.add([target], mutation)
		o(window.requestAnimationFrame.callCount).equals(1)
	})

	o("unfinished animations are invoked and a new animation frame is requested", function () {
		time = 5
		let animation = {
			animateFrame: o.spy(),
			isFinished: o.spy(),
			resolve: o.spy()
		}
		animations.activeAnimations = [animation]

		window.requestAnimationFrame = o.spy()

		animations._animate()

		o(animation.animateFrame.args).deepEquals([time])
		o(animations.activeAnimations).deepEquals([animation])
		o(window.requestAnimationFrame.args).deepEquals([animations._animate])
	})

	o("finished animations are removed from the queue and resolved", function () {
		let animation = {
			animateFrame: o.spy(),
			isFinished: () => true,
			resolve: o.spy()
		}
		animations.activeAnimations = [animation]

		window.requestAnimationFrame = o.spy()

		animations._animate()

		o(animation.animateFrame.callCount).equals(1)
		o(animations.activeAnimations).deepEquals([])

		o(window.requestAnimationFrame.callCount).equals(0)
	})

	o("stagger", function () {
		var targets = [{style: {transform: ''}}, {style: {transform: ''}}, {style: {transform: ''}}]
		let mutation = {
			updateDom: () => {
			},
		}
		window.requestAnimationFrame = o.spy()

		let promise = animations.add(targets, mutation, {stagger: 55})

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
		animations.activeAnimations[0].delay = null
		animations.activeAnimations[1].delay = null
		animations.activeAnimations[2].delay = null
		animations.activeAnimations[2].resolve = null
		o(JSON.stringify(animations.activeAnimations[0])).deepEquals(JSON.stringify(animations.activeAnimations[1]))
		o(JSON.stringify(animations.activeAnimations[1])).deepEquals(JSON.stringify(animations.activeAnimations[2]))
	})
})

o.spec("gui > Animation", function () {

	o("start and finish", function () {
		let target = {}
		let mutation = {updateDom: o.spy()}
		let resolve = o.spy()
		let a = new Animation(target, [mutation], resolve, 0)

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
		let target = {}
		let mutation = {updateDom: o.spy()}
		let resolve = o.spy()
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
		o(mutation.updateDom.args).deepEquals([target, a.runTime / a.duration, ease.linear])

		a.animateFrame(250)
		o(a.animationStart).equals(0)
		o(a.runTime).equals(100)
		o(a.isFinished()).equals(false)
		o(mutation.updateDom.callCount).equals(2)
		o(mutation.updateDom.args).deepEquals([target, a.runTime / a.duration, ease.linear])

		a.animateFrame(350)
		o(a.animationStart).equals(0)
		o(a.runTime).equals(200)
		o(a.isFinished()).equals(true)
		o(mutation.updateDom.callCount).equals(3)
		o(mutation.updateDom.args).deepEquals([target, a.runTime / a.duration, ease.linear])
	})
})

o.spec("gui > transform dom updates", function () {

	o("translateX with constant y", function () {
		var target = {style: {transform: ''}}

		let m = transform(transform.type.translateX, 0, 120).chain(transform.type.translateY, 8, 8)

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
		o(target.style.transform).equals("translateX(12px) translateY(8px) translate3d(0,0,0)")
	})

	o("translateY", function () {
		var target = {style: {transform: ''}}

		let m = transform(transform.type.translateY, 0, 120, {})

		client.device = DeviceType.DESKTOP
		m.updateDom(target, 0 / 200, ease.linear)
		o(target.style.transform).equals("translateY(0px)")

		m.updateDom(target, 20 / 200, ease.linear)
		o(target.style.transform).equals("translateY(12px)")
	})

	o("force gpu on mobile devices (not on desktop)", function () {
		var target = {style: {transform: ''}}

		let m = transform(transform.type.translateX, 0, 120, {})

		client.device = DeviceType.DESKTOP
		m.updateDom(target, 0 / 200, ease.linear)
		o(target.style.transform).equals("translateX(0px)")

		client.device = DeviceType.OTHER_MOBILE
		m.updateDom(target, 0 / 200, ease.linear)
		o(target.style.transform).equals("translateX(0px) translate3d(0,0,0)")
	})

	o("rotate", function () {
		var target = {style: {transform: ''}}

		let m = transform(transform.type.rotateY, 0, 120, {})

		client.device = DeviceType.DESKTOP
		m.updateDom(target, 0 / 200, ease.linear)
		o(target.style.transform).equals("rotateY(0deg)")

		m.updateDom(target, 20 / 200, ease.linear)
		o(target.style.transform).equals("rotateY(12deg)")
	})
})

o.spec("gui > Alpha", function () {
	o("hexToRGB and rgbToHex", function () {
		o(hexToRgb('#b73a9a')).deepEquals({r: 183, g: 58, b: 154})
		o(rgbToHex({r: 183, g: 58, b: 154})).deepEquals('#b73a9a')
	})

	o("background-color", function () {
		var target = {style: {backgroundColor: ''}}

		let m = alpha(alpha.type.backgroundColor, '#000000', 0, 1)

		client.device = DeviceType.DESKTOP
		m.updateDom(target, 0 / 200, ease.linear)
		o(target.style.backgroundColor).equals("rgba(0, 0, 0, 0)")

		m.updateDom(target, 100 / 200, ease.linear)
		o(target.style.backgroundColor).equals("rgba(0, 0, 0, 0.5)")

		m.updateDom(target, 200 / 200, ease.linear)
		o(target.style.backgroundColor).equals("rgba(0, 0, 0, 1)")
	})

	o("color", function () {
		var target = {style: {color: ''}}

		let m = alpha(alpha.type.color, '#ffffff', 0, 1)

		client.device = DeviceType.DESKTOP
		m.updateDom(target, 0 / 200, ease.linear)
		o(target.style.color).equals("rgba(255, 255, 255, 0)")

		m.updateDom(target, 100 / 200, ease.linear)
		o(target.style.color).equals("rgba(255, 255, 255, 0.5)")

		m.updateDom(target, 200 / 200, ease.linear)
		o(target.style.color).equals("rgba(255, 255, 255, 1)")
	})
})
