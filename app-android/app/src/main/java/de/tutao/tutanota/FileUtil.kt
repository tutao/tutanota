package de.tutao.tutanota

import android.Manifest
import android.annotation.TargetApi
import android.app.Activity
import android.app.DownloadManager
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
import de.tutao.tutanota.ipc.DownloadTaskResponse
import de.tutao.tutanota.ipc.FileFacade
import de.tutao.tutanota.ipc.IpcClientRect
import de.tutao.tutanota.ipc.UploadTaskResponse
import de.tutao.tutanota.push.LocalNotificationsFacade
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
import java.util.*

class FileUtil(
		private val activity: MainActivity,
		private val localNotificationsFacade: LocalNotificationsFacade
) : FileFacade {

	@Throws(Exception::class)
	override suspend fun deleteFile(file: String) {
		if (file.startsWith(Uri.fromFile(getDir(activity)).toString())) {
			// we do not deleteAlarmNotification files that are not stored in our cache dir
			if (!File(Uri.parse(file).path!!).delete()) {
				throw Exception("could not deleteAlarmNotification file $file")
			}
		}
	}

	@Throws(IOException::class)
	override suspend fun joinFiles(filename: String, files: List<String>): String {
		val inStreams: MutableList<InputStream> = ArrayList(files.size)
		for (infile in files) {
			inStreams.add(FileInputStream(Uri.parse(infile).path))
		}
		val output = getTempDecryptedFile(filename)
		writeFileStream(output, SequenceInputStream(Collections.enumeration(inStreams)))
		return output.toString()
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
	override suspend fun open(location: String, mimeType: String): Unit {
		val file = File(location).toUri().let { uri ->
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

	override suspend fun getMimeType(file: String): String {
		val fileUri = file.toUri()
		val scheme = fileUri.scheme
		if ("file" == scheme) {
			val extension = MimeTypeMap.getFileExtensionFromUrl(fileUri.toString())
			val type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
			if (type != null) {
				return type
			}
		} else if ("content" == scheme) {
			val type = activity.contentResolver.getType(fileUri)
			if (type != null) {
				return type
			}
		}
		return "application/octet-stream"
	}

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
		val fileUri = File(fileUriString).toUri()
		val fileInfo = getFileInfo(activity, fileUri)
		val values = ContentValues()
		values.put(MediaStore.MediaColumns.IS_PENDING, 1)
		val mimeType = getMimeType(fileUri.toString())
		values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
		values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileInfo.name)
		values.put(MediaStore.MediaColumns.SIZE, fileInfo.size)
		val outputUri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
				?: throw FileOpenException("Could not insert into downloads, no output URI")
		val inputStream = contentResolver.openInputStream(fileUri)!!
		val outputStream = contentResolver.openOutputStream(outputUri)
		val copiedBytes = IOUtils.copyLarge(inputStream, outputStream)
		Log.d(TAG, "Copied $copiedBytes")
		val updateValues = ContentValues()
		updateValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
		val updated = contentResolver.update(outputUri, updateValues, null, null)
		Log.d(TAG, "Updated with not pending: $updated")
		localNotificationsFacade.sendDownloadFinishedNotification(fileInfo.name)
		return outputUri.toString()
	}

	private suspend fun addFileToDownloadsOld(fileUri: String): String {
		val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
		if (!downloadsDir.exists()) {
			val created = downloadsDir.mkdirs()
			if (!created) {
				throw IOException("Could not create downloads folder")
			}
		}
		val file = Uri.parse(fileUri)
		val fileInfo = getFileInfo(activity, file)
		val newFile = File(downloadsDir, fileInfo.name)
		IOUtils.copyLarge(activity.contentResolver.openInputStream(file), FileOutputStream(newFile), ByteArray(4096))
		val downloadManager = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
		downloadManager.addCompletedDownload(
				newFile.name, "Tutanota download",
				false, getMimeType(newFile.absolutePath), newFile.absolutePath, fileInfo.size, true
		)
		return Uri.fromFile(newFile).toString()
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
						responseBodyStream.toByteArray().toBase64()
					} else {
						""
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
						encryptedFile = getTempEncryptedFile(filename)
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
	override suspend fun writeFile(file: String, contentB64: String): Unit {
		File(activity.filesDir, file).writeBytes(contentB64.base64ToBytes())
	}

	@Throws(IOException::class)
	override suspend fun readFile(file: String): String {
		return File(activity.filesDir, file).readBytes().toBase64()
	}

	@Throws(IOException::class)
	suspend fun writeFileStream(filePath: File, inputStream: InputStream) = withContext(Dispatchers.IO) {
		filePath.parentFile.mkdirs()
		IOUtils.copyLarge(inputStream, FileOutputStream(filePath), ByteArray(COPY_BUFFER_SIZE))
	}

	@Throws(IOException::class)
	override suspend fun saveDataFile(name: String, dataBase64: String): String = withContext(Dispatchers.IO) {
		val localPath = getTempDecryptedFile(name)
		writeFileStream(localPath, ByteArrayInputStream(dataBase64.base64ToBytes()))
		localPath.toUri().toString()
	}

	override suspend fun clearFileData() {
		cleanupDir(AndroidNativeCryptoFacade.TEMP_DIR_DECRYPTED)
		cleanupDir(AndroidNativeCryptoFacade.TEMP_DIR_ENCRYPTED)
	}

	private suspend fun cleanupDir(dirname: String) = withContext(Dispatchers.IO) {
		val files = File(getDir(activity), dirname).listFiles()
		if (files != null) {
			for (file in files) {
				file.delete()
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
			val tmpFile = getTempDecryptedFile(tmpFilename)
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

	@Throws(IOException::class)
	fun getTempDecryptedFile(filename: String): File {
		return getTempFile(filename, AndroidNativeCryptoFacade.TEMP_DIR_DECRYPTED)
	}

	@Throws(IOException::class)
	private fun getTempEncryptedFile(filename: String): File {
		return getTempFile(filename, AndroidNativeCryptoFacade.TEMP_DIR_ENCRYPTED)
	}

	@Throws(IOException::class)
	private fun getTempFile(filename: String, directory: String): File {
		val dir = File(getDir(activity), directory)
		return File(dir, filename)
	}

	private companion object {
		const val TAG = "FileUtil"
		const val HTTP_TIMEOUT = 15 * 1000
		const val COPY_BUFFER_SIZE = 1024 * 1000
	}

	private suspend fun getCorrectedMimeType(fileUri: Uri, storedMimeType: String?): String {
		return if (storedMimeType == null || storedMimeType.isEmpty() || storedMimeType == "application/octet-stream") {
			getMimeType(fileUri.toString())
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