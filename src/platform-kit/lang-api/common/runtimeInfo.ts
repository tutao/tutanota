import { isNotNull } from "./functional"
import { TypeChecks } from "./types/utility"

export class RuntimeInfo {
	public static readonly _isWorker: boolean = TypeChecks.isObject(globalThis.WorkerGlobalScope) && self instanceof WorkerGlobalScope
	public static readonly _isNode: boolean =
		TypeChecks.isObject(globalThis.process) && TypeChecks.isObject(globalThis.process.versions) && TypeChecks.isObject(globalThis.process.versions.node)

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
}
