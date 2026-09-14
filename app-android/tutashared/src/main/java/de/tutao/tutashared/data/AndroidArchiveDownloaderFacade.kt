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
				//for (i in 0..<50) {

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
			//}
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

	private suspend fun storeBytes(bytes: Reader, archiveId: String, typeref: String, modelVersion: Long) {
		Log.d(TAG, "Started storing archive with id $archiveId")
		// first line is booring
		// while (bytes.read() != '\n'.code) {}


		val startTime = TimeSource.Monotonic.markNow()

		var finishedReadingBlobId = false

		// 8192 bytes seems to be the maximum number of bytes we're allowed to read at once
		val chunk = ByteArray(8192)
		var changed = -1
		var currentBlobIdBytes = ByteArray(0)
		var currentBlobBytes = ByteArray(0)
		var byteInt: Int
		var startAppend = 0

		val storage = StoreArchive(archiveId, typeref, modelVersion, sqlCipherFacade)

		// while we're not cancelled or finished ...
		var start = TimeSource.Monotonic.markNow()
		while (activeRequests.containsKey(archiveId)) {
			if (startAppend <= changed) {
				if (finishedReadingBlobId) {
					currentBlobBytes = currentBlobBytes.plus(chunk.sliceArray(startAppend..<changed))
				} else {
					currentBlobIdBytes = currentBlobIdBytes.plus(chunk.sliceArray(startAppend..<changed))
				}
			}
			// for new chunk
			startAppend = 0
			changed = withContext(Dispatchers.IO) {
					bytes.read(chunk)
			}
			if (changed == -1) {
				break
			} else {
				loop@for(i in 0..<changed) {
					byteInt = chunk[i].toInt()

					if (byteInt == '\n'.code) {
						currentBlobBytes = currentBlobBytes.plus(chunk.sliceArray(startAppend..<i))
						val blobId = String(currentBlobIdBytes)
						Log.d(TAG, "Saving blob $blobId")
						// FIXME save
						currentBlobIdBytes = ByteArray(0)
						currentBlobBytes = ByteArray(0)
						finishedReadingBlobId = false
						startAppend = i + 1
					} else if (byteInt == ';'.code) {
						if (finishedReadingBlobId) continue@loop
						else finishedReadingBlobId = true

						currentBlobIdBytes = currentBlobIdBytes.plus(chunk.sliceArray(startAppend..<i))
						startAppend = i + 1
					}
				}
			}
		}

		// fully stored archive -> store that information as well
		// changed is > -1 if abortDownloadAndStore was called
		if (changed == -1) {
			storage.success()
		}
		// exit and cleanup map
		cleanState(archiveId)

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