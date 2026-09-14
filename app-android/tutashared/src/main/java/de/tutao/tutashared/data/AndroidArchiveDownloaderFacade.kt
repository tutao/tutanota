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
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
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
	private val storageForArchive = ConcurrentHashMap<String, StoreArchive>()

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
				val start = TimeSource.Monotonic.markNow()
				for (i in 0..<50) {
					Log.d(TAG, "Started downloading archive with id $archiveId")
				val startDownload = TimeSource.Monotonic.markNow()

				val requestBuilder = Request.Builder()
					.url(sourceUrl)
					.method("GET", null)
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
						val endDownload = TimeSource.Monotonic.markNow()
						val timeToDownload = endDownload.minus(startDownload).inWholeMilliseconds
						Log.d(TAG, "Finished downloading archive with id $archiveId (took $timeToDownload ms)")

						if (response.code == 200) {
							storeBytes(response.body.charStream(), archiveId, typeref, modelVersion)
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
			val end = TimeSource.Monotonic.markNow().minus(start).inWholeMilliseconds
				val av = end.floorDiv(50)
				Log.d(TAG, "Took $end ms ($av ms on average)")
			}
		}

	}

	override suspend fun abortDownloadAndStoreArchive(archiveId: String) {
		if (activeRequests.containsKey(archiveId)) {
			cleanState(archiveId)
			Log.d(TAG, "Aborted storing archive with id $archiveId")
		}
	}

	override suspend fun clearStoredArchives() {
		activeRequests.clear()
		storageForArchive.clear()
		sqlCipherFacade.run("DELETE FROM encrypted_mail_details_blobs", listOf())
		sqlCipherFacade.run("DELETE FROM fully_persisted_mail_details_archives", listOf())
	}

	private suspend fun cleanState(archiveId: String) {
		activeRequests[archiveId]?.cancel()
		activeRequests.remove(archiveId)
		// delete saved blobs of not fully stored archive & close storage
		storageForArchive[archiveId]?.close()
		storageForArchive.remove(archiveId)
		Log.d(TAG, "Cleaned up state of archive download with id $archiveId, kept the blobs.")
	}

	private suspend fun storeBytes(reader: Reader, archiveId: String, typeref: String, modelVersion: Long) {
		Log.d(TAG, "Started storing archive with id $archiveId")
		val startTime = TimeSource.Monotonic.markNow()

		// this seems to be the maximum read
		// when upgrading to minimum API Level 33, we could try and use InputStream#readNBytes

		val storage = StoreArchive(archiveId, typeref, modelVersion, sqlCipherFacade)
		reader.forEachLine { line ->
			if (line == "[" || line == "]") return@forEachLine

			val line = if(line.endsWith(",")) line.slice(0..<(line.length-1)) else line
			val idPosStart = line.indexOf("\"1300\":") + "\"1300\":".length + 1
			val idPosEnd = line.indexOf("]", idPosStart)
			val id = line.slice(idPosStart..<idPosEnd).split(",")[1]
			// "save"
		}

		// fully stored archive -> store that information as well
		// changed is > -1 if abortDownloadAndStore was called
		// storage.success()
		// exit and cleanup map
		// cleanState(archiveId)

		val timeToStore = TimeSource.Monotonic.markNow().minus(startTime).inWholeMilliseconds
		Log.d(TAG, "Finished storing archive with id $archiveId (took $timeToStore ms)")
	}

	private companion object {
		const val TAG = "ArchiveDownloaderFacade"
		const val HTTP_TIMEOUT = 15L
	}

	private class StoreArchive(
		private val archiveId: String,
		private val typeref: String,
		private val modelVersion: Long,
		private val sqlCipherFacade: SqlCipherFacade
	) {
		// store when 8 mb of data reached
		private val BYTE_COUNT_LIMIT = 4 * 1024 * 1024
		private var byteCountCurrent = 0
		private val blobs = mutableListOf<StoreBlob>()
		private var closed = false

		suspend fun storeBlob(blobId: String, bytesToStore: ByteArray) {
			if (closed) return

			blobs.add(StoreBlob(blobId, bytesToStore))
			byteCountCurrent += bytesToStore.size

			if (byteCountCurrent > BYTE_COUNT_LIMIT) {
				store()
				byteCountCurrent = 0
			}
		}

		suspend fun close() {
			if (blobs.isNotEmpty()) {
				store()
			}
			closed = true
		}

		suspend fun success() {
			sqlCipherFacade.run(
				"INSERT OR REPLACE INTO fully_persisted_mail_details_archives VALUES (?)",
				listOf(TaggedSqlValue.Str(archiveId))
			)
		}

		private suspend fun store() {
			Log.d(TAG, "Started storing at least $byteCountCurrent bytes")
			val start = TimeSource.Monotonic.markNow()

			val archiveId = TaggedSqlValue.Str(archiveId)
			val typeref = TaggedSqlValue.Str(typeref)
			val modelVersion = TaggedSqlValue.Num(modelVersion)

			if (!closed) {
				val query = "INSERT OR REPLACE INTO encrypted_mail_details_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES " + "(?, ?, ?, ?, ?), ".repeat(blobs.size - 1) + "(?, ?, ?, ?, ?)"
				val params = List<TaggedSqlValue>(blobs.size * 5) init@{ i ->
					return@init when (i % 5) {
						0 -> TaggedSqlValue.Str(blobs[i/5].blobId)
						1 -> archiveId
						2 -> TaggedSqlValue.Bytes(DataWrapper(blobs[i/5].bytesToStore))
						3 -> typeref
						else -> modelVersion
					}
				}
				sqlCipherFacade.run(query, params)
			}

			byteCountCurrent = 0
			blobs.clear()

			val time = TimeSource.Monotonic.markNow().minus(start).inWholeMilliseconds
			Log.d(TAG, "Finished storing data (took $time ms)")
		}
	}

	private class StoreBlob(
		val blobId: String,
		val bytesToStore: ByteArray,
	)

}