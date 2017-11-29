// @flow
import type {EntropySrcEnum} from "../common/TutanotaConstants"
import {EntropySrc} from "../common/TutanotaConstants"
import type {WorkerClient} from "./WorkerClient"
import {assertMainOrNode} from "../Env"

assertMainOrNode()

/**
 * Automatically collects entropy from various events and sends it to the randomizer in the worker regularly.
 */
export class EntropyCollector {
	stopped: boolean;
	_mouse: Function;
	_touch: Function;
	_keyDown: Function;
	_accelerometer: Function;
	_worker: WorkerClient;
	// the entropy is cached and transmitted to the worker in defined intervals
	_entropyCache: {source: EntropySrcEnum, entropy: number, data: number}[];

	// accessible from test case
	SEND_INTERVAL: number;

	constructor(worker: WorkerClient) {
		this._worker = worker
		this.SEND_INTERVAL = 5000
		this.stopped = true
		this._entropyCache = []

		this._mouse = (e: MouseEvent) => {
			let value = e.clientX ^ e.clientY
			this._addEntropy(value, 2, EntropySrc.mouse)
		}

		this._keyDown = (e: KeyboardEvent) => {
			let value = e.keyCode
			this._addEntropy(value, 2, EntropySrc.key)
		}

		this._touch = (e: TouchEvent) => {
			let value = e.touches[0].clientX ^ e.touches[0].clientY
			this._addEntropy(value, 2, EntropySrc.touch)
		}

		this._accelerometer = (e: any) => { // DeviceMotionEvent
			let value = e.accelerationIncludingGravity.x ^ e.accelerationIncludingGravity.y ^ e.accelerationIncludingGravity.z
			if (window.orientation && typeof window.orientation === "number") {
				this._addEntropy(window.orientation, 0, EntropySrc.accelerometer)
			}
			this._addEntropy(value, 2, EntropySrc.accelerometer)
		}
	}

	/**
	 * Adds entropy to the random number generator algorithm
	 * @param number Any number value.
	 * @param entropy The amount of entropy in the number in bit.
	 * @param source The source of the number. One of RandomizerInterface.ENTROPY_SRC_*.
	 */
	_addEntropy(data: number, entropy: number, source: EntropySrcEnum) {
		if (data) {
			this._entropyCache.push({source: source, entropy: entropy, data: data})
		}
		if (typeof window !== 'undefined' && window.performance && typeof window.performance.now === "function") {
			this._entropyCache.push({source: EntropySrc.time, entropy: 2, data: window.performance.now()})
		} else {
			this._entropyCache.push({source: EntropySrc.time, entropy: 2, data: (new Date()).valueOf()})
		}
	}

	start() {
		if (window.performance && window.performance.timing) {
			// get values from window.performance.timing
			let values = window.performance.timing
			let added = []
			for (let v in values) {
				if (typeof values[v] == "number" && values[v] != 0) {
					if (added.indexOf(values[v]) === -1) {
						this._addEntropy(values[v], 1, EntropySrc.static)
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

	getInitialEntropy(): {source: EntropySrcEnum, entropy: number, data: number}[] {
		// send initial values to the worker because on windows getRandomValues() is not available in the worker
		this._addNativeRandomValues(16)
		let cache = this._entropyCache
		this._entropyCache = []
		return cache
	}

	/**
	 * Add data from either secure random source or Math.random as entropy.
	 */
	_addNativeRandomValues(nbrOf32BitValues: number) {
		let valueList = new Uint32Array(nbrOf32BitValues)
		let c = typeof crypto != 'undefined' ? crypto : msCrypto
		c.getRandomValues(valueList)
		for (let i = 0; i < valueList.length; i++) {
			this._addEntropy(valueList[i], 32, EntropySrc.random)
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
