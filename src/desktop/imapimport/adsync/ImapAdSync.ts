import { AdSyncEventListener, AdSyncEventType } from "./AdSyncEventListener.js"
import { ImapSyncSession } from "./ImapSyncSession.js"
import { ImapSyncState } from "./ImapSyncState.js"

const defaultAdSyncConfig: AdSyncConfig = {
	isEnableParallelProcessesOptimizer: true,
	isEnableDownloadBatchSizeOptimizer: true,
	parallelProcessesOptimizationDifference: 2,
	downloadBatchSizeOptimizationDifference: 100,
	emitAdSyncEventTypes: new Set<AdSyncEventType>([AdSyncEventType.CREATE, AdSyncEventType.UPDATE, AdSyncEventType.DELETE]),
	isEnableImapQresync: true,
}

export interface AdSyncConfig {
	isEnableParallelProcessesOptimizer: boolean
	isEnableDownloadBatchSizeOptimizer: boolean
	parallelProcessesOptimizationDifference: number
	downloadBatchSizeOptimizationDifference: number
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
