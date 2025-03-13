package de.tutao.tutanota

import android.accounts.Account
import android.app.Service
import android.content.AbstractThreadedSyncAdapter
import android.content.ContentProviderClient
import android.content.Context
import android.content.Intent
import android.content.SyncResult
import android.os.Bundle
import android.os.IBinder
import android.util.Log

private const val TAG = "Sync"

/** A stubbed sync service that returns a stubbed sync adapter on `onBind()`.
 *  It is used to mark Tuta accounts as syncable as a fix for #6568 */
class StubSyncService : Service() {
	override fun onCreate() {
		synchronized(syncAdapterLock) {
			syncAdapter = syncAdapter ?: StubSyncAdapter(applicationContext, true)
		}
	}

	override fun onBind(intent: Intent): IBinder {
		return syncAdapter?.syncAdapterBinder ?: throw IllegalStateException()
	}

	companion object {
		private var syncAdapter: StubSyncAdapter? = null
		private val syncAdapterLock = Any()
	}
}

/** A stubbed sync adapter that does nothing when called. */
private class StubSyncAdapter @JvmOverloads constructor(
	context: Context,
	autoInitialize: Boolean,
	allowParallelSyncs: Boolean = false,
) : AbstractThreadedSyncAdapter(context, autoInitialize, allowParallelSyncs) {

	override fun onPerformSync(
		account: Account,
		extras: Bundle,
		authority: String,
		provider: ContentProviderClient,
		syncResult: SyncResult
	) {
		Log.w(TAG, "Sync requested to stub Sync Adapter!")
	}
}


