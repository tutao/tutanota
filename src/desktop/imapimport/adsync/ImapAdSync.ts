import { AdSyncEventListener } from "./AdSyncEventListener.js"
import { ImapSyncSession } from "./ImapSyncSession.js"
import { ImapSyncState } from "./ImapSyncState.js"

const defaultAdSyncConfig: AdSyncConfig = {
	isEnableParallelProcessesOptimizer: true,
	isEnableDownloadBatchSizeOptimizer: true,
	parallelProcessesOptimizationDifference: 2,
	downloadBatchSizeOptimizationDifference: 100,
	isEnableImapQresync: false,
}

export interface AdSyncConfig {
	isEnableParallelProcessesOptimizer: boolean
	isEnableDownloadBatchSizeOptimizer: boolean
	parallelProcessesOptimizationDifference: number
	downloadBatchSizeOptimizationDifference: number
	isEnableImapQresync: boolean
}

// TODO evaluation
// const impap_conf = JSON.parse(process.env["IMAP_IMPORT_SETTINGS"])
// impap_conf.value === 3

export class ImapAdSync {
	private syncSession: ImapSyncSession

	constructor(adSyncEventListener: AdSyncEventListener, adSyncConfig: AdSyncConfig = defaultAdSyncConfig) {
		this.syncSession = new ImapSyncSession(adSyncEventListener, adSyncConfig)
	}

	async startAdSync(imapSyncState: ImapSyncState, isIncludeMailUpdates: boolean = true): Promise<void> {
		return this.syncSession.startSyncSession(imapSyncState, isIncludeMailUpdates)
	}

	async stopAdSync(): Promise<void> {
		return this.syncSession.stopSyncSession()
	}
}
