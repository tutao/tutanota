import o from "ospec/ospec.js"
import {EntropyCollector} from "../../../src/api/main/EntropyCollector"
import {EntropySrc as EntropyType} from "../../../src/api/common/TutanotaConstants"

o.spec("EntropyCollector", function () {

	let collector
	let worker
	o.beforeEach(browser(function () {
		worker = {
			initialized: {
				isFulfilled: () => true
			},
			entropy: o.spy((entropyCache: {source: EntropySrcEnum, entropy: number, data: number}[]) => {
				o(entropyCache.length > 0).equals(true)
			})
		}
		collector = new EntropyCollector(worker)
	}))
	o.afterEach(browser(function () {
		collector.stop()
	}))

	let assertLastTwoCacheEntries = function (previousLen, expectedValue, expectedSource, expectedEntropy) {
		o(collector._entropyCache.length).equals(previousLen + 2)
		if (expectedValue !== null) {
			o(collector._entropyCache[collector._entropyCache.length - 2].data).equals(expectedValue)
		}
		o(collector._entropyCache[collector._entropyCache.length - 2].source).equals(expectedSource)
		o(collector._entropyCache[collector._entropyCache.length - 2].entropy).equals(expectedEntropy)
		o(collector._entropyCache[collector._entropyCache.length - 1].data != 0).equals(true)
		o(collector._entropyCache[collector._entropyCache.length - 1].source).equals(EntropyType.time)
		o(collector._entropyCache[collector._entropyCache.length - 1].entropy).equals(2)
	}

	o("MouseclickNotStarted", browser(() => {
		let evt = new Event("click")
		evt.clientX = 888
		evt.clientY = 777
		document.body.dispatchEvent(evt)
		o(collector._entropyCache.length).equals(0)
	}))

	o("Mouseclick", browser(() => {
		collector.start({
			entropy: () => null
		})
		let len = collector._entropyCache.length
		let evt = new Event("click")
		evt.clientX = 889
		evt.clientY = 777
		window.dispatchEvent(evt)
		assertLastTwoCacheEntries(len, 889 ^ 777, EntropyType.mouse, 2)
	}))

	o("Mousemove", browser(() => {
		collector.start({
			entropy: () => null
		})
		let len = collector._entropyCache.length
		let evt = new Event("mousemove")
		evt.clientX = 123
		evt.clientY = 456
		window.dispatchEvent(evt)
		assertLastTwoCacheEntries(len, 123 ^ 456, EntropyType.mouse, 2)
	}))

	o("Keydown", browser(() => {
		collector.start({
			entropy: () => null
		})
		let len = collector._entropyCache.length
		let evt = new Event("keydown")
		evt.keyCode = 48
		window.dispatchEvent(evt)
		assertLastTwoCacheEntries(len, 48, EntropyType.key, 2)
	}))

	o("Touchstart", browser(() => {
		collector.start({
			entropy: () => null
		})
		let len = collector._entropyCache.length
		let evt = new Event("touchstart")
		evt.touches = [{clientX: 3, clientY: 4}]
		window.dispatchEvent(evt)
		assertLastTwoCacheEntries(len, 3 ^ 4, EntropyType.touch, 2)
	}))

	o("Touchmove", browser(() => {
		collector.start({
			entropy: () => null
		})
		let len = collector._entropyCache.length
		let evt = new Event("touchmove")
		evt.touches = [{clientX: 3, clientY: 5}]
		window.dispatchEvent(evt)
		assertLastTwoCacheEntries(len, 3 ^ 5, EntropyType.touch, 2)
	}))

	o("Devicemotion", browser(() => {
		collector.start({
			entropy: () => null
		})
		let len = collector._entropyCache.length
		let evt = new Event("devicemotion")
		evt.accelerationIncludingGravity = {x: 3, y: 4, z: 5}
		window.dispatchEvent(evt)
		// we assume window.orientation is not set
		assertLastTwoCacheEntries(len, 3 ^ 4 ^ 5, EntropyType.accelerometer, 2)
	}))

	o("Send", browser((done, timeout) => {
		timeout(2000)


		collector.SEND_INTERVAL = 10
		collector.start()
		collector._addEntropy(5, 1, EntropyType.mouse)
		setTimeout(() => {
			o(worker.entropy.callCount).equals(1)
			collector.SEND_INTERVAL = 5000
			done()
		}, 15)
	}))
})


