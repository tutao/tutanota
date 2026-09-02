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
import okhttp3.Call
import okhttp3.Request
import java.io.IOException
import java.io.InputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit
import kotlin.time.TimeSource

class AndroidArchiveDownloaderFacade (
	private val sqlCipherFacade: SqlCipherFacade
): ArchiveDownloaderFacade {

	private val activeRequests = ConcurrentHashMap<String, Call>()

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
				Log.d(TAG, "Started downloading archive")
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
						Log.d(TAG, "Finished downloading archive (took $timeToDownload ms)")

						if (response.code == 200) {
							Log.d(TAG, "Started storing archive")
							storeBytes(response.body.byteStream(), archiveId, typeref, modelVersion, sourceUrl)
							val timeToStore = TimeSource.Monotonic.markNow().minus(endDownload).inWholeMilliseconds
							Log.d(TAG, "Finished storing archive (took $timeToStore ms)")
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
			activeRequests.remove(archiveId)
			Log.d(TAG, "Aborted storing archive with id $archiveId")
		}
	}

	private suspend fun storeBytes(bytes: InputStream, archiveId: String, typeref: String, modelVersion: Long, sourceUrl: String) {
		var openCurlyBraces = 0
		var isInString = false

		val expectedBlobIdPrefix = "\"1300\":"
		var currentBlobIdPrefix: String? = null
		var tmpReadBlobIdPrefix = ""
		var currentFullBlobId: String? = null
		var finishedReadingBlobId = false

		// this seems to be the maximum read
		// when upgrading to minimum API Level 33, we could try and use InputStream#readNBytes
		val chunk = ByteArray(8192)
		var changed = -1
		var currentBlobBytes = ByteArray(0)
		var byteInt: Int
		var startAppend = 0

		val storage = StoreArchive(archiveId, typeref, modelVersion, sqlCipherFacade)

		// while we're not cancelled or finished ...
		var isIn = activeRequests.containsKey(archiveId)
		Log.d(TAG, "Initially: $isIn")

		while (activeRequests.containsKey(archiveId)) {
			if (startAppend < changed) {
				currentBlobBytes = currentBlobBytes.plus(chunk.sliceArray(startAppend..<changed))
			}
			// for new chunk
			startAppend = 0

			changed = bytes.read(chunk)
			if (changed == -1) {
				// exit and cleanup map
				activeRequests.remove(archiveId)
				break
			} else {
				loop@for(i in 0..<changed) {
					byteInt = chunk[i].toInt()
					// this is most of the data
					// just save & continue
					// if we finished reading the blob id, we only need minimal parsing and can return as quickly as possible
					if (isInString && finishedReadingBlobId && byteInt != '"'.code) {
						continue@loop
					}

					// check if our blob id's prefix is continuing
					if (!finishedReadingBlobId && currentBlobIdPrefix != null) {
						// yes: continue reading prefix
						tmpReadBlobIdPrefix = currentBlobIdPrefix + byteInt.toChar()
						if (expectedBlobIdPrefix.startsWith(tmpReadBlobIdPrefix)) {
							currentBlobIdPrefix = tmpReadBlobIdPrefix
							// we read the entire prefix, read blob id now
							if (currentBlobIdPrefix.length == expectedBlobIdPrefix.length) {
								currentFullBlobId = ""
							}
						} else { // no: stop reading prefix
							currentBlobIdPrefix = null
						}
					}

					when(byteInt) {
						'"'.code -> {
							// check if we define the blob id somewhere around here
							if (!isInString && currentBlobIdPrefix == null && openCurlyBraces == 1) {
								currentBlobIdPrefix = "\""
							}
							isInString = !isInString
						}
						'{'.code -> {
							if (!isInString) {
								openCurlyBraces++
							}
						}
						'}'.code -> {
							if (!isInString) {
								openCurlyBraces--

								// store when object ends
								if (openCurlyBraces == 0) {
									// get blob id
									val fullBlobId = Json.decodeFromString<Array<String>>(currentFullBlobId!!)

									// store
									storage.storeBlob(fullBlobId[1], currentBlobBytes.plus(chunk.sliceArray(startAppend..i)))

									// cleanup variables
									currentBlobBytes = ByteArray(0)
									finishedReadingBlobId = false
									currentFullBlobId = null
									currentBlobIdPrefix = null

									startAppend = i + 1
									// do not store the brace twice
									continue
								}
							}
						}
						']'.code -> {
							if (!finishedReadingBlobId && !currentFullBlobId.isNullOrEmpty()) {
								currentFullBlobId += byteInt.toChar()
								finishedReadingBlobId = true
							}
						}
						','.code -> {
							if (currentBlobBytes.isEmpty()) {
								// do not add commas in between objects to currentBlobBytes
								startAppend++
							}
						}
					}

					// if we started reading full blob id, continue to do so
					if (!finishedReadingBlobId && currentFullBlobId != null && !(currentFullBlobId.isEmpty() && byteInt == ':'.code)) {
						currentFullBlobId += byteInt.toChar()
					}
				}
			}
		}
		storage?.close()
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

		private suspend fun store() {
			Log.d(TAG, "Started storing at least $byteCountCurrent bytes")
			val start = TimeSource.Monotonic.markNow()

			val archiveId = TaggedSqlValue.Str(archiveId)
			val typeref = TaggedSqlValue.Str(typeref)
			val modelVersion = TaggedSqlValue.Num(modelVersion)

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