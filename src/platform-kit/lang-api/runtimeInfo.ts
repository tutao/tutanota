import { Nullable } from "./types"

export class RuntimeInfo {
	public static readonly _isWorker: boolean = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope
	public static readonly _isNode: boolean =
		typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node !== "undefined"

	public static indexedDbIsSupported(): boolean {
		try {
			return window.indexedDB != null
		} catch (e) {
			return false
		}
	}

	public static hasTouchEvent(): boolean {
		return window.TouchEvent != null
	}

	public static globallyDefinedEnv<E>(): Nullable<E> {
		return null as E
	}
}
