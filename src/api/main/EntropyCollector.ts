/// <reference lib="dom" /> // fixes MouseEvent conflict with react
import { assertMainOrNode } from "../common/Env"
import type { EntropySource } from "@tutao/tutanota-crypto"
import type { EntropyDataChunk, EntropyFacade } from "../worker/facades/EntropyFacade.js"

assertMainOrNode()

/**
 * Automatically collects entropy from various events and sends it to the randomizer in the worker regularly.
 */
export class EntropyCollector {
	private stopped: boolean = true
	// the entropy is cached and transmitted to the worker in defined intervals
	private entropyCache: EntropyDataChunk[] = []

	// accessible from test case
	readonly SEND_INTERVAL: number = 5000

	constructor(private readonly entropyFacade: EntropyFacade) {}

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
		if (window.orientation && typeof window.orientation === "number") {
			this.addEntropy(window.orientation, 0, "accel")
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

		if (typeof window !== "undefined" && window.performance && typeof window.performance.now === "function") {
			this.entropyCache.push({
				source: "time",
				entropy: 2,
				data: window.performance.now(),
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
		if (window.performance && window.performance.timing) {
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

		window.addEventListener("mousemove", this.mouse)
		window.addEventListener("click", this.mouse)
		window.addEventListener("touchstart", this.touch)
		window.addEventListener("touchmove", this.touch)
		window.addEventListener("keydown", this.keyDown)
		window.addEventListener("devicemotion", this.accelerometer)
		setInterval(() => this.sendEntropyToWorker(), this.SEND_INTERVAL)
		this.stopped = false
	}

	/**
	 * Add data from either secure random source or Math.random as entropy.
	 */
	private addNativeRandomValues(nbrOf32BitValues: number) {
		let valueList = new Uint32Array(nbrOf32BitValues)
		crypto.getRandomValues(valueList)

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
		window.removeEventListener("mousemove", this.mouse)
		window.removeEventListener("mouseclick", this.mouse)
		window.removeEventListener("touchstart", this.touch)
		window.removeEventListener("touchmove", this.touch)
		window.removeEventListener("keydown", this.keyDown)
		window.removeEventListener("devicemotion", this.accelerometer)
	}
}
