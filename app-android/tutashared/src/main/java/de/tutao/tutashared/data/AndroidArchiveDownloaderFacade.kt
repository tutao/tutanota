package de.tutao.tutashared.data

import android.util.Log
import de.tutao.tutashared.CancelledError
import de.tutao.tutashared.NetworkUtils.Companion.defaultClient
import de.tutao.tutashared.ipc.ArchiveDownloaderFacade
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.SqlCipherFacade
import de.tutao.tutashared.offline.TaggedSqlValue
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.Request
import java.io.IOException
import java.io.Reader
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import kotlin.time.TimeSource

class AndroidArchiveDownloaderFacade (
	private val sqlCipherFacade: SqlCipherFacade
): ArchiveDownloaderFacade {

	private val activeRequests = ConcurrentHashMap<String, Call>()
	private val storageForArchive = ConcurrentHashMap<String, ArchiveStorageHelper>()

	override suspend fun downloadAndStoreArchive(
		sourceUrl: String,
		archiveId: String,
		typeref: String,
		modelVersion: Long
	) {
		// Create a new child coroutine scope so that if the request fails it cancels our progress job as well
		// Also if the whole operation is canceled the child scope also gets canceled
		return coroutineScope {
			// Start the network request with IO context (on IO thread pool)
			withContext(Dispatchers.IO) {
				Log.d(TAG, "Downloading archive with id $archiveId")
				val requestBuilder = Request.Builder()
					.url(sourceUrl)
					.method("GET", null)
					.header("Accept", "text/csv;charset=utf-8")
					.header("Content-Type", "application/json")
					.header("Cache-Control", "no-cache")

				val call = defaultClient.newBuilder()
					.connectTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.writeTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.readTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.build()
					.newCall(requestBuilder.build())
				try {
					val response = call.execute()
					activeRequests[archiveId] = call

					// By this point we got the response header but we might not have read the body yet.
					response.use { response ->
						if (response.code == 200) {
							storeBytes(response.body.charStream(), archiveId, typeref, modelVersion)
						} else {
							Log.d(TAG, "Received status code ${response.code} when trying to download archive with id $archiveId, aborting.")
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
			Log.d(TAG, "Aborted storing archive with id $archiveId")
		}
	}

	override suspend fun clearStoredArchives(typeref: String) {
		sqlCipherFacade.run("DELETE FROM encrypted_blobs WHERE typeref = ?", typeref)
		sqlCipherFacade.run("DELETE FROM fully_persisted_mail_details_archives", listOf())
	}

	private suspend fun cleanState(archiveId: String) {
		activeRequests.remove(archiveId)
		// delete saved blobs of not fully stored archive & close storage
		storageForArchive[archiveId]?.flushAndClose()
		storageForArchive.remove(archiveId)
		Log.d(TAG, "Cleaned up state of archive with id $archiveId, kept the blobs.")
	}

	private suspend fun storeBytes(reader: Reader, archiveId: String, typeref: String, modelVersion: Long) {
		Log.d(TAG, "Started storing archive with id $archiveId")

		val startTime = TimeSource.Monotonic.markNow()
		val storage = ArchiveStorageHelper(archiveId, typeref, modelVersion, sqlCipherFacade)
		storageForArchive[archiveId] = storage

		reader.useLines { lines ->
			val iterator = lines.iterator()

			// skip first line (it's the CSV header and always equal to "id;instance")
			// when the header changes, we probably want to actually parse this
			iterator.next()
			while (iterator.hasNext() && activeRequests.containsKey(archiveId)) {
				val (blobId, json) = iterator.next().split(";", limit = 2)
				storage.storeBlob(blobId, json.toByteArray(Charsets.UTF_8))
			}
		}
		// fully read & stored archive -> store that information as well
		storage.success()
		// exit and cleanup map
		cleanState(archiveId)

		val timeToStore = TimeSource.Monotonic.markNow().minus(startTime).inWholeMilliseconds
		Log.d(TAG, "Finished storing archive with id $archiveId (took $timeToStore ms)")
	}

	private companion object {
		const val TAG = "ArchiveDownloaderFacade"
		const val HTTP_TIMEOUT = 15L
	}

	private class ArchiveStorageHelper(
		_archiveId: String,
		_typeref: String,
		_modelVersion: Long,
		private val sqlCipherFacade: SqlCipherFacade
	) {

		private val archiveId = TaggedSqlValue.Str(_archiveId)
		private val typeref = TaggedSqlValue.Str(_typeref)
		private val modelVersion = TaggedSqlValue.Num(_modelVersion)

		// store when 4 mb of data reached (see companion object)
		private var unstoredBytes = 0
		private val blobs = mutableListOf<StoreBlob>()
		private var closed = false

		suspend fun storeBlob(blobId: String, bytesToStore: ByteArray) {
			if (closed) return

			blobs.add(StoreBlob(blobId, bytesToStore))
			unstoredBytes += bytesToStore.size

			if (unstoredBytes > CACHE_BUFFER_SIZE) {
				store()
			}
		}

		suspend fun flushAndClose() {
			if (blobs.isNotEmpty()) {
				store()
			}
			closed = true
		}

		suspend fun success() {
			flushAndClose()
			sqlCipherFacade.run(
				"INSERT OR REPLACE INTO fully_persisted_mail_details_archives VALUES (?)",
				listOf(archiveId)
			)
		}

		private suspend fun store() {
			if (!closed) {
				val query = "INSERT OR REPLACE INTO encrypted_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES (?, ?, ?, ?, ?)" + ", (?, ?, ?, ?, ?)".repeat(blobs.size - 1)
				val params = Array(blobs.size) { _ -> 0 }
					.flatMapIndexed { i, _ -> listOf(TaggedSqlValue.Str(blobs[i].blobId), archiveId, TaggedSqlValue.Bytes(DataWrapper(blobs[i].bytesToStore)), typeref, modelVersion) }
				sqlCipherFacade.run(query, params)
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
		val bytesToStore: ByteArray,
	)

}