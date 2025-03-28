package de.tutao.tutashared.remote

import de.tutao.tutashared.data.AppDatabase

class RemoteStorage(val db: AppDatabase) {
	fun storeRemoteUrl(origin: String) {
		db.keyValueDao().putString(REMOTE_ORIGIN, origin)
	}

	fun getRemoteUrl() = db.keyValueDao().getString(REMOTE_ORIGIN)

	companion object {
		private const val REMOTE_ORIGIN = "remoteOrigin"
	}
}