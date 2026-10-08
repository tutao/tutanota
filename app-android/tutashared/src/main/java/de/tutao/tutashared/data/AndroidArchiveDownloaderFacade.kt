package de.tutao.tutashared.data

import android.util.Log
import de.tutao.tutashared.CancelledError
import de.tutao.tutashared.NetworkUtils.Companion.defaultClient
import de.tutao.tutashared.ipc.ArchiveDownloadRangeHeaders
import de.tutao.tutashared.ipc.ArchiveDownloaderFacade
import de.tutao.tutashared.ipc.SqlCipherFacade
import de.tutao.tutashared.offline.TaggedSqlValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.Request
import java.io.IOException
import java.io.Reader
import java.net.URL
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import kotlin.time.TimeSource

class AndroidArchiveDownloaderFacade(
	private val sqlCipherFacade: SqlCipherFacade
) : ArchiveDownloaderFacade {

	private val activeRequests = ConcurrentHashMap<String, Call>()
	private val storageForArchive = ConcurrentHashMap<String, ArchiveStorageHelper>()

	override suspend fun downloadAndStoreArchive(
		sourceUrl: String,
		archiveId: String,
		archiveType: String,
		modelVersion: Long,
		rangeHeaders: ArchiveDownloadRangeHeaders?,
	) {
		// Create a new child coroutine scope so that if the request fails it cancels our progress job as well
		// Also if the whole operation is canceled the child scope also gets canceled
		return coroutineScope {
			// Start the network request with IO context (on IO thread pool)
			withContext(Dispatchers.IO) {
				val requestBuilder = Request.Builder()
					.url(sourceUrl)
					.method("GET", null)
					.header("Accept", "text/csv;charset=utf-8")
					.header("Content-Type", "application/json")
					.header("Cache-Control", "no-cache")

				if (rangeHeaders != null) {
					requestBuilder.addHeader("Range", "rows=${rangeHeaders.rangeStart}-")
					requestBuilder.addHeader("Repr-Digest", "sha-256=:${rangeHeaders.reprDigest}:")
				}

				Log.d(TAG, "Downloading archive $archiveId starting from row ${rangeHeaders?.rangeStart ?: 0}")
				val call = defaultClient.newBuilder()
					.connectTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.writeTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.readTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.build()
					.newCall(requestBuilder.build())
				try {
					val response = call.execute()
					activeRequests[archiveId] = call

					// By this point we got the response header, but we might not have read the body yet.
					response.use { response ->
						Log.d(
							TAG,
							"Received status code ${response.code} when downloading archive $archiveId"
						)
						if (response.code == 200 || response.code == 206) {
							if (response.code == 200) {
								Log.d(
									TAG,
									"Clearing cached blobs for archive $archiveId"
								)
								sqlCipherFacade.run(
									"DELETE FROM encrypted_blobs WHERE archiveId = ?",
									listOf(TaggedSqlValue.Str(archiveId))
								)
							}
							storeBytes(
								response.body.charStream(),
								archiveId,
								archiveType,
								modelVersion,
								URL(sourceUrl).host
							)
						}
					}
				} catch (e: IOException) {
					if (call.isCanceled()) {
						throw CancelledError()
					} else {
						throw e
					}
				}
			}
		}

	}

	override suspend fun abortDownloadAndStoreArchive(archiveId: String) {
		if (activeRequests.containsKey(archiveId)) {
			activeRequests[archiveId]?.cancel()
			cleanState(archiveId)
			Log.d(TAG, "Aborted storing archive $archiveId")
		}
	}

	private suspend fun cleanState(archiveId: String) {
		activeRequests.remove(archiveId)
		// delete saved blobs of not fully stored archive & close storage
		storageForArchive[archiveId]?.flushAndClose()
		storageForArchive.remove(archiveId)
		Log.d(TAG, "Cleaned up state of archive $archiveId, kept the blobs.")
	}

	private suspend fun storeBytes(
		reader: Reader,
		archiveId: String,
		archiveType: String,
		modelVersion: Long,
		serverHostname: String
	) {
		Log.d(TAG, "Started storing archive $archiveId")

		val startTime = TimeSource.Monotonic.markNow()
		val storage = ArchiveStorageHelper(archiveId, archiveType, modelVersion, serverHostname, sqlCipherFacade)
		storageForArchive[archiveId] = storage
		storage.init()

		reader.useLines { lines ->
			val iterator = lines.iterator()

			// skip first line (it's the CSV header and always equal to "id;instance")
			// when the header changes, we probably want to actually parse this
			iterator.next()
			while (iterator.hasNext() && activeRequests.containsKey(archiveId)) {
				val (blobId, json) = iterator.next().split(";", limit = 2)
				storage.storeBlob(blobId, json)
			}
		}
		// fully read & stored archive -> store that information as well
		storage.flushAndClose()
		// exit and cleanup map
		cleanState(archiveId)

		val timeToStore = TimeSource.Monotonic.markNow().minus(startTime).inWholeMilliseconds
		Log.d(TAG, "Finished storing archive $archiveId (took $timeToStore ms)")
	}

	private companion object {
		const val TAG = "ArchiveDownloaderFacade"
		const val HTTP_TIMEOUT = 15L
	}

	private class ArchiveStorageHelper(
		_archiveId: String,
		_archiveType: String,
		_modelVersion: Long,
		_serverHostname: String,
		private val sqlCipherFacade: SqlCipherFacade
	) {

		private val archiveId = TaggedSqlValue.Str(_archiveId)
		private val archiveType = TaggedSqlValue.Str(_archiveType)
		private val modelVersion = TaggedSqlValue.Num(_modelVersion)
		private val serverHostname = TaggedSqlValue.Str(_serverHostname)

		// store when 4 mb of data reached (see companion object)
		private var unstoredBytes = 0
		private val blobs = mutableListOf<StoreBlob>()
		private var closed = false

		suspend fun init() {
			sqlCipherFacade.run(
				"INSERT OR REPLACE INTO encrypted_blobs_metadata (archiveId, type, modelVersion, serverHostname) VALUES (?, ?, ?, ?)",
				listOf(archiveId, archiveType, modelVersion, serverHostname)
			)
		}

		suspend fun storeBlob(blobId: String, json: String) {
			if (closed) return

			blobs.add(StoreBlob(blobId, json))
			unstoredBytes += json.length

			if (unstoredBytes > CACHE_BUFFER_SIZE) {
				store()
			}
		}

		suspend fun flushAndClose() {
			store()
			closed = true
		}

		private suspend fun store() {
			if (!closed && blobs.isNotEmpty()) {
				sqlCipherFacade.run(
					"INSERT OR REPLACE INTO encrypted_blobs (type, archiveId, blobId, modelVersion, data) VALUES (?, ?, ?, ?, ?)" + ", (?, ?, ?, ?, ?)"
						.repeat(blobs.size - 1),
					Array(blobs.size) { _ -> 0 }
						.flatMapIndexed { i, _ ->
							listOf(
								archiveType,
								archiveId,
								TaggedSqlValue.Str(blobs[i].blobId),
								modelVersion,
								TaggedSqlValue.Str(blobs[i].json)
							)
						}
				)
			}

			unstoredBytes = 0
			blobs.clear()
		}

		private companion object {
			const val CACHE_BUFFER_SIZE = 2 * 1024 * 1024
		}
	}

	private class StoreBlob(
		val blobId: String,
		val json: String,
	)
}