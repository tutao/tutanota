/// <reference lib="dom" /> // fixes MouseEvent conflict with react
import type {WorkerClient} from "./WorkerClient"
import {assertMainOrNode} from "../common/Env"
import type {EntropySource} from "@tutao/tutanota-crypto"

assertMainOrNode()

/**
 * Automatically collects entropy from various events and sends it to the randomizer in the worker regularly.
 */
export class EntropyCollector {
	stopped: boolean
	_mouse: (...args: Array<any>) => any
	_touch: (...args: Array<any>) => any
	_keyDown: (...args: Array<any>) => any
	_accelerometer: (...args: Array<any>) => any
	_worker: WorkerClient
	// the entropy is cached and transmitted to the worker in defined intervals
	_entropyCache: {
		source: EntropySource
		entropy: number
		data: number
	}[]
	// accessible from test case
	SEND_INTERVAL: number

	constructor(worker: WorkerClient) {
		this._worker = worker
		this.SEND_INTERVAL = 5000
		this.stopped = true
		this._entropyCache = []

		this._mouse = (e: MouseEvent) => {
			let value = e.clientX ^ e.clientY

			this._addEntropy(value, 2, "mouse")
		}

		this._keyDown = (e: KeyboardEvent) => {
			let value = e.keyCode

			this._addEntropy(value, 2, "key")
		}

		this._touch = (e: TouchEvent) => {
			let value = e.touches[0].clientX ^ e.touches[0].clientY

			this._addEntropy(value, 2, "touch")
		}

		this._accelerometer = (e: any) => {
			// DeviceMotionEvent
			if (window.orientation && typeof window.orientation === "number") {
				this._addEntropy(window.orientation, 0, "accel")
			}

			if (e.accelerationIncludingGravity) {
				this._addEntropy(e.accelerationIncludingGravity.x ^ e.accelerationIncludingGravity.y ^ e.accelerationIncludingGravity.z, 2, "accel")
			}
		}
	}

	/**
	 * Adds entropy to the random number generator algorithm
	 * @param number Any number value.
	 * @param entropy The amount of entropy in the number in bit.
	 * @param source The source of the number. One of RandomizerInterface.ENTROPY_SRC_*.
	 */
	_addEntropy(data: number, entropy: number, source: EntropySource) {
		if (data) {
			this._entropyCache.push({
				source: source,
				entropy: entropy,
				data: data,
			})
		}

		if (typeof window !== "undefined" && window.performance && typeof window.performance.now === "function") {
			this._entropyCache.push({
				source: "time",
				entropy: 2,
				data: window.performance.now(),
			})
		} else {
			this._entropyCache.push({
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
						this._addEntropy(values[v], 1, "static")

						added.push(values[v])
					}
				}
			}
		}

		window.addEventListener("mousemove", this._mouse)
		window.addEventListener("click", this._mouse)
		window.addEventListener("touchstart", this._touch)
		window.addEventListener("touchmove", this._touch)
		window.addEventListener("keydown", this._keyDown)
		window.addEventListener("devicemotion", this._accelerometer)
		setInterval(() => this._sendEntropyToWorker(), this.SEND_INTERVAL)
		this.stopped = false
	}

	/**
	 * Add data from either secure random source or Math.random as entropy.
	 */
	_addNativeRandomValues(nbrOf32BitValues: number) {
		let valueList = new Uint32Array(nbrOf32BitValues)
		crypto.getRandomValues(valueList)

		for (let i = 0; i < valueList.length; i++) {
			// 32 because we have 32-bit values Uint32Array
			this._addEntropy(valueList[i], 32, "random")
		}
	}

	_sendEntropyToWorker() {
		if (this._entropyCache.length > 0) {
			this._addNativeRandomValues(1)

			this._worker.entropy(this._entropyCache)

			this._entropyCache = []
		}
	}

	stop() {
		this.stopped = true
		window.removeEventListener("mousemove", this._mouse)
		window.removeEventListener("mouseclick", this._mouse)
		window.removeEventListener("touchstart", this._touch)
		window.removeEventListener("touchmove", this._touch)
		window.removeEventListener("keydown", this._keyDown)
		window.removeEventListener("devicemotion", this._accelerometer)
	}
}