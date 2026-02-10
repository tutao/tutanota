package de.tutao.calendar

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
import de.tutao.calendar.push.LocalNotificationsFacade
import de.tutao.calendar.push.showDownloadNotification
import de.tutao.tutashared.HashingInputStream
import de.tutao.tutashared.ProgressResponseBody
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.bytes
import de.tutao.tutashared.getFileInfo
import de.tutao.tutashared.getNonClobberingFileName
import de.tutao.tutashared.ipc.DataFile
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.DownloadTaskResponse
import de.tutao.tutashared.ipc.FileFacade
import de.tutao.tutashared.ipc.IpcClientRect
import de.tutao.tutashared.ipc.UploadTaskResponse
import de.tutao.tutashared.ipc.wrap
import de.tutao.tutashared.toBase64
import de.tutao.tutashared.toHexString
import de.tutao.tutashared.writeBytes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.sample
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.Headers.Companion.toHeaders
import okhttp3.MediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okio.BufferedSink
import okio.buffer
import okio.source
import org.apache.commons.io.IOUtils
import org.apache.commons.io.input.BoundedInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.io.SequenceInputStream
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.security.SecureRandom
import java.util.Collections
import java.util.concurrent.TimeUnit

class AndroidFileFacade(
	private val activity: MainActivity,
	private val localNotificationsFacade: LocalNotificationsFacade,
	private val random: SecureRandom,
	private val defaultClient: OkHttpClient,
	private val downloadProgress: (fileId: String, bytesDownloaded: Int) -> Unit
) : FileFacade {

	val tempDir = TempDir(activity, random)

	@Throws(Exception::class)
	override suspend fun deleteFile(file: String) {
		if (file.startsWith(Uri.fromFile(activity.filesDir).toString())) {
			// we do not deleteAlarmNotification files that are not stored in our cache dir
			val fileInstance = File(Uri.parse(file).path!!)
			try {
				val deleted = fileInstance.delete()
				if (!deleted && fileInstance.exists()) {
					throw Exception("Could not delete file $file")
				}
				Log.d(TAG, "Deleted file: $fileInstance")
			} catch (e: Exception) {
				Log.e(
					TAG,
					"Error type: ${e.javaClass}\nError message: ${e.message}\nStack Trace: ${e.stackTraceToString()}\nCause: ${e.cause}"
				)
			}
		}
	}

	@Throws(IOException::class)
	override suspend fun joinFiles(filename: String, files: List<String>): String {
		val inStreams: MutableList<InputStream> = ArrayList(files.size)
		for (infile in files) {
			inStreams.add(FileInputStream(Uri.parse(infile).path))
		}
		val newFileName = getNonClobberingFileName(tempDir.decrypt, filename)
		val outputFile = File(tempDir.decrypt, newFileName)
		writeFileStream(outputFile, SequenceInputStream(Collections.enumeration(inStreams)))
		return outputFile.toUri().toString()
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

		val result = activity.startActivityForResult(Intent.createChooser(intent, "Select File"))

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
		val fileHandle = File(tempDir.decrypt, file.name)
		fileHandle.writeBytes(file.data.data)
		fileHandle.toUri().toString()
	}

	@Throws(IOException::class)
	override suspend fun writeToAppDir(content: DataWrapper, name: String) {
		val fileHandle = activity.openFileOutput(name, Context.MODE_PRIVATE);
		fileHandle.write(content.data)
	}

	@Throws(IOException::class)
	override suspend fun readFromAppDir(name: String): DataWrapper {
		val fileHandle = activity.openFileInput(name)
		val data = DataWrapper(fileHandle.readBytes())
		fileHandle.close()
		return data
	}

	@Throws(IOException::class)
	override suspend fun deleteFromAppDir(path: String) {
		val file = File(activity.filesDir, path)
		val fullPath = file.toUri().toString()
		this.deleteFile(fullPath)
	}

	// @see: https://developer.android.com/reference/android/support/v4/content/FileProvider.html
	override suspend fun open(location: String, mimeType: String) {
		val file = location.toUri().let { uri ->
			if (uri.scheme == "file") {
				FileProvider.getUriForFile(activity, BuildConfig.FILE_PROVIDER_AUTHORITY, File(uri.path!!))
			} else {
				uri
			}
		}

		val intent = Intent(Intent.ACTION_VIEW).apply {
			setDataAndType(file, getCorrectedMimeType(file, mimeType))
			flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
		}

		activity.startActivityForResult(intent)
	}

	override suspend fun getMimeType(fileUri: String): String = getMimeType(fileUri.toUri(), activity)

	override suspend fun putFileIntoDownloadsFolder(localFileUri: String, fileNameToUse: String): String =
		withContext(Dispatchers.IO) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
				addFileToDownloadsMediaStore(localFileUri, fileNameToUse)
			} else {
				activity.getPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
				addFileToDownloadsOld(localFileUri, fileNameToUse)
			}
		}

	@RequiresApi(Build.VERSION_CODES.Q)
	private suspend fun addFileToDownloadsMediaStore(fileUriString: String, fileNameToUse: String): String {
		val contentResolver = activity.contentResolver
		val fileUri = fileUriString.toUri()
		val fileInfo = getFileInfo(activity, fileUri)
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
		localNotificationsFacade.sendDownloadFinishedNotification(fileNameToUse)
		return outputUri.toString()
	}

	private fun addFileToDownloadsOld(fileUri: String, fileNameToUse: String): String {
		val downloadsDir = ensureRandomDownloadDir()
		val file = Uri.parse(fileUri)
		val fileInfo = getFileInfo(activity, file)
		val newFile = File(downloadsDir, fileNameToUse)
		IOUtils.copyLarge(activity.contentResolver.openInputStream(file), FileOutputStream(newFile), ByteArray(4096))
		showDownloadNotification(activity, newFile)
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
	override suspend fun getSize(file: String): Int {
		return getFileInfo(activity, Uri.parse(file)).size.toInt()
	}

	@Throws(FileNotFoundException::class)
	override suspend fun getName(file: String): String {
		return getFileInfo(activity, Uri.parse(file)).name
	}

	@Throws(IOException::class)
	override suspend fun upload(
		fileUrl: String,
		targetUrl: String,
		method: String,
		headers: Map<String, String>
	): UploadTaskResponse =
		withContext(Dispatchers.IO) {
			val parsedUri = Uri.parse(fileUrl)
			val contentResolver = activity.contentResolver
			val contentType = contentResolver.getType(parsedUri)
			val response = contentResolver.openAssetFileDescriptor(parsedUri, "r")!!.use { fd ->

				val requestBody: RequestBody = object : RequestBody() {
					override fun contentLength(): Long {
						return fd.length
					}

					override fun contentType(): MediaType? {
						return contentType?.toMediaTypeOrNull()
					}

					@Throws(IOException::class)
					override fun writeTo(sink: BufferedSink) {
						fd.createInputStream().use { inputStream -> sink.writeAll(inputStream.source().buffer()) }
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
				defaultClient.newBuilder()
					.connectTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.writeTimeout(0, TimeUnit.SECONDS)
					.readTimeout(0, TimeUnit.SECONDS)
					.build()
					.newCall(requestBuilder.build())
					.execute()
			}

			response.use { response ->
				// this would run into the read timeout if the upload is still running
				val responseCode = response.code
				val suspensionTime = response.header("Retry-After") ?: response.header("Suspension-Time")
				val responseBody = if (responseCode in 200..299) {
					response.body?.bytes()?.wrap() ?: byteArrayOf().wrap()
				} else {
					byteArrayOf().wrap()
				}
				UploadTaskResponse(
					statusCode = responseCode,
					errorId = response.header("Error-Id"),
					precondition = response.header("Precondition"),
					suspensionTime = suspensionTime,
					responseBody = responseBody
				)
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

				val response = defaultClient.newBuilder()
					.connectTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.writeTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					.readTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
					// Intercept the request to wrap the body with our progress reporter
					.addNetworkInterceptor { chain ->
						val originalResponse = chain.proceed(chain.request())
						originalResponse.newBuilder()
							.body(ProgressResponseBody(originalResponse.body, { bytesRead, contentLength, done ->
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
					.execute()
				// By this point we got the response header but we might not have read the body yet.

				response.use { response ->
					var encryptedFile: File? = null
					if (response.code == 200) {
						val inputStream = response.body.byteStream()
						encryptedFile = File(tempDir.encrypt, filename)
						writeFileStream(encryptedFile, inputStream)
					}

					DownloadTaskResponse(
						statusCode = response.code,
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
			}
		}
	}

	@Throws(IOException::class)
	override suspend fun readDataFile(filePath: String): DataFile? {
		// We just allow files that came from other intents using content:// or
		// that belongs to our folder scope
		val uri = Uri.parse(filePath)
		val allowedLocation = uri.scheme == "content"
				|| uri.scheme == "file" && uri.path != null && uri.path!!.startsWith(tempDir.root.path)
		require(allowedLocation) { "Not allowed to read file at $filePath" }

		val bytes = withContext(Dispatchers.IO) {
			activity.contentResolver.openInputStream(uri)?.use { inputStream ->
				inputStream.readBytes()
			}
		} ?: return null

		val fileInfo = getFileInfo(activity, uri)
		val mimeType = getMimeType(uri, activity)

		return DataFile(fileInfo.name, mimeType, bytes.wrap(), fileInfo.size.toInt())
	}

	@Throws(IOException::class)
	suspend fun writeFileStream(filePath: File, inputStream: InputStream) = withContext(Dispatchers.IO) {
		filePath.parentFile!!.mkdirs()
		IOUtils.copyLarge(inputStream, FileOutputStream(filePath), ByteArray(COPY_BUFFER_SIZE))
	}

	override suspend fun clearFileData() {
		clearDirectory(tempDir.root)
	}

	private fun clearDirectory(file: File) {
		file.listFiles()?.let { children ->
			for (child in children) {
				if (child.isDirectory) {
					clearDirectory(child)
				}
				child.delete()
			}
		}
	}

	@Throws(IOException::class)
	override suspend fun splitFile(fileUri: String, maxChunkSizeBytes: Int): List<String> =
		withContext(Dispatchers.IO) {
			val file = Uri.parse(fileUri)
			val fileSize = getFileInfo(activity, file).size
			val inputStream = activity.contentResolver.openInputStream(file)
			val chunkUris: MutableList<String> = ArrayList()
			var chunk = 0
			while (chunk * maxChunkSizeBytes <= fileSize) {
				val tmpFilename = Integer.toHexString(file.hashCode()) + "." + chunk + ".blob"
				val chunkedInputStream = BoundedInputStream.builder()
					.setInputStream(inputStream)
					.setMaxCount(maxChunkSizeBytes.toLong())
					.get()
				val tmpFile = File(tempDir.decrypt, tmpFilename)
				writeFileStream(tmpFile, chunkedInputStream)
				chunkUris.add(tmpFile.toUri().toString())
				chunk++
			}
			chunkUris
		}

	@Throws(IOException::class, NoSuchAlgorithmException::class)
	override suspend fun hashFile(fileUri: String): String {
		val inputStream = activity.contentResolver.openInputStream(Uri.parse(fileUri))!!
		val hashingInputStream = HashingInputStream(MessageDigest.getInstance("SHA-256"), inputStream)
		val devNull: OutputStream = object : OutputStream() {
			override fun write(b: Int) {}
		}
		IOUtils.copyLarge(hashingInputStream, devNull)
		val hash = hashingInputStream.hash()
		return hash.copyOf(6).toBase64()
	}

	private companion object {
		const val TAG = "FileUtil"
		const val HTTP_TIMEOUT = 15L
		const val COPY_BUFFER_SIZE = 1024 * 1000
	}

	private suspend fun getCorrectedMimeType(fileUri: Uri, storedMimeType: String?): String {
		return if (storedMimeType == null || storedMimeType.isEmpty() || storedMimeType == "application/octet-stream") {
			getMimeType(fileUri, activity)
		} else {
			storedMimeType
		}
	}
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

