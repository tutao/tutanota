package de.tutao.tutashared.file

import android.Manifest
import android.app.Activity
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.webkit.MimeTypeMap
import androidx.annotation.RequiresApi
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import de.tutao.tutashared.ActivityUtils
import de.tutao.tutashared.CancelledError
import de.tutao.tutashared.HashingInputStream
import de.tutao.tutashared.ProgressResponseBody
import de.tutao.tutashared.bytes
import de.tutao.tutashared.getFileInfo
import de.tutao.tutashared.ipc.DataFile
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.DirectoryContents
import de.tutao.tutashared.ipc.DownloadTaskResponse
import de.tutao.tutashared.ipc.FileFacade
import de.tutao.tutashared.ipc.IpcClientRect
import de.tutao.tutashared.ipc.UploadTaskResponse
import de.tutao.tutashared.ipc.wrap
import de.tutao.tutashared.toBase64
import de.tutao.tutashared.toHexString
import de.tutao.tutashared.toIntChecked
import de.tutao.tutashared.writeBytes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.sample
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.Call
import okhttp3.Headers.Companion.toHeaders
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.Buffer
import okio.BufferedSink
import okio.source
import org.apache.commons.io.IOUtils
import org.apache.commons.io.input.BoundedInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.security.SecureRandom
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

interface FileNotificationSender {
	fun sendDownloadFinishedNotification(fileName: String?)
	fun showDownloadNotification(file: File)
}

class AndroidFileFacade(
	private val context: Context,
	private val activityUtils: ActivityUtils,
	private val notificationSender: FileNotificationSender,
	private val random: SecureRandom,
	private val tempFs: TempFs,
	private val defaultClient: OkHttpClient,
	private val downloadProgress: (fileId: String, bytesDownloaded: Int) -> Unit,
	private val uploadProgress: (fileId: String, bytesDownloaded: Int) -> Unit,
	private val providerAuthority: String,
) : FileFacade {
	private val activeRequests = ConcurrentHashMap<String, Call>()

	@Throws(Exception::class)
	override suspend fun deleteFile(fileUrl: String) {
		this.tempFs.deleteFile(fileUrl)
	}

	@Throws(IOException::class)
	override suspend fun joinFiles(filename: String, filePartsUrls: List<String>): String {
		val outputFile = this.tempFs.createTempFileDecrypt(filename)
		return withContext(Dispatchers.IO) {
			outputFile.parentFile!!.mkdirs()

			FileOutputStream(outputFile).use { outputStream ->
				for (infile in filePartsUrls) {
					try {
						FileInputStream(infile.toUri().path).use { it.copyTo(outputStream, COPY_BUFFER_SIZE) }
					} finally {
						deleteFile(infile)
					}
				}
				outputFile.toUri().toString()
			}
		}
	}

	override suspend fun openFileForReading(fileUrl: String): String {
		return this.tempFs.openFileForReading(fileUrl)
	}

	override suspend fun closeFile(streamUrl: String) {
		return this.tempFs.closeFile(streamUrl)
	}

	override suspend fun readChunk(streamUrl: String, maxChunkSize: Long): String? {
		val stream = this.tempFs.fileStream(streamUrl)
		// available() is unreliable. For large files (larger than Int.MAX_VALUE) it returns 0.
		// BoundedInputStream#available() return the size from the underlying stream and
		// shouldn't be used.
		val limitedStream = stream.limited(maxChunkSize)
		val buffer = limitedStream.readBytes(maxChunkSize.toIntChecked())
		return if (buffer.isEmpty()) {
			null
		} else {
			this.tempFs.createInMemoryFile(buffer)
		}
	}

	override suspend fun openFileChooser(
		boundingRect: IpcClientRect,
		filter: List<String>?,
		isFileOnly: Boolean?
	): List<String> {
		val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
			type = "*/*"
			addCategory(Intent.CATEGORY_OPENABLE)
			putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
			putExtra(Intent.EXTRA_LOCAL_ONLY, true)
		}
		val selectedFiles: MutableList<String> = mutableListOf()

		val result = activityUtils.startActivityForResult(Intent.createChooser(intent, "Select File"))

		if (result.resultCode == Activity.RESULT_OK) {
			val data = result.data ?: run {
				Log.w(TAG, "File chooser result doesn't have data!")
				return listOf()
			}
			val clipData = data.clipData
			if (clipData != null) {
				var i = 0
				while (i < clipData.itemCount) {
					val item = clipData.getItemAt(i)
					selectedFiles.add(item.uri.toString())
					i++
				}
			} else {
				val uri = result.data.data
				selectedFiles.add(uri.toString())
			}
		}

		return selectedFiles
	}

	override suspend fun openFolderChooser(): String? {
		error("not implemented for this platform")
	}

	override suspend fun openMacImportFileChooser(): List<String> {
		error("not implemented for this platform")
	}

	@Throws(IOException::class)
	override suspend fun writeTempDataFile(file: DataFile): String = withContext(Dispatchers.IO) {
		val fileHandle = tempFs.createTempFileDecrypt(file.name)
		fileHandle.writeBytes(file.data.data)
		fileHandle.toUri().toString()
	}

	@Throws(IOException::class)
	override suspend fun writeToAppDir(content: DataWrapper, name: String) = withContext(Dispatchers.IO) {
		context.openFileOutput(name, Context.MODE_PRIVATE).use { outputStream ->
			outputStream.write(content.data)
		}
	}

	@Throws(IOException::class)
	override suspend fun readFromAppDir(name: String): DataWrapper = withContext(Dispatchers.IO) {
		context.openFileInput(name).use { outputStream ->
			outputStream.readBytes().wrap()
		}
	}

	@Throws(IOException::class)
	override suspend fun deleteFromAppDir(name: String) {
		val file = File(context.filesDir, name)
		file.delete()
	}

	// @see: https://developer.android.com/reference/android/support/v4/content/FileProvider.html
	override suspend fun open(fileUrl: String, mimeType: String) {
		val file = fileUrl.toUri().let { uri ->
			if (uri.scheme == "file") {
				FileProvider.getUriForFile(context, providerAuthority, File(uri.path!!))
			} else {
				uri
			}
		}

		val intent = Intent(Intent.ACTION_VIEW).apply {
			setDataAndType(file, getCorrectedMimeType(file, mimeType))
			flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
		}

		activityUtils.startActivityForResult(intent)
	}

	override suspend fun getMimeType(fileUrl: String): String = getMimeType(fileUrl.toUri(), context)

	override suspend fun putFileIntoDownloadsFolder(localFileUri: String, fileNameToUse: String): String =
		withContext(Dispatchers.IO) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
				addFileToDownloadsMediaStore(localFileUri, fileNameToUse)
			} else {
				activityUtils.getPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
				addFileToDownloadsOld(localFileUri, fileNameToUse)
			}
		}

	@RequiresApi(Build.VERSION_CODES.Q)
	private suspend fun addFileToDownloadsMediaStore(fileUriString: String, fileNameToUse: String): String {
		val contentResolver = context.contentResolver
		val fileUri = fileUriString.toUri()
		val fileInfo = getFileInfo(context, fileUri)
		val outputUri = contentResolver.insert(
			MediaStore.Downloads.EXTERNAL_CONTENT_URI,
			ContentValues().apply {
				put(MediaStore.MediaColumns.IS_PENDING, 1)
				put(MediaStore.MediaColumns.MIME_TYPE, getMimeType(fileUri.toString()))
				put(MediaStore.MediaColumns.DISPLAY_NAME, fileNameToUse)
				put(MediaStore.MediaColumns.SIZE, fileInfo.size)
			},
		) ?: throw FileOpenException("Could not insert into downloads, no output URI")

		val inputStream = contentResolver.openInputStream(fileUri)!!
		val outputStream = contentResolver.openOutputStream(outputUri)
		val copiedBytes = IOUtils.copyLarge(inputStream, outputStream)
		Log.d(TAG, "Copied $copiedBytes")
		val updated = contentResolver.update(
			outputUri,
			ContentValues().apply {
				put(MediaStore.MediaColumns.IS_PENDING, 0)
			},
			null,
			null
		)
		Log.d(TAG, "Updated with not pending: $updated")
		notificationSender.sendDownloadFinishedNotification(fileNameToUse)
		return outputUri.toString()
	}

	private fun addFileToDownloadsOld(fileUri: String, fileNameToUse: String): String {
		val downloadsDir = ensureRandomDownloadDir()
		val file = fileUri.toUri()
		val newFile = File(downloadsDir, fileNameToUse)
		IOUtils.copyLarge(context.contentResolver.openInputStream(file), FileOutputStream(newFile), ByteArray(4096))
		notificationSender.showDownloadNotification(newFile)
		return Uri.fromFile(newFile).toString()
	}

	/**
	 * on Android < 10, the download location of attachments is predictable.
	 * in the spirit of defense-in-depth we create a random dl directory inside
	 * the system Download dir to make the loading of downloaded files impossible in
	 * case of exploits that would trick the app into executing anything but our assets.
	 */
	private fun ensureRandomDownloadDir(): File {
		@Suppress("DEPRECATION")
		val publicDownloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
		val matchingDirectories = publicDownloadsDir.listFiles { file: File ->
			// tutanota-dl-0f0f0f0f0f (prefix with 5 bytes of randomness)
			file.isDirectory && file.name.startsWith("tutanota-") && file.name.length == 22
		}
		val privateDownloadsDir = matchingDirectories?.firstOrNull()
			?: File(publicDownloadsDir, "tutanota-dl-${random.bytes(5).toHexString()}")
		if (!privateDownloadsDir.exists()) {
			val created = privateDownloadsDir.mkdirs()
			if (!created) {
				throw IOException("Could not create downloads folder")
			}
		}

		return privateDownloadsDir
	}

	@Throws(FileNotFoundException::class)
	override suspend fun getSize(fileUrl: String): Long {
		return this.tempFs.fileInfo(fileUrl).size
	}

	@Throws(FileNotFoundException::class)
	override suspend fun getName(fileUrl: String): String {
		return getFileInfo(context, fileUrl.toUri()).name
	}

	@OptIn(FlowPreview::class)
	@Throws(IOException::class)
	override suspend fun upload(
		fileUrl: String,
		targetUrl: String,
		method: String,
		headers: Map<String, String>,
		fileId: String,
	): UploadTaskResponse {
		return coroutineScope {
			// See `download` for a description of how this works.
			val flow = MutableSharedFlow<Int>(0, 1, BufferOverflow.DROP_OLDEST)
			val progressJob = launch(Dispatchers.Default) {
				flow
					.sample(50)
					.collect { total -> this@AndroidFileFacade.uploadProgress(fileId, total) }

			}

			withContext(Dispatchers.IO) {
				val parsedUri = fileUrl.toUri()
				val contentResolver = context.contentResolver
				val contentType = contentResolver.getType(parsedUri)
				val length = this@AndroidFileFacade.tempFs.fileInfo(fileUrl).size

				try {

					val requestBody: RequestBody = object : RequestBody() {
						override fun contentLength(): Long {
							return length
						}

						override fun contentType(): MediaType? {
							return contentType?.toMediaTypeOrNull()
						}

						@Throws(IOException::class)
						override fun writeTo(sink: BufferedSink) {
							val buffer = Buffer()
							var total: Long = 0

							tempFs.fileStream(fileUrl).source().use { source ->
								val chunkSize = 8192L // 8 KB (Okio segment size)

								while (true) {
									val read = source.read(buffer, chunkSize)
									if (read == -1L) {
										break
									}

									sink.write(buffer, read)
									total += read

									// .toInt() is fine because the read buffer is always small enough
									//this@AndroidFileFacade.uploadProgress(fileId, total.toInt())
									flow.tryEmit(total.toInt())
								}
							}
						}
					}

					val requestBuilder = Request.Builder()
						.url(targetUrl)
						.method(method, requestBody)
						.headers(headers.toHeaders())
						.header("Content-Type", "application/octet-stream")
						.header("Cache-Control", "no-cache")

					// infinite timeout
					// - the server stops listening after 10 minutes -> SocketException
					// - if the internet connection dies -> SocketException
					// we don't want to time out in case of a slow connection because we may already be
					// waiting for the response code while the TCP stack is still busy sending our data
					val call = defaultClient.newBuilder()
						.connectTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
						.writeTimeout(0, TimeUnit.SECONDS)
						.readTimeout(0, TimeUnit.SECONDS)
						.build()
						.newCall(requestBuilder.build())

					this@AndroidFileFacade.activeRequests[fileId] = call

					call.execute().use { response ->
						// this would run into the read timeout if the upload is still running
						val responseCode = response.code
						val suspensionTime = response.header("Retry-After") ?: response.header("Suspension-Time")
						val responseBody = if (responseCode in 200..299) {
							response.body.bytes().wrap()
						} else {
							byteArrayOf().wrap()
						}
						UploadTaskResponse(
							statusCode = responseCode.toLong(),
							errorId = response.header("Error-Id"),
							precondition = response.header("Precondition"),
							suspensionTime = suspensionTime,
							responseBody = responseBody
						)
					}.also {
						progressJob.cancel()
					}
				} catch (e: IOException) {
					val isCancelled = this@AndroidFileFacade.activeRequests[fileId]?.isCanceled() ?: false
					if (isCancelled) {
						throw CancelledError()
					} else {
						throw e
					}
				} finally {
					this@AndroidFileFacade.activeRequests.remove(fileId)
				}
			}
		}
	}

	@OptIn(FlowPreview::class)
	@Throws(IOException::class)
	override suspend fun download(
		sourceUrl: String,
		filename: String,
		headers: Map<String, String>,
		fileId: String
	): DownloadTaskResponse {
		// Create a new child coroutine scope so that if the request fails it cancels our progress job as well
		// Also if the whole operation is canceled the child scope also gets canceled
		return coroutineScope {
			// Create a holder for the progress value that can be observed.
			// We create it with buffer of 1 so that we can put values into it without suspending and we only care about
			// the latest value
			val flow = MutableSharedFlow<Int>(0, 1, BufferOverflow.DROP_OLDEST)
			// Start a child parallel job that will periodically report the progress
			val progressJob = launch(Dispatchers.Default) {
				flow
					// Only take the value every 50ms so that we don't report progress too often
					.sample(50)
					// Collect will pause this coroutine and will invoke the block for each value. As we are collecting
					// MutableSharedFlow it never actually ends (so we cancel the progress job manually below)
					.collect { bytes ->
						this@AndroidFileFacade.downloadProgress(fileId, bytes)
					}
			}

			// Start the network request with IO context (on IO thread pool)
			withContext(Dispatchers.IO) {
				val requestBuilder = Request.Builder()
					.url(sourceUrl)
					.method("GET", null)
					.headers(headers.toHeaders())
					.header("Content-Type", "application/json")
					.header("Cache-Control", "no-cache")

				val call = defaultClient.newBuilder()
					.connectTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.writeTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.readTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					// Intercept the request to wrap the body with our progress reporter
					.addNetworkInterceptor { chain ->
						val originalResponse = chain.proceed(chain.request())
						originalResponse.newBuilder()
							.body(ProgressResponseBody(originalResponse.body, { bytesRead, _, done ->
								if (!done) {
									// Post current progress.
									// Normally to emit into FlowCollector we would have to be in a suspending function
									// (because it might not be able to accept it due to backpressure) but we are not
									// in a suspending function and we actually don't care about backpressure because
									// the progress is a "hot" stream and will keep the latest value only anyway.
									// So we use tryEmit which is sync.
									flow.tryEmit(bytesRead.toInt())
								}
							}))
							.build()
					}
					.build()
					.newCall(requestBuilder.build())
				try {
					activeRequests[fileId] = call
					val response = call.execute()
					// By this point we got the response header but we might not have read the body yet.

					response.use { response ->
						var encryptedFile: File? = null
						if (response.code == 200) {
							val inputStream = response.body.byteStream()
							encryptedFile = tempFs.createTempFileEncrypt(filename)
							writeFileStream(encryptedFile, inputStream)
						}

						DownloadTaskResponse(
							statusCode = response.code.toLong(),
							errorId = response.header("Error-Id"),
							precondition = response.header("Precondition"),
							suspensionTime = response.header("Retry-After") ?: response.header("Suspension-Time"),
							encryptedFileUri = encryptedFile?.toUri().toString(),
						)
					}.also {
						// Cancel the progress job manually.
						// Important to do it after we actually read the whole body.
						// In case of an error it would get canceled automatically so we don't need to do anything.
						// Canceling the child job will not cancel the parent as if it was an error.
						progressJob.cancel()
					}
				} catch (e: IOException) {
					if (call.isCanceled()) {
						throw CancelledError()
					} else {
						throw e
					}
				} finally {
					activeRequests.remove(fileId)
				}
			}
		}
	}

	override suspend fun abortDownload(fileId: String) {
		this.activeRequests[fileId]?.cancel()
	}

	override suspend fun abortUpload(fileId: String) {
		this.activeRequests[fileId]?.cancel()
	}

	@Throws(IOException::class)
	override suspend fun readDataFile(fileUrl: String): DataFile? {
		// We just allow files that came from other intents using content:// or
		// that belongs to our folder scope
		val uri = fileUrl.toUri()
		val allowedLocation = uri.scheme == "content"
				|| uri.scheme == "file" && uri.path != null && tempFs.isInTemp(uri.path!!)
		require(allowedLocation) { "Not allowed to read file at $fileUrl" }

		val bytes = withContext(Dispatchers.IO) {
			context.contentResolver.openInputStream(uri)?.use { inputStream ->
				inputStream.readBytes()
			}
		} ?: return null

		val fileInfo = getFileInfo(context, uri)
		val mimeType = getMimeType(uri, context)

		return DataFile(fileInfo.name, mimeType, bytes.wrap(), fileInfo.size.toInt())
	}

	override suspend fun readDirectory(directoryUrl: String): DirectoryContents {
		error("not implemented for this platform")
	}

	@Throws(IOException::class)
	suspend fun writeFileStream(filePath: File, inputStream: InputStream) = withContext(Dispatchers.IO) {
		filePath.parentFile!!.mkdirs()
		IOUtils.copyLarge(inputStream, FileOutputStream(filePath), ByteArray(COPY_BUFFER_SIZE))
	}

	override suspend fun clearFileData() {
		tempFs.clearTempDir()
	}

	@Throws(IOException::class, NoSuchAlgorithmException::class)
	override suspend fun hashFile(fileUrl: String): String {
		val hash = this.tempFs.fileStream(fileUrl).use { inputStream ->
			val hashingInputStream = HashingInputStream(MessageDigest.getInstance("SHA-256"), inputStream)
			val devNull: OutputStream = object : OutputStream() {
				override fun write(b: Int) {}
			}
			IOUtils.copyLarge(hashingInputStream, devNull)
			hashingInputStream.hash()
		}

		return hash.copyOf(6).toBase64()
	}

	private companion object {
		const val TAG = "FileUtil"
		const val HTTP_TIMEOUT = 15L
		const val COPY_BUFFER_SIZE = 1024 * 1000
	}

	private fun getCorrectedMimeType(fileUri: Uri, storedMimeType: String?): String {
		return if (storedMimeType.isNullOrEmpty() || storedMimeType == "application/octet-stream") {
			getMimeType(fileUri, context)
		} else {
			storedMimeType
		}
	}
}

fun InputStream.limited(bytes: Long): InputStream = BoundedInputStream.builder()
	.setInputStream(this)
	.setMaxCount(bytes)
	.get()

// Reimplement Kotlin's readBytes() in a way that doesn't take available() into account
fun InputStream.readBytes(outputSize: Int = DEFAULT_BUFFER_SIZE): ByteArray {
	val baos = ByteArrayOutputStream(outputSize)
	copyTo(baos)
	return baos.toByteArray()
}

class FileOpenException(message: String) : Exception(message)

fun getMimeType(fileUri: Uri, context: Context): String {
	val scheme = fileUri.scheme
	if ("file" == scheme) {
		val extension = MimeTypeMap.getFileExtensionFromUrl(fileUri.toString())
		val type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
		if (type != null) {
			return type
		}
	} else if ("content" == scheme) {
		val type = context.contentResolver.getType(fileUri)
		if (type != null) {
			return type
		}
	}
	return "application/octet-stream"
}

