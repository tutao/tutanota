package de.tutao.tutanota

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
import de.tutao.tutanota.push.LocalNotificationsFacade
import de.tutao.tutanota.push.showDownloadNotification
import de.tutao.tutashared.HashingInputStream
import de.tutao.tutashared.TempDir
import de.tutao.tutashared.bytes
import de.tutao.tutashared.getFileInfo
import de.tutao.tutashared.getNonClobberingFileName
import de.tutao.tutashared.ipc.*
import de.tutao.tutashared.toBase64
import de.tutao.tutashared.toHexString
import de.tutao.tutashared.writeBytes
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okio.BufferedSink
import okio.buffer
import okio.source
import org.apache.commons.io.IOUtils
import org.apache.commons.io.input.BoundedInputStream
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.*
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.security.SecureRandom
import java.util.*
import java.util.concurrent.TimeUnit

class AndroidFileFacade(
	private val activity: MainActivity,
	private val localNotificationsFacade: LocalNotificationsFacade,
	private val random: SecureRandom,
	private val defaultClient: OkHttpClient
) : FileFacade {

	val tempDir = TempDir(activity, random)

	@Throws(Exception::class)
	override suspend fun deleteFile(file: String) {
		if (file.startsWith(Uri.fromFile(activity.filesDir).toString())) {
			// we do not deleteAlarmNotification files that are not stored in our cache dir
			if (!File(Uri.parse(file).path!!).delete()) {
				throw Exception("could not delete file $file")
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

	override suspend fun openFileChooser(boundingRect: IpcClientRect, filter: List<String>?): List<String> {
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

	@Throws(IOException::class, JSONException::class)
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
					.header("Content-Type", "application/octet-stream")
					.header("Cache-Control", "no-cache")
				addHeadersToRequest(requestBuilder, JSONObject(headers))

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

	@Throws(IOException::class, JSONException::class)
	override suspend fun download(
		sourceUrl: String,
		filename: String,
		headers: Map<String, String>
	): DownloadTaskResponse =
		withContext(Dispatchers.IO) {
			val requestBuilder = Request.Builder()
				.url(sourceUrl)
				.method("GET", null)
				.header("Content-Type", "application/json")
				.header("Cache-Control", "no-cache")
			addHeadersToRequest(requestBuilder, JSONObject(headers))

			val response = defaultClient.newBuilder()
				.connectTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
				.writeTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
				.readTimeout(HTTP_TIMEOUT, TimeUnit.SECONDS)
				.build()
				.newCall(requestBuilder.build())
				.execute()

			response.use { response ->
				var encryptedFile: File? = null
				if (response.code == 200) {
					val inputStream = response.body!!.byteStream()
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
			}
		}

	@Throws(IOException::class)
	override suspend fun writeDataFile(file: DataFile): String = withContext(Dispatchers.IO) {
		val fileHandle = File(tempDir.decrypt, file.name)
		fileHandle.writeBytes(file.data.data)
		fileHandle.toUri().toString()
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

@Throws(JSONException::class)
private fun addHeadersToRequest(request: Request.Builder, headers: JSONObject) {
	for (headerKey in headers.keys()) {
		var headerValues = headers.optJSONArray(headerKey)
		if (headerValues == null) {
			headerValues = JSONArray()
			headerValues.put(headers.getString(headerKey))
		}
		request.header(headerKey, headerValues.getString(0))
		for (i in 1 until headerValues.length()) {
			request.addHeader(headerKey, headerValues.getString(i))
		}
	}
}

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

