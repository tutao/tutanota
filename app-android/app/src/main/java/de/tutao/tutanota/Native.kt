package de.tutao.tutanota

import android.app.NotificationManager
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebMessage
import android.webkit.WebMessagePort
import android.webkit.WebMessagePort.WebMessageCallback
import androidx.core.content.FileProvider
import de.tutao.tutanota.alarms.AlarmNotification
import de.tutao.tutanota.alarms.AlarmNotificationsManager
import de.tutao.tutanota.credentials.CredentialEncryptionMode
import de.tutao.tutanota.credentials.CredentialsEncryptionFactory
import de.tutao.tutanota.push.LocalNotificationsFacade
import de.tutao.tutanota.push.SseStorage
import kotlinx.coroutines.*
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.io.PrintWriter
import java.io.StringWriter
import java.util.*
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

/**
 * Created by mpfau on 4/8/17.
 */
class Native internal constructor(
		private val activity: MainActivity,
		private val sseStorage: SseStorage,
		private val alarmNotificationsManager: AlarmNotificationsManager,
) {
	val themeManager = ThemeManager(activity)

	private val crypto = Crypto(activity)
	private val files = FileUtil(activity, LocalNotificationsFacade(activity))
	private val contact = Contact(activity)
	private val requests = mutableMapOf<String, Continuation<Any>>()
	private val credentialsEncryption = CredentialsEncryptionFactory.create(activity)

	@Volatile
	private var _webAppInitialized = CompletableDeferred<Unit>()
	val webAppInitialized: Deferred<Unit> get() = _webAppInitialized

	private var webMessagePort: WebMessagePort? = null

	fun setup() {
		activity.webView.addJavascriptInterface(this, JS_NAME)
	}

	@JavascriptInterface
	fun startWebMessageChannel() {
		// WebView.post ensures that webview methods are called on the correct thread
		activity.webView.post { initMessageChannel() }
	}

	fun initMessageChannel() {
		val webView = activity.webView
		val channel = webView.createWebMessageChannel()
		val outgoingPort = channel[0]
		webMessagePort = outgoingPort
		val incomingPort = channel[1]
		outgoingPort.setWebMessageCallback(object : WebMessageCallback() {
			override fun onMessage(port: WebMessagePort, message: WebMessage) {
				GlobalScope.launch(Dispatchers.Default) { handleMessageFromWeb(message.data) }
			}
		})

		// We send the port to the web side, this message gets handled by window.onmessage
		webView.postWebMessage(
				WebMessage("", arrayOf(incomingPort)),
				Uri.EMPTY
		)
	}

	/**
	 * Invokes method with args. The returned response is a JSON of the following format:
	 *
	 * @param msg A request (see WorkerProtocol)
	 */
	suspend fun handleMessageFromWeb(msg: String?) {
		try {
			val request = JSONObject(msg)
			if (request["type"] == "response") {
				val id = request.getString("id")
				val continuation = requests.remove(id)
				if (continuation != null) {
					continuation.resume(request)
				} else {
					Log.w(TAG, "No request for id $id")
				}
			} else {
				try {
					val result = invokeMethod(request.getString("requestType"), request.getJSONArray("args"))
					sendResponse(request, result)
				} catch (e: Throwable) {
					Log.e(TAG, "failed invocation", e)
					sendErrorResponse(request, e)
				}
			}
		} catch (e: JSONException) {
			Log.e("Native", "could not parse msg:", e)
		}
	}

	suspend fun sendRequest(type: JsRequest, args: Array<Any?>): Any {
		webAppInitialized.await()

		val request = JSONObject()
		val requestId = createRequestId()
		val arguments = JSONArray()
		for (arg in args) {
			arguments.put(arg)
		}
		request.put("id", requestId)
		request.put("type", "request")
		request.put("requestType", type.toString())
		request.put("args", arguments)
		postMessage(request)

		return suspendCoroutine { continuation ->
			requests[requestId] = continuation
		}
	}

	private fun sendResponse(request: JSONObject, value: Any?) {
		val response = JSONObject()
		try {
			response.put("id", request.getString("id"))
			response.put("type", "response")
			response.put("value", value)
			postMessage(response)
		} catch (e: JSONException) {
			throw RuntimeException(e)
		}
	}

	private fun sendErrorResponse(request: JSONObject, ex: Throwable) {
		val response = JSONObject()
		try {
			response.put("id", request.getString("id"))
			response.put("type", "requestError")
			response.put("error", ex.toJSON())
			postMessage(response)
		} catch (e: JSONException) {
			throw RuntimeException(e)
		}
	}

	private fun postMessage(json: JSONObject) {
		val port = checkNotNull(webMessagePort) { "Web bridge is not initialized yet!" }
		port.postMessage(WebMessage(json.toString()))
	}

	private suspend fun invokeMethod(method: String, args: JSONArray): Any? {
		return when (method) {
			"init" -> {
				_webAppInitialized.complete(Unit)
			}
			"reload" -> {
				_webAppInitialized = CompletableDeferred()
				activity.reload(args.getJSONObject(0).toMap())
			}
			"initPushNotifications" -> initPushNotifications()
			"generateRsaKey" -> crypto.generateRsaKey(args.getString(0).base64ToBytes())
			"rsaEncrypt" -> crypto.rsaEncrypt(
					args.getJSONObject(0),
					args.getString(1).base64ToBytes(),
					args.getString(2).base64ToBytes()
			)
			"rsaDecrypt" -> crypto.rsaDecrypt(args.getJSONObject(0), args.getString(1).base64ToBytes())
			"aesEncryptFile" -> crypto.aesEncryptFile(
					args.getString(0).base64ToBytes(),
					args.getString(1),
					args.getString(2).base64ToBytes()
			).toJSON()
			"aesDecryptFile" -> {
				val key = args.getString(0).base64ToBytes()
				val fileUrl = args.getString(1)
				crypto.aesDecryptFile(key, fileUrl)
			}
			"open" -> files.openFile(args.getString(0), args.getString(1))
			"openFileChooser" -> files.openFileChooser()
			"deleteFile" -> {
				files.delete(args.getString(0))
				null
			}
			"getName" -> files.getName(args.getString(0))
			"getMimeType" -> files.getMimeType(Uri.parse(args.getString(0)))
			"getSize" -> files.getSize(args.getString(0)).toString() + ""
			"upload" -> {
				val fileUri = args.getString(0)
				val targetUrl = args.getString(1)
				val httpMethod = args.getString(2)
				val headers = args.getJSONObject(3)
				files.upload(fileUri, targetUrl, httpMethod, headers)
			}
			"download" -> {
				val url = args.getString(0)
				val filename = args.getString(1)
				val headers = args.getJSONObject(2)
				files.download(url, filename, headers)
			}
			"joinFiles" -> {
				val filename = args.getString(0)
				val filesTojoin = jsonArrayToTypedList<String>(args.getJSONArray(1))
				files.joinFiles(filename, filesTojoin)
			}
			"splitFile" -> {
				val fileUri = args.getString(0)
				val maxChunkSize = args.getInt(1)
				files.splitFile(fileUri, maxChunkSize)
			}
			"clearFileData" -> {
				files.clearFileData()
				null
			}
			"findSuggestions" -> contact.findSuggestions(args.getString(0))
			"openLink" -> openLink(args.getString(0))
			"shareText" -> shareText(args.getString(0), args.getString(1))
			"getPushIdentifier" -> sseStorage.getPushIdentifier()
			"storePushIdentifierLocally" -> {
				val deviceIdentifier = args.getString(0)
				val userId = args.getString(1)
				val sseOrigin = args.getString(2)
				Log.d(TAG, "storePushIdentifierLocally")
				sseStorage.storePushIdentifier(deviceIdentifier, sseOrigin)
				val pushIdentifierId = args.getString(3)
				val pushIdentifierSessionKeyB64 = args.getString(4)
				sseStorage.storePushIdentifierSessionKey(userId, pushIdentifierId, pushIdentifierSessionKeyB64)
				true
			}
			"closePushNotifications" -> {
				val addressesArray = args.getJSONArray(0)
				cancelNotifications(addressesArray)
				true
			}
			"readFile" -> File(activity.filesDir, args.getString(0)).readBytes().toBase64()
			"writeFile" -> {
				val filename = args.getString(0)
				val contentInBase64 = args.getString(1)
				File(activity.filesDir, filename).writeBytes(contentInBase64.base64ToBytes())
				true
			}
			"getSelectedTheme" -> themeManager.selectedThemeId
			"setSelectedTheme" -> {
				val themeId = args.getString(0)
				themeManager.selectedThemeId = themeId
				activity.applyTheme()
				null
			}
			"getThemes" -> {
				val themesList = themeManager.themes
				JSONArray(themesList)
			}
			"setThemes" -> {
				val jsonThemes = args.getJSONArray(0)
				themeManager.setThemes(jsonThemes)
				activity.applyTheme() // reapply theme in case the current selected theme definition has changed
				null
			}
			"saveDataFile" -> files.saveDataFile(args.getString(0), args.getString(1))
			"putFileIntoDownloads" -> files.putInDownloadFolder(args.getString(0))
			"getDeviceLog" -> LogReader.getLogFile(activity).toString()
			"changeLanguage" -> null
			"scheduleAlarms" -> {
				scheduleAlarms(args.getJSONArray(0))
				null
			}
			"encryptUsingKeychain" -> {
				val encryptionMode = args.getString(0)
				val dataToEncrypt = args.getString(1)
				val mode = CredentialEncryptionMode.fromName(encryptionMode)
				val encryptedData = credentialsEncryption.encryptUsingKeychain(dataToEncrypt, mode)
				encryptedData
			}
			"decryptUsingKeychain" -> {
				val encryptionMode = args.getString(0)
				val dataToDecrypt = args.getString(1)
				val mode = CredentialEncryptionMode.fromName(encryptionMode)
				credentialsEncryption.decryptUsingKeychain(dataToDecrypt, mode)
			}
			"getSupportedEncryptionModes" -> {
				val modes = credentialsEncryption.getSupportedEncryptionModes()
				JSONArray().apply {
					for (mode in modes) {
						put(mode.modeName)
					}
				}
			}
			"hashFile" -> files.hashFile(args.getString(0))
			else -> throw Exception("unsupported method: $method")
		}
	}

	@Throws(JSONException::class)
	private fun cancelNotifications(addressesArray: JSONArray) {
		val notificationManager = activity.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
		Objects.requireNonNull(notificationManager)
		val emailAddresses = ArrayList<String>(addressesArray.length())
		for (i in 0 until addressesArray.length()) {
			notificationManager.cancel(Math.abs(addressesArray.getString(i).hashCode()))
			emailAddresses.add(addressesArray.getString(i))
		}
		activity.startService(
				LocalNotificationsFacade.notificationDismissedIntent(
						activity,
						emailAddresses, "Native", false
				)
		)
	}

	@Throws(JSONException::class)
	private fun <T> jsonArrayToTypedList(jsonArray: JSONArray): List<T> {
		val l: MutableList<T> = ArrayList(jsonArray.length())
		for (i in 0 until jsonArray.length()) {
			l.add(jsonArray[i] as T)
		}
		return l
	}

	private fun openLink(uri: String?): Boolean {
		val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
		try {
			activity.startActivity(intent)
		} catch (e: ActivityNotFoundException) {
			Log.i(TAG, "Activity for intent $uri not found.", e)
			return false
		}
		return true
	}

	private suspend fun shareText(string: String, title: String?): Boolean {

		val sendIntent = Intent(Intent.ACTION_SEND)
		sendIntent.type = "text/plain"
		sendIntent.putExtra(Intent.EXTRA_TEXT, string)

		// Shows a text title in the app chooser
		if (title != null) {
			sendIntent.putExtra(Intent.EXTRA_TITLE, title)
		}

		withContext(Dispatchers.IO) {
			// In order to show a logo thumbnail with the app chooser we need to pass a URI of a file in the filesystem
			// we just save one of our resources to the temp directory and then pass that as ClipData
			// because you can't share non 'content' URIs with other apps
			val imageName = "logo-solo-red.png"
			try {
				val logoInputStream = activity.assets.open("tutanota/images/$imageName")
				val logoFile = files.getTempDecryptedFile(imageName)
				files.writeFile(logoFile, logoInputStream)
				val logoUri = FileProvider.getUriForFile(activity, BuildConfig.FILE_PROVIDER_AUTHORITY, logoFile)
				val thumbnail = ClipData.newUri(
						activity.contentResolver,
						"tutanota_logo",
						logoUri
				)
				sendIntent.clipData = thumbnail
			} catch (e: IOException) {
				Log.e(TAG, "Error attaching thumbnail to share intent:\n${e.message}")
			}
		}

		sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
		val intent = Intent.createChooser(sendIntent, null)
		activity.startActivity(intent)
		return true
	}

	private suspend fun initPushNotifications(): Unit? {
		withContext(Dispatchers.Main) {
			activity.askBatteryOptinmizationsIfNeeded()
			activity.setupPushNotifications()
		}
		return null
	}

	@Throws(JSONException::class)
	private fun scheduleAlarms(jsonAlarmsArray: JSONArray) {
		val alarms: MutableList<AlarmNotification> = ArrayList()
		for (i in 0 until jsonAlarmsArray.length()) {
			val json = jsonAlarmsArray.getJSONObject(i)
			val alarmNotification = AlarmNotification.fromJson(json, emptyList())
			alarms.add(alarmNotification)
		}
		alarmNotificationsManager.scheduleNewAlarms(alarms)
	}

	companion object {
		private const val JS_NAME = "nativeApp"
		private const val TAG = "Native"
		private var requestId = 0

		private fun createRequestId(): String {
			return "app" + requestId++
		}

		@Throws(JSONException::class)
		private fun Throwable.toJSON(): JSONObject {
			val obj = JSONObject()
			obj.put("name", javaClass.name)
			obj.put("message", message)
			obj.put("stack", getStack())
			return obj
		}

		private fun Throwable.getStack(): String {
			val errors = StringWriter()
			printStackTrace(PrintWriter(errors))
			return errors.toString()
		}
	}
}