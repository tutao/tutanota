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
import okhttp3.Request
import java.io.IOException
import java.io.InputStream
import java.util.concurrent.TimeUnit
import kotlin.time.TimeSource

class AndroidArchiveDownloaderFacade (
	private val sqlCipherFacade: SqlCipherFacade
): ArchiveDownloaderFacade {

	override suspend fun downloadAndStoreArchive(
		sourceUrl: String,
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
					// By this point we got the response header but we might not have read the body yet.
					response.use { response ->
						val endDownload = TimeSource.Monotonic.markNow()
						Log.d(TAG, "Finished downloading archive (took " + endDownload.minus(startDownload).inWholeMilliseconds + " ms)")

						if (response.code == 200) {
							Log.d(TAG, "Started storing archive")
							val startStore = TimeSource.Monotonic.markNow()
							storeBytes(response.body.byteStream(), typeref, modelVersion)
							val endStore = TimeSource.Monotonic.markNow()
							Log.d(TAG, "Finished storing archive (took " + endStore.minus(startStore).inWholeMilliseconds + " ms)")
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


	private suspend fun storeBytes(bytes: InputStream, typeref: String, modelVersion: Long) {
		var openCurlyBraces = 0
		var isInString = false

		val expectedBlobIdPrefix = "\"1300\":"
		var currentBlobIdPrefix: String? = null
		var tmpReadBlobIdPrefix = ""
		var currentFullBlobId: String? = null
		var finishedReadingBlobId = false

		val chunk = ByteArray(10_000)
		var changed: Int
		val currentBlobBytes = mutableListOf<Byte>()
		var byteInt: Int

		var startBlob = TimeSource.Monotonic.markNow()

		Log.d(TAG, "Started parsing blob")
		while (true) {
			changed = bytes.read(chunk, 0, 10_000)
			if (changed == -1) {
				break
			} else {
				loop@for(i in 0..<changed) {
					byteInt = chunk[i].toInt()
					// this is most of the data
					// just save & continue
					// if we finished reading the blob id, we only need minimal parsing and can return as quickly as possible
					if (isInString && finishedReadingBlobId && byteInt != '"'.code) {
						currentBlobBytes.add(chunk[i])
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
									val blobId = fullBlobId[1]
									val archiveId = fullBlobId[0]

									// logging
									val time = TimeSource.Monotonic.markNow().minus(startBlob).inWholeMilliseconds
									Log.d(TAG, "Finished parsing blob $blobId (took $time ms)")

									// store
									doStore(blobId, archiveId, currentBlobBytes.toByteArray(), typeref, modelVersion)

									// cleanup variables
									currentBlobBytes.clear()
									finishedReadingBlobId = false
									currentFullBlobId = null
									currentBlobIdPrefix = null

									// do not store the comma itself
									Log.d(TAG, "Started parsing next blob")
									startBlob = TimeSource.Monotonic.markNow()
								}
							}
						}
						']'.code -> {
							if (!finishedReadingBlobId && !currentFullBlobId.isNullOrEmpty()) {
								currentFullBlobId += byteInt.toChar()
								finishedReadingBlobId = true
								Log.d(TAG, "Found blobId $currentFullBlobId")
							}
						}
						','.code -> {
							if (currentBlobBytes.isEmpty()) {
								// do not add commas in between objects to currentBlobBytes
								continue
							}
						}
					}
					currentBlobBytes.add(chunk[i])
					// if we started reading full blob id, continue to do so
					if (!finishedReadingBlobId && currentFullBlobId != null && (currentFullBlobId.isNotEmpty() || byteInt != ':'.code)) {
						currentFullBlobId += byteInt.toChar()
					}
				}
			}
		}
	}

	private suspend fun doStore(blobId: String, archiveId: String, bytesToStore: ByteArray, typeref: String, modelVersion: Long) {
		val size = bytesToStore.size
		Log.d(TAG, "Started storing blob $blobId (storing at least $size bytes)")
		val start = TimeSource.Monotonic.markNow()

		val query = "INSERT OR REPLACE INTO encrypted_mail_details_blobs (blobId, archiveId, data, typeref, modelVersion) VALUES (?, ?, ?, ?, ?)"
		sqlCipherFacade.run(query, listOf(
			TaggedSqlValue.Str(blobId),
			TaggedSqlValue.Str(archiveId),
			TaggedSqlValue.Bytes(DataWrapper(bytesToStore)),
			TaggedSqlValue.Str(typeref),
			TaggedSqlValue.Num(modelVersion)
		))
		val end = TimeSource.Monotonic.markNow()
		val time = end.minus(start).inWholeMilliseconds
		Log.d(TAG, "Finished storing blob $blobId (took $time ms)");

	}

	private companion object {
		const val TAG = "ArchiveDownloaderFacade"
		const val HTTP_TIMEOUT = 15L
	}

}