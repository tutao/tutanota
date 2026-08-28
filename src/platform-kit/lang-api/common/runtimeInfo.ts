import { isNotNull } from "./functional"
import { Nullable } from "./types"

export class RuntimeInfo {
	public static readonly _isWorker: boolean = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope
	public static readonly _isNode: boolean =
		typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node !== "undefined"

	public static indexedDbIsSupported(): boolean {
		try {
			return isNotNull(window.indexedDB)
		} catch (e) {
			return false
		}
	}

	public static hasTouchEvent(): boolean {
		return isNotNull(window.TouchEvent)
	}

	public static globallyDefinedEnv<E>(): Nullable<E> {
		return null as E
	}
}
