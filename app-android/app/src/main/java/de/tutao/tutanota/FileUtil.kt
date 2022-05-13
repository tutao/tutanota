package de.tutao.tutanota

import android.Manifest
import android.annotation.TargetApi
import android.app.Activity
import android.app.DownloadManager
import android.content.*
import android.net.Uri
import android.os.*
import android.provider.MediaStore
import android.util.Log
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import de.tutao.tutanota.push.LocalNotificationsFacade
import org.apache.commons.io.IOUtils
import org.apache.commons.io.input.BoundedInputStream
import org.jdeferred.DoneFilter
import org.jdeferred.DonePipe
import org.jdeferred.Promise
import org.jdeferred.impl.DeferredObject
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
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit

class FileUtil(private val activity: MainActivity, private val localNotificationsFacade: LocalNotificationsFacade) {
	private val backgroundTasksExecutor = ThreadPoolExecutor(
			1,  // core pool size
			4,  // max pool size
			10,  // keepalive time
			TimeUnit.SECONDS,
			LinkedBlockingQueue()
	)

	private fun requestStoragePermission(): Promise<ActivityResult?, Exception, Void> {
		// Requesting android runtime permissions. (Android 5+)
		// We only need to request the read permission even if we want to get write access. There is only one permission of a permission group necessary to get
		// access to all permission of that permission group. We still have to declare write access in the manifest.
		// https://developer.android.com/guide/topics/security/permissions.html#perm-groups
		return activity.getPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE)
	}

	@Throws(Exception::class)
	fun delete(fileUri: String) {
		if (fileUri.startsWith(Uri.fromFile(Utils.getDir(activity)).toString())) {
			// we do not deleteAlarmNotification files that are not stored in our cache dir
			if (!File(Uri.parse(fileUri).path!!).delete()) {
				throw Exception("could not deleteAlarmNotification file $fileUri")
			}
		}
	}

	@Throws(IOException::class)
	fun joinFiles(fileName: String, filesToJoin: List<String>): String {
		val inStreams: MutableList<InputStream> = ArrayList(filesToJoin.size)
		for (infile in filesToJoin) {
			inStreams.add(FileInputStream(Uri.parse(infile).path))
		}
		val output = getTempDecryptedFile(fileName)
		writeFile(output, SequenceInputStream(Collections.enumeration(inStreams)))
		return Utils.fileToUri(output)
	}

	fun openFileChooser(): Promise<Any?, Exception, Void> {
		val intent = Intent(Intent.ACTION_GET_CONTENT)
		intent.type = "*/*"
		intent.addCategory(Intent.CATEGORY_OPENABLE)
		intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
		intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true)
		val chooser = Intent.createChooser(intent, "Select File")
		return activity.startActivityForResult(chooser)
				.then(DonePipe { result: ActivityResult? ->
					val selectedFiles = JSONArray()
					if (result!!.resultCode == Activity.RESULT_OK) {
						val clipData = result.data.clipData
						try {
							if (clipData != null) {
								var i = 0
								while (i < clipData.itemCount) {
									val item = clipData.getItemAt(i)
									selectedFiles.put(item.uri.toString())
									i++
								}
							} else {
								val uri = result.data.data
								selectedFiles.put(uri.toString())
							}
						} catch (e: Exception) {
							return@DonePipe DeferredObject<Any, Exception, Void>().reject(e)
						}
					}
					Utils.resolvedDeferred<Any, Exception, Void>(selectedFiles)
				} as DonePipe<ActivityResult?, Any?, Exception, Void>)
	}

	// @see: https://developer.android.com/reference/android/support/v4/content/FileProvider.html
	fun openFile(fileUri: String?, mimeType: String?): Promise<Boolean, Exception, Void> {
		var file = Uri.parse(fileUri)
		val scheme = file.scheme
		if ("file" == scheme) {
			file = FileProvider.getUriForFile(activity, BuildConfig.FILE_PROVIDER_AUTHORITY, File(file.path))
		}
		val intent = Intent(Intent.ACTION_VIEW)
		intent.setDataAndType(file, getCorrectedMimeType(file, mimeType))
		intent.flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
		return activity.startActivityForResult(intent)
				.then(DoneFilter<ActivityResult?, Boolean> { result: ActivityResult? -> result!!.resultCode == Activity.RESULT_OK })
	}

	private fun getCorrectedMimeType(fileUri: Uri, storedMimeType: String?): String {
		return if (storedMimeType == null || storedMimeType.isEmpty() || storedMimeType == "application/octet-stream") {
			getMimeType(fileUri)
		} else {
			storedMimeType
		}
	}

	fun getMimeType(fileUri: Uri): String {
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

	fun putToDownloadFolder(fileUriString: String): Promise<Any, Exception, Void> {
		return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
			val promise = DeferredObject<Any, Exception, Void>()
			backgroundTasksExecutor.execute {
				try {
					promise.resolve(addFileToDownloadsMediaStore(fileUriString))
				} catch (e: Exception) {
					promise.reject(e)
				} catch (e: Throwable) {
					// For everything else
					promise.reject(RuntimeException(e))
				}
			}
			promise
		} else {
			requestStoragePermission().then(DonePipe { nothing: ActivityResult? ->
				val promise = DeferredObject<Any, Exception, Void>()
				backgroundTasksExecutor.execute {
					try {
						promise.resolve(addFileToDownloadsOld(fileUriString))
					} catch (e: Exception) {
						promise.reject(e)
					} catch (e: Throwable) {
						// For everything else
						promise.reject(RuntimeException(e))
					}
				}
				promise
			} as DonePipe<ActivityResult?, Any, Exception, Void>)
		}
	}

	@TargetApi(Build.VERSION_CODES.Q)
	@Throws(IOException::class, FileOpenException::class)
	private fun addFileToDownloadsMediaStore(fileUriString: String): String {
		val contentResolver = activity.contentResolver
		val fileUri = Uri.parse(fileUriString)
		val fileInfo = Utils.getFileInfo(activity, fileUri)
		val values = ContentValues()
		values.put(MediaStore.MediaColumns.IS_PENDING, 1)
		val mimeType = getMimeType(fileUri)
		values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
		values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileInfo.name)
		values.put(MediaStore.MediaColumns.SIZE, fileInfo.size)
		val outputUri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
				?: throw FileOpenException("Could not insert into downloads, no output URI")
		val `is` = Objects.requireNonNull(contentResolver.openInputStream(fileUri))
		val os = contentResolver.openOutputStream(outputUri)
		val copiedBytes = IOUtils.copyLarge(`is`, os)
		Log.d(TAG, "Copied $copiedBytes")
		val updateValues = ContentValues()
		updateValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
		val updated = contentResolver.update(outputUri, updateValues, null, null)
		Log.d(TAG, "Updated with not pending: $updated")
		localNotificationsFacade.sendDownloadFinishedNotification(fileInfo.name)
		return outputUri.toString()
	}

	@Throws(IOException::class)
	private fun addFileToDownloadsOld(fileUri: String): String {
		val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
		if (!downloadsDir.exists()) {
			val created = downloadsDir.mkdirs()
			if (!created) {
				throw IOException("Could not create downloads folder")
			}
		}
		val file = Uri.parse(fileUri)
		val fileInfo = Utils.getFileInfo(activity, file)
		val newFile = File(downloadsDir, fileInfo.name)
		IOUtils.copyLarge(activity.contentResolver.openInputStream(file), FileOutputStream(newFile), ByteArray(4096))
		val downloadManager = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
		downloadManager.addCompletedDownload(newFile.name, "Tutanota download",
				false, getMimeType(Uri.fromFile(newFile)), newFile.absolutePath, fileInfo.size, true)
		return Uri.fromFile(newFile).toString()
	}

	@Throws(FileNotFoundException::class)
	fun getSize(fileUri: String?): Long {
		return Utils.getFileInfo(activity, Uri.parse(fileUri)).size
	}

	@Throws(FileNotFoundException::class)
	fun getName(fileUri: String): String {
		return Utils.getFileInfo(activity, Uri.parse(fileUri)).name
	}

	@Throws(IOException::class, JSONException::class)
	fun upload(fileUri: String?, targetUrl: String?, httpMethod: String?, headers: JSONObject): JSONObject {
		val parsedUri = Uri.parse(fileUri)
		val inputStream = activity.contentResolver.openInputStream(parsedUri)
		val con = URL(targetUrl).openConnection() as HttpURLConnection
		return try {
			val fileSize = inputStream!!.available()
			// this disables internal buffering of the output stream
			con.setFixedLengthStreamingMode(fileSize)
			con.connectTimeout = HTTP_TIMEOUT
			// infinite timeout
			// - the server stops listening after 10 minutes -> SocketException
			// - if the internet connection dies -> SocketException
			// we don't want to time out in case of a slow connection because we may already be
			// waiting for the response code while the TCP stack is still busy sending our data
			con.readTimeout = 0
			con.requestMethod = httpMethod
			con.doInput = true
			con.doOutput = true
			con.useCaches = false
			con.setRequestProperty("Content-Type", "application/octet-stream")
			addHeadersToRequest(con, headers)
			con.connect()
			IOUtils.copy(inputStream, con.outputStream)

			// this would run into the read timeout if the upload is still running
			val responseCode = con.responseCode
			val response = JSONObject()
					.put("statusCode", responseCode)
					.put("errorId", con.getHeaderField("Error-Id")) // see ResourceConstants.ERROR_ID_HEADER
					.put("precondition", con.getHeaderField("Precondition")) // see ResourceConstants.PRECONDITION_HEADER
					.put("suspensionTime", con.getHeaderField("Retry-After"))
			if (responseCode >= 200 && responseCode < 300) {
				val responseBodyStream = ByteArrayOutputStream()
				IOUtils.copy(con.inputStream, responseBodyStream)
				response.put("responseBody", Utils.bytesToBase64(responseBodyStream.toByteArray()))
			}
			if (!response.has("suspensionTime")) { // enters this block if "Retry-After" header is not set
				response.put("suspensionTime", con.getHeaderField("Suspension-Time"))
			}
			response
		} finally {
			con.disconnect()
		}
	}

	@Throws(IOException::class, JSONException::class)
	fun download(sourceUrl: String?, filename: String, headers: JSONObject): JSONObject {
		var con: HttpURLConnection? = null
		return try {
			con = URL(sourceUrl).openConnection() as HttpURLConnection
			con.connectTimeout = HTTP_TIMEOUT
			con.readTimeout = HTTP_TIMEOUT
			con.requestMethod = "GET"
			con.doInput = true
			con.useCaches = false
			addHeadersToRequest(con, headers)
			con.connect()
			var encryptedFile: File? = null
			if (con.responseCode == 200) {
				val inputStream = con.inputStream
				encryptedFile = getTempEncryptedFile(filename)
				writeFile(encryptedFile, inputStream)
			}
			val result = JSONObject()
					.put("statusCode", con.responseCode)
					.put("encryptedFileUri", if (encryptedFile != null) Utils.fileToUri(encryptedFile) else JSONObject.NULL)
					.put("errorId", con.getHeaderField("Error-Id")) // see ResourceConstants.ERROR_ID_HEADER
					.put("precondition", con.getHeaderField("Precondition")) // see ResourceConstants.PRECONDITION_HEADER
					.put("suspensionTime", con.getHeaderField("Retry-After"))
			if (!result.has("suspensionTime")) {
				result.put("suspensionTime", con.getHeaderField("Suspension-Time"))
			}
			result
		} finally {
			con?.disconnect()
		}
	}

	@Throws(IOException::class)
	fun writeFile(filePath: File, inputStream: InputStream) {
		filePath.parentFile.mkdirs()
		IOUtils.copyLarge(inputStream, FileOutputStream(filePath), ByteArray(COPY_BUFFER_SIZE))
	}

	@Throws(IOException::class)
	fun saveDataFile(name: String, base64blob: String): String {
		val localPath = getTempDecryptedFile(name)
		writeFile(localPath, ByteArrayInputStream(Utils.base64ToBytes(base64blob)))
		val targetUri = Uri.fromFile(localPath)
		return targetUri.toString()
	}

	fun clearFileData() {
		cleanupDir(Crypto.TEMP_DIR_DECRYPTED)
		cleanupDir(Crypto.TEMP_DIR_ENCRYPTED)
	}

	private fun cleanupDir(dirname: String) {
		val files = File(Utils.getDir(activity), dirname).listFiles()
		if (files != null) {
			for (file in files) {
				file.delete()
			}
		}
	}

	@Throws(IOException::class, NoSuchAlgorithmException::class, JSONException::class)
	fun splitFile(fileUri: String?, maxChunkSize: Int): JSONArray {
		val file = Uri.parse(fileUri)
		val fileSize = Utils.getFileInfo(activity, file).size
		val inputStream = activity.contentResolver.openInputStream(file)
		val chunkUris: MutableList<String?> = ArrayList()
		var chunk = 0
		while (chunk * maxChunkSize <= fileSize) {
			val tmpFilename = Integer.toHexString(file.hashCode()) + "." + chunk + ".blob"
			val chunkedInputStream = BoundedInputStream(inputStream, maxChunkSize.toLong())
			val tmpFile = getTempDecryptedFile(tmpFilename)
			writeFile(tmpFile, chunkedInputStream)
			chunkUris.add(Utils.fileToUri(tmpFile))
			chunk++
		}
		return JSONArray(chunkUris)
	}

	@Throws(IOException::class, NoSuchAlgorithmException::class)
	fun hashFile(fileUri: String): String {
		val inputStream = activity.contentResolver.openInputStream(Uri.parse(fileUri))!!
		val hashingInputStream = HashingInputStream(MessageDigest.getInstance("SHA-256"), inputStream)
		val devNull: OutputStream = object : OutputStream() {
			override fun write(b: Int) {}
		}
		IOUtils.copyLarge(hashingInputStream, devNull)
		val hash = hashingInputStream.hash()
		return Utils.bytesToBase64(Arrays.copyOf(hash, 6))
	}

	@Throws(IOException::class)
	fun getTempDecryptedFile(filename: String): File {
		return getTempFile(filename, Crypto.TEMP_DIR_DECRYPTED)
	}

	@Throws(IOException::class)
	private fun getTempEncryptedFile(filename: String): File {
		return getTempFile(filename, Crypto.TEMP_DIR_ENCRYPTED)
	}

	@Throws(IOException::class)
	private fun getTempFile(filename: String, directory: String): File {
		val dir = File(Utils.getDir(activity), directory)
		return File(dir, filename)
	}

	companion object {
		private const val TAG = "FileUtil"
		private const val HTTP_TIMEOUT = 15 * 1000
		const val COPY_BUFFER_SIZE = 1024 * 1000

		@Throws(JSONException::class)
		private fun addHeadersToRequest(connection: URLConnection, headers: JSONObject) {
			val iter: Iterator<*> = headers.keys()
			while (iter.hasNext()) {
				val headerKey = iter.next().toString()
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
	}
}

class FileOpenException(message: String) : Exception(message)