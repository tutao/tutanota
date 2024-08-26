import o from "@tutao/otest"
import { EntropyCollector } from "../../../../src/common/api/main/EntropyCollector.js"
import { EntropyDataChunk, EntropyFacade } from "../../../../src/common/api/worker/facades/EntropyFacade.js"
import { matchers, object, when } from "testdouble"
import { SchedulerMock } from "../../TestUtils.js"
import { getFromMap, remove } from "@tutao/tutanota-utils"

class FakeWindow {
	listeners: Map<string, ((e: unknown) => unknown)[]> = new Map()

	addEventListener: (typeof Window.prototype)["addEventListener"] = (event, listener) => {
		this.getListeners(event).push(listener)
	}

	private getListeners(event: string) {
		return getFromMap(this.listeners, event, () => [])
	}

	removeEventListener: (typeof Window.prototype)["removeEventListener"] = (event, listener) => {
		remove(this.getListeners(event), listener)
	}

	dispatch<E extends keyof WindowEventMap>(name: E, event: Partial<WindowEventMap[E]>) {
		for (let listener of this.getListeners(name)) {
			listener(event)
		}
	}

	crypto: Partial<(typeof Window.prototype)["crypto"]> = {
		getRandomValues<T extends ArrayBufferView | null>(array: T): T {
			if (array) {
				array[0] = 32
			}
			return array
		},
	}

	performance = {
		now: () => 3,
		getEntries: () => [],
	}

	screen = {
		orientation: {
			angle: 90,
		},
	}
}

// this test is an ancient horror, please rewrite it so that it doesn't pull every internal string in the entropy collector
o.spec("EntropyCollector", function () {
	let collector: EntropyCollector
	let entropyFacade: EntropyFacade
	let scheduler: SchedulerMock
	let addedEntropy: EntropyDataChunk[][]
	let fakeWindow: FakeWindow

	const TIME_ENTROPY = { source: "time", entropy: 2, data: 3 } as const
	const RANDOM_ENTROPY = { source: "random", entropy: 32, data: 32 } as const
	const ENTROPY_SUFFIX = [
		TIME_ENTROPY,
		RANDOM_ENTROPY,
		// together with random values
		TIME_ENTROPY,
	] as const

	o.beforeEach(function () {
		entropyFacade = object()
		addedEntropy = []
		when(entropyFacade.addEntropy(matchers.anything())).thenDo((e) => addedEntropy.push(e))
		scheduler = new SchedulerMock()
		fakeWindow = new FakeWindow()
		collector = new EntropyCollector(entropyFacade, scheduler, fakeWindow as unknown as Window)
	})

	o.afterEach(function () {
		collector.stop()
	})

	function runInterval() {
		scheduler.scheduledPeriodic.get(EntropyCollector.SEND_INTERVAL)!.thunk()
	}

	o("when collector is not started click is collected", function () {
		fakeWindow.dispatch("click", {
			clientX: 888,
			clientY: 777,
		})

		o(scheduler.scheduledPeriodic.get(EntropyCollector.SEND_INTERVAL)).equals(undefined)

		o(addedEntropy).deepEquals([])
	})

	o("when there's nothing in the cache nothing is added", function () {
		collector.start()

		runInterval()

		o(addedEntropy.length).equals(0)("nothing added")
	})

	o("when collector is started click is collected", function () {
		collector.start()
		fakeWindow.dispatch("click", {
			clientX: 888,
			clientY: 777,
		})

		runInterval()

		o(addedEntropy.length).equals(1)("added entropy")
		o(addedEntropy[0]).deepEquals([
			{
				source: "mouse",
				entropy: 2,
				data: 113,
			},
			...ENTROPY_SUFFIX,
		])
	})

	o("when collector is started all events are collected", function () {
		collector.start()
		fakeWindow.dispatch("click", {
			clientX: 888,
			clientY: 777,
		})
		fakeWindow.dispatch("keydown", {
			key: "W",
		})

		runInterval()

		o(addedEntropy.length).equals(1)("added entropy")
		o(addedEntropy[0].length).equals(6)
	})

	o("when collector is started mousemove is collected", function () {
		collector.start()
		fakeWindow.dispatch("mousemove", {
			clientX: 123,
			clientY: 456,
		})

		runInterval()

		o(addedEntropy.length).equals(1)("added entropy")
		o(addedEntropy[0]).deepEquals([
			{
				source: "mouse",
				entropy: 2,
				data: 435,
			},
			...ENTROPY_SUFFIX,
		])
	})

	o("when collector is started keydown is collected", function () {
		collector.start()
		fakeWindow.dispatch("keydown", {
			key: "0",
		})

		runInterval()

		o(addedEntropy.length).equals(1)("added entropy")
		o(addedEntropy[0]).deepEquals([
			{
				source: "key",
				entropy: 2,
				data: 48,
			},
			...ENTROPY_SUFFIX,
		])
	})

	o("when collector is started touchstart is collected", function () {
		collector.start()
		fakeWindow.dispatch("touchstart", {
			touches: [
				{
					clientX: 3,
					clientY: 4,
				} as Partial<Touch> as Touch,
			] as unknown as TouchList,
		})

		runInterval()

		o(addedEntropy.length).equals(1)("added entropy")
		o(addedEntropy[0]).deepEquals([
			{
				source: "touch",
				entropy: 2,
				data: 7,
			},
			...ENTROPY_SUFFIX,
		])
	})

	o("when collector is started touchmove is collected", function () {
		collector.start()
		fakeWindow.dispatch("touchmove", {
			touches: [
				{
					clientX: 3,
					clientY: 4,
				} as Partial<Touch> as Touch,
			] as unknown as TouchList,
		})

		runInterval()

		o(addedEntropy.length).equals(1)("added entropy")
		o(addedEntropy[0]).deepEquals([
			{
				source: "touch",
				entropy: 2,
				data: 7,
			},
			...ENTROPY_SUFFIX,
		])
	})

	o("when collector is started devicemotion is collected", function () {
		collector.start()
		fakeWindow.dispatch("devicemotion", {
			accelerationIncludingGravity: {
				x: 3,
				y: 4,
				z: 5,
			},
		})

		runInterval()

		o(addedEntropy.length).equals(1)("added entropy")
		o(addedEntropy[0]).deepEquals([
			{ source: "accel", entropy: 2, data: 2 },
			{ source: "time", entropy: 2, data: 3 },
			{ source: "accel", entropy: 0, data: 90 },
			...ENTROPY_SUFFIX,
		])
	})
})
