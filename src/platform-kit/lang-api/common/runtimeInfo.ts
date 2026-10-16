import { assertNotNull, isNotNull } from "./functional"
import { TsJson } from "./types/ecmascript"

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

	public static globallyDefinedEnv(): string {
		// Note:
		// since we do not have access to EnvType here, we cannot return that type
		return TsJson.stringify(assertNotNull(globalThis.env, "Expected env variable to be always there"))
	}
}
