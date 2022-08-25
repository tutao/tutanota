package de.tutao.tutanota

import android.Manifest
import android.annotation.TargetApi
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
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import de.tutao.tutanota.ipc.*
import de.tutao.tutanota.push.LocalNotificationsFacade
import de.tutao.tutanota.push.showDownloadNotification
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.apache.commons.io.IOUtils
import org.apache.commons.io.input.BoundedInputStream
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.*
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLConnection
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import java.security.SecureRandom
import java.util.*

class TempDir(
		private val context: Context,
		random: SecureRandom = SecureRandom()
) {
	private val randomTempDirectory = random.bytes(16).toBase64().base64ToBase64Url()

	// We can only read from the temp/ subdir as configured in paths.xml
	val root get() = File(context.filesDir, "temp/$randomTempDirectory").apply { mkdirs() }
	val encrypt get() = File(context.filesDir, "temp/$randomTempDirectory/encrypted").apply { mkdirs() }
	val decrypt get() = File(context.filesDir, "temp/$randomTempDirectory/decrypted").apply { mkdirs() }
}

class AndroidFileFacade(
		private val activity: MainActivity,
		private val localNotificationsFacade: LocalNotificationsFacade,
		private val random: SecureRandom
) : FileFacade {

	constructor(activity: MainActivity, localNotificationsFacade: LocalNotificationsFacade) : this(activity, localNotificationsFacade, SecureRandom())

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
		val output = File(tempDir.decrypt, filename)
		writeFileStream(output, SequenceInputStream(Collections.enumeration(inStreams)))
		return output.toUri().toString()
	}

	override suspend fun openFileChooser(boundingRect: IpcClientRect): List<String> {
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

	override suspend fun putFileIntoDownloadsFolder(localFileUri: String): String = withContext(Dispatchers.IO) {
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
			addFileToDownloadsMediaStore(localFileUri)
		} else {
			activity.getPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
			addFileToDownloadsOld(localFileUri)
		}
	}

	@TargetApi(Build.VERSION_CODES.Q)
	private suspend fun addFileToDownloadsMediaStore(fileUriString: String): String {
		val contentResolver = activity.contentResolver
		val fileUri = fileUriString.toUri()
		val fileInfo = getFileInfo(activity, fileUri)
		val outputUri = contentResolver.insert(
				MediaStore.Downloads.EXTERNAL_CONTENT_URI,
				ContentValues().apply {
					put(MediaStore.MediaColumns.IS_PENDING, 1)
					put(MediaStore.MediaColumns.MIME_TYPE, getMimeType(fileUri.toString()))
					put(MediaStore.MediaColumns.DISPLAY_NAME, fileInfo.name)
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
		localNotificationsFacade.sendDownloadFinishedNotification(fileInfo.name)
		return outputUri.toString()
	}

	private fun addFileToDownloadsOld(fileUri: String): String {
		val downloadsDir = ensureRandomDownloadDir()
		val file = Uri.parse(fileUri)
		val fileInfo = getFileInfo(activity, file)
		val newFile = File(downloadsDir, fileInfo.name)
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
	override suspend fun upload(fileUrl: String, targetUrl: String, method: String, headers: Map<String, String>): UploadTaskResponse =
			withContext(Dispatchers.IO) {
				val parsedUri = Uri.parse(fileUrl)
				val inputStream = activity.contentResolver.openInputStream(parsedUri)!!
				val con = URL(targetUrl).openConnection() as HttpURLConnection
				try {
					val fileSize = inputStream.available()
					// this disables internal buffering of the output stream
					con.setFixedLengthStreamingMode(fileSize)
					con.connectTimeout = HTTP_TIMEOUT
					// infinite timeout
					// - the server stops listening after 10 minutes -> SocketException
					// - if the internet connection dies -> SocketException
					// we don't want to time out in case of a slow connection because we may already be
					// waiting for the response code while the TCP stack is still busy sending our data
					con.readTimeout = 0
					con.requestMethod = method
					con.doInput = true
					con.doOutput = true
					con.useCaches = false
					con.setRequestProperty("Content-Type", "application/octet-stream")
					addHeadersToRequest(con, JSONObject(headers))
					con.connect()
					IOUtils.copy(inputStream, con.outputStream)

					// this would run into the read timeout if the upload is still running
					val responseCode = con.responseCode
					val suspensionTime = con.getHeaderField("Retry-After") ?: con.getHeaderField("Suspension-Time")
					val responseBody = if (responseCode in 200..299) {
						val responseBodyStream = ByteArrayOutputStream()
						IOUtils.copy(con.inputStream, responseBodyStream)
						responseBodyStream.toByteArray().wrap()
					} else {
						byteArrayOf().wrap()
					}
					UploadTaskResponse(
							statusCode = responseCode,
							errorId = con.getHeaderField("Error-Id"),
							precondition = con.getHeaderField("Precondition"),
							suspensionTime = suspensionTime,
							responseBody = responseBody
					)
				} finally {
					con.disconnect()
				}
			}

	@Throws(IOException::class, JSONException::class)
	override suspend fun download(sourceUrl: String, filename: String, headers: Map<String, String>): DownloadTaskResponse =
			withContext(Dispatchers.IO) {
				val con: HttpURLConnection = URL(sourceUrl).openConnection() as HttpURLConnection
				try {
					con.connectTimeout = HTTP_TIMEOUT
					con.readTimeout = HTTP_TIMEOUT
					con.requestMethod = "GET"
					con.doInput = true
					con.useCaches = false
					addHeadersToRequest(con, JSONObject(headers))

					con.connect()
					var encryptedFile: File? = null
					if (con.responseCode == 200) {
						val inputStream = con.inputStream
						encryptedFile = File(tempDir.encrypt, filename)
						writeFileStream(encryptedFile, inputStream)
					}

					DownloadTaskResponse(
							statusCode = con.responseCode,
							errorId = con.getHeaderField("Error-Id"),
							precondition = con.getHeaderField("Precondition"),
							suspensionTime = con.getHeaderField("Retry-After") ?: con.getHeaderField("Suspension-Time"),
							encryptedFileUri = encryptedFile?.toUri().toString(),
					)
				} finally {
					con.disconnect()
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
		throw Error("FileFacade.readDataFile should not be used in Android")
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
	override suspend fun splitFile(fileUri: String, maxChunkSizeBytes: Int): List<String> = withContext(Dispatchers.IO) {
		val file = Uri.parse(fileUri)
		val fileSize = getFileInfo(activity, file).size
		val inputStream = activity.contentResolver.openInputStream(file)
		val chunkUris: MutableList<String> = ArrayList()
		var chunk = 0
		while (chunk * maxChunkSizeBytes <= fileSize) {
			val tmpFilename = Integer.toHexString(file.hashCode()) + "." + chunk + ".blob"
			val chunkedInputStream = BoundedInputStream(inputStream, maxChunkSizeBytes.toLong())
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
		const val HTTP_TIMEOUT = 15 * 1000
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
private fun addHeadersToRequest(connection: URLConnection, headers: JSONObject) {
	for (headerKey in headers.keys()) {
		var headerValues = headers.optJSONArray(headerKey)
		if (headerValues == null) {
			headerValues = JSONArray()
			headerValues.put(headers.getString(headerKey))
		}
		connection.setRequestProperty(headerKey, headerValues.getString(0))
		for (i in 1 until headerValues.length()) {
			connection.addRequestProperty(headerKey, headerValues.getString(i))
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