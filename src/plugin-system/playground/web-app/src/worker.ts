import * as Comlink from "comlink"
import type { WorkerAPI } from "./api.js"

const api: WorkerAPI = {
	counter: 0,

	inc() {
		this.counter++
		console.log(`Worker: ${this.counter}`)
	},
}

Comlink.expose(api)
