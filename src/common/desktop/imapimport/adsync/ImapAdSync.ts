import { AdSyncEventListener, AdSyncEventType } from "./AdSyncEventListener.js"
import { ImapSyncSession } from "./ImapSyncSession.js"
import { ImapSyncState } from "./ImapSyncState.js"

const defaultAdSyncConfig: AdSyncConfig = {
	isEnableParallelProcessesOptimizer: true,
	parallelProcessesOptimizationDifference: 2,
	processesTimeToLive: 15,
	isEnableDownloadBatchSizeOptimizer: true,
	downloadBatchSizeOptimizationDifference: 100,
	defaultDownloadBatchSize: 500,
	optimizationInterval: 10,
	emitAdSyncEventTypes: new Set<AdSyncEventType>([AdSyncEventType.CREATE, AdSyncEventType.UPDATE, AdSyncEventType.DELETE]),
	isEnableImapQresync: true,
}

export interface AdSyncConfig {
	isEnableParallelProcessesOptimizer: boolean
	parallelProcessesOptimizationDifference: number
	processesTimeToLive: number
	isEnableDownloadBatchSizeOptimizer: boolean
	downloadBatchSizeOptimizationDifference: number
	defaultDownloadBatchSize: number
	optimizationInterval: number
	emitAdSyncEventTypes: Set<AdSyncEventType>
	isEnableImapQresync: boolean
}

export class ImapAdSync {
	private syncSession: ImapSyncSession

	constructor(adSyncEventListener: AdSyncEventListener, adSyncConfig: AdSyncConfig = defaultAdSyncConfig) {
		this.syncSession = new ImapSyncSession(adSyncEventListener, adSyncConfig)
	}

	async startAdSync(imapSyncState: ImapSyncState): Promise<void> {
		return this.syncSession.startSyncSession(imapSyncState)
	}

	async stopAdSync(): Promise<void> {
		return this.syncSession.stopSyncSession()
	}
}
