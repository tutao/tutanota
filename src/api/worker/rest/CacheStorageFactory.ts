import {exposeRemote} from "../../common/WorkerProxy"
import {OfflineStorage} from "./OfflineStorage"
import {uint8ArrayToKey} from "@tutao/tutanota-crypto"
import {ENTITY_EVENT_BATCH_EXPIRE_MS} from "../EventBusClient"
import {OutOfSyncError} from "../../common/error/OutOfSyncError"
import {EphemeralCacheStorage} from "./EphemeralCacheStorage"
import type {WorkerImpl} from "../WorkerImpl"
import type {NativeInterface} from "../../../native/common/NativeInterface"
import {assertWorkerOrNode} from "../../common/Env"
import {CacheStorage} from "./EntityRestCache"
import {WorkerDateProvider} from "../utils/WorkerDateProvider"

assertWorkerOrNode()

interface PersistentStorageArgs {
	persistent: true,

	/** Id of the user for which to open the database */
	userId: Id,
	/** The key that encrypts the sqlcipher db */
	databaseKey: Uint8Array,
}

export type GetStorageArgs = PersistentStorageArgs | {persistent: false}

export class CacheStorageFactory {

	constructor(
		private readonly getServerTime: () => number,
		private readonly worker: WorkerImpl,
		private readonly native: NativeInterface,
	) {
	}

	async getStorage(args: GetStorageArgs): Promise<CacheStorage> {
		if (args.persistent) {
			const {offlineDbFacade} = exposeRemote((request) => this.native.invokeNative(request))
			const offlineStorage = new OfflineStorage(offlineDbFacade, new WorkerDateProvider())
			await offlineStorage.init(args.userId, uint8ArrayToKey(args.databaseKey))

			const lastUpdateTime = await offlineStorage.getLastUpdateTime()
			if (lastUpdateTime != null) {
				const serverTime = this.getServerTime()
				if (serverTime - lastUpdateTime > ENTITY_EVENT_BATCH_EXPIRE_MS) {
					console.log(`Purging database for user ${args.userId} because it is out of sync`)
					await offlineStorage.purgeStorage()
					this.worker.sendError(new OutOfSyncError("database is out of sync"))
				}
			}

			await offlineStorage.clearExcludedData()
			return offlineStorage
		} else {
			return new EphemeralCacheStorage()
		}
	}
}