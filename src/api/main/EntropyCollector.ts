/// <reference lib="dom" /> // fixes MouseEvent conflict with react
import { assertMainOrNode } from "../common/Env"
import type { EntropySource } from "@tutao/tutanota-crypto"
import type { EntropyDataChunk, EntropyFacade } from "../worker/facades/EntropyFacade.js"
import { Scheduler } from "../common/utils/Scheduler.js"

assertMainOrNode()

export type EntropyCallback = (data: number, entropy: number, source: EntropySource) => unknown

/**
 * Automatically collects entropy from various events and sends it to the randomizer in the worker regularly.
 */
export class EntropyCollector {
	// accessible from test case
	static readonly SEND_INTERVAL: number = 5000

	private stopped: boolean = true
	// the entropy is cached and transmitted to the worker in defined intervals
	private entropyCache: EntropyDataChunk[] = []

	constructor(private readonly entropyFacade: EntropyFacade, private readonly scheduler: Scheduler, private readonly window: Window) {}

	private mouse = (e: MouseEvent) => {
		const value = e.clientX ^ e.clientY

		this.addEntropy(value, 2, "mouse")
	}

	private keyDown = (e: KeyboardEvent) => {
		const value = e.keyCode

		this.addEntropy(value, 2, "key")
	}

	private touch = (e: TouchEvent) => {
		const value = e.touches[0].clientX ^ e.touches[0].clientY

		this.addEntropy(value, 2, "touch")
	}

	private accelerometer = (e: any) => {
		// DeviceMotionEvent but it's typed in a very annoying way
		if (this.window.orientation && typeof this.window.orientation === "number") {
			this.addEntropy(this.window.orientation, 0, "accel")
		}

		if (e.accelerationIncludingGravity) {
			this.addEntropy(e.accelerationIncludingGravity.x ^ e.accelerationIncludingGravity.y ^ e.accelerationIncludingGravity.z, 2, "accel")
		}
	}

	/**
	 * Adds entropy to the random number generator algorithm
	 * @param data Any number value.
	 * @param entropy The amount of entropy in the number in bit.
	 * @param source The source of the number. One of RandomizerInterface.ENTROPY_SRC_*.
	 */
	private addEntropy(data: number, entropy: number, source: EntropySource) {
		if (data) {
			this.entropyCache.push({
				source: source,
				entropy: entropy,
				data: data,
			})
		}

		if (this.window.performance && typeof window.performance.now === "function") {
			this.entropyCache.push({
				source: "time",
				entropy: 2,
				data: this.window.performance.now(),
			})
		} else {
			this.entropyCache.push({
				source: "time",
				entropy: 2,
				data: new Date().valueOf(),
			})
		}
	}

	start() {
		this.addPerformanceTimingValues()

		this.window.addEventListener("mousemove", this.mouse)
		this.window.addEventListener("click", this.mouse)
		this.window.addEventListener("touchstart", this.touch)
		this.window.addEventListener("touchmove", this.touch)
		this.window.addEventListener("keydown", this.keyDown)
		this.window.addEventListener("devicemotion", this.accelerometer)

		this.scheduler.schedulePeriodic(() => this.sendEntropyToWorker(), EntropyCollector.SEND_INTERVAL)
		this.stopped = false
	}

	private addPerformanceTimingValues() {
		if (this.window.performance?.timing) {
			// get values from window.performance.timing
			let values: any = window.performance.timing
			let added: number[] = []

			for (let v in values) {
				if (typeof values[v] === "number" && values[v] !== 0) {
					if (added.indexOf(values[v]) === -1) {
						this.addEntropy(values[v], 1, "static")

						added.push(values[v])
					}
				}
			}
		}
	}

	/**
	 * Add data from secure random source as entropy.
	 */
	private addNativeRandomValues(nbrOf32BitValues: number) {
		let valueList = new Uint32Array(nbrOf32BitValues)
		this.window.crypto.getRandomValues(valueList)

		for (let i = 0; i < valueList.length; i++) {
			// 32 because we have 32-bit values Uint32Array
			this.addEntropy(valueList[i], 32, "random")
		}
	}

	private sendEntropyToWorker() {
		if (this.entropyCache.length > 0) {
			this.addNativeRandomValues(1)

			this.entropyFacade.addEntropy(this.entropyCache)

			this.entropyCache = []
		}
	}

	stop() {
		this.stopped = true
		this.window.removeEventListener("mousemove", this.mouse)
		this.window.removeEventListener("mouseclick", this.mouse)
		this.window.removeEventListener("touchstart", this.touch)
		this.window.removeEventListener("touchmove", this.touch)
		this.window.removeEventListener("keydown", this.keyDown)
		this.window.removeEventListener("devicemotion", this.accelerometer)
	}
}
