/* generated file, don't edit. */

import { SqlCipherFacade } from "./SqlCipherFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}

export class SqlCipherFacadeSendDispatcher implements SqlCipherFacade {
	constructor(private readonly transport: NativeInterface) {}

	async emptyTables(...args: Parameters<SqlCipherFacade["emptyTables"]>) {
		console.log("SqlCipherFacadeSendDispatcher - emptyTables", args)
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "emptyTables", ...args])
	}

	async dropTables(...args: Parameters<SqlCipherFacade["dropTables"]>) {
		console.log("SqlCipherFacadeSendDispatcher - dropTables", args)
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "dropTables", ...args])
	}

	async openDb(...args: Parameters<SqlCipherFacade["openDb"]>) {
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "openDb", ...args])
	}

	async closeDb(...args: Parameters<SqlCipherFacade["closeDb"]>) {
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "closeDb", ...args])
	}

	async deleteDb(...args: Parameters<SqlCipherFacade["deleteDb"]>) {
		console.log("SqlCipherFacadeSendDispatcher - deleteDb")
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "deleteDb", ...args])
	}

	async run(...args: Parameters<SqlCipherFacade["run"]>) {
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "run", ...args])
	}

	async get(...args: Parameters<SqlCipherFacade["get"]>) {
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "get", ...args])
	}

	async all(...args: Parameters<SqlCipherFacade["all"]>) {
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "all", ...args])
	}

	async lockRangesDbAccess(...args: Parameters<SqlCipherFacade["lockRangesDbAccess"]>) {
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "lockRangesDbAccess", ...args])
	}

	async unlockRangesDbAccess(...args: Parameters<SqlCipherFacade["unlockRangesDbAccess"]>) {
		return this.transport.invokeNative("ipc", ["SqlCipherFacade", "unlockRangesDbAccess", ...args])
	}
}
