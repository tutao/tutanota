export let _isWorker: boolean = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope
export let _isNode: boolean = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node !== "undefined"

export function indexedDbIsSupported(): boolean {
	try {
		return window.indexedDB != null
	} catch (e) {
		return false
	}
}

export function hasTouchEvent(): boolean {
	return window.TouchEvent != null
}
