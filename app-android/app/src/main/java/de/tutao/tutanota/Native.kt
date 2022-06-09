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
import de.tutao.tutanota.ipc.AndroidGlobalDispatcher
import de.tutao.tutanota.ipc.NativeInterface
import de.tutao.tutanota.push.LocalNotificationsFacade
import de.tutao.tutanota.push.SseStorage
import kotlinx.coroutines.*
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonPrimitive
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
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
		private val globalDispatcher: AndroidGlobalDispatcher,
		private val files: FileUtil
) : NativeInterface {

	private val json = Json.Default
	private val crypto = Crypto(activity)
	private val contact = Contact(activity)
	private val requests = mutableMapOf<String, Continuation<String>>()
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


	private fun makeCursedJsonArray(args: List<String>): JSONArray {
		val cursedJsonArray = args.joinToString(prefix = "[", postfix = "]")
		return JSONArray(cursedJsonArray)
	}
	/**
	 * Invokes method with args.
	 *
	 * @param msg A request (see WorkerProtocol)
	 */
	suspend fun handleMessageFromWeb(msg: String) {
		val (type, id, rest) = msg.split("\n", limit = 3)
		when (type) {
			"response" -> {
				val continuation = requests.remove(id)
				if (continuation != null) {
					continuation.resume(rest)
				} else {
					Log.w(TAG, "No request for id $id")
				}
			}
			"request" -> {
				val requestParts = rest.split("\n")
				val requestType = requestParts[0]
				val args = requestParts.slice(1..requestParts.lastIndex)
				try {
					val result = invokeMethod(requestType, args)
					sendResponse(id, result)
				} catch (e: Throwable) {
					Log.e(TAG, "failed invocation", e)
					sendErrorResponse(id, e)
				}
			}
			else -> error("unknown message type")
		}
	}

	override suspend fun sendRequest(requestType: String, args: List<String>): String {
		webAppInitialized.await()
		val requestId = createRequestId()
		val builder = StringBuilder()
		builder.appendLine("request")
		builder.appendLine(requestId)
		builder.appendLine(requestType)
		for (arg in args) {
			builder.appendLine(arg)
		}
		// remove last newline
		if (builder.isNotEmpty()) {
			builder.setLength(builder.length - 1);
		}

		postMessage(builder.toString())

		return suspendCoroutine { continuation ->
			requests[requestId] = continuation
		}
	}

	private fun sendResponse(requestId: String, value: String) {
		Log.d(TAG, "sending response with val=$value")
		val result = StringBuilder()
		result.appendLine("response")
		result.appendLine(requestId)
		result.append(value)

		postMessage(result.toString())
	}

	private fun sendErrorResponse(requestId: String, ex: Throwable) {
		val builder = StringBuilder()
		builder.appendLine("requestError")
		builder.appendLine(requestId)
		builder.appendLine(ex.toJSON().toString())
		postMessage(builder.toString())
	}

	private fun postMessage(message: String) {
		val port = checkNotNull(webMessagePort) { "Web bridge is not initialized yet!" }
		port.postMessage(WebMessage(message))
	}

	private suspend fun invokeMethod(method: String, args: List<String>): String {
		val jsonArray = makeCursedJsonArray(args)
		Log.d(TAG, "method=$method with cursedJson: $jsonArray")
		if (method == "ipc") {
			return globalDispatcher.dispatch(
					jsonArray.getString(0),
					jsonArray.getString(1),
					args.slice(2..args.lastIndex)
			)
		}

		return when (method) {
			"init" -> {
				_webAppInitialized.complete(Unit)
				json.encodeToString<Boolean?>(null)
			}
			"reload" -> {
				_webAppInitialized = CompletableDeferred()
				json.encodeToString(activity.reload(jsonArray.getJSONObject(0).toMap()))
			}
			"initPushNotifications" -> {
				initPushNotifications()
				json.encodeToString<Boolean?>(null)
			}
			"generateRsaKey" -> json.encodeToString(crypto.generateRsaKey(jsonArray.getString(0).base64ToBytes()))
			"rsaEncrypt" -> json.encodeToString(crypto.rsaEncrypt(
					jsonArray.getJSONObject(0),
					jsonArray.getString(1).base64ToBytes(),
					jsonArray.getString(2).base64ToBytes()
			))
			"rsaDecrypt" -> json.encodeToString(crypto.rsaDecrypt(jsonArray.getJSONObject(0), jsonArray.getString(1).base64ToBytes()))
			"aesEncryptFile" -> crypto.aesEncryptFile(
					jsonArray.getString(0).base64ToBytes(),
					jsonArray.getString(1),
					jsonArray.getString(2).base64ToBytes()
			).toJSON().toString()
			"aesDecryptFile" -> {
				val key = jsonArray.getString(0).base64ToBytes()
				val fileUrl = jsonArray.getString(1)
				json.encodeToString(crypto.aesDecryptFile(key, fileUrl))
			}
			"findSuggestions" -> contact.findSuggestions(jsonArray.getString(0)).toString()
			"openLink" -> JsonPrimitive(openLink(jsonArray.getString(0))).toString()
			"shareText" -> JsonPrimitive(shareText(jsonArray.getString(0), jsonArray.getString(1))).toString()
			"getPushIdentifier" -> JsonPrimitive(sseStorage.getPushIdentifier()).toString()
			"storePushIdentifierLocally" -> {
				val deviceIdentifier = jsonArray.getString(0)
				val userId = jsonArray.getString(1)
				val sseOrigin = jsonArray.getString(2)
				sseStorage.storePushIdentifier(deviceIdentifier, sseOrigin)
				val pushIdentifierId = jsonArray.getString(3)
				val pushIdentifierSessionKeyB64 = jsonArray.getString(4)
				sseStorage.storePushIdentifierSessionKey(userId, pushIdentifierId, pushIdentifierSessionKeyB64)
				json.encodeToString<Boolean?>(null)
			}
			"closePushNotifications" -> {
				val addressesArray = jsonArray.getJSONArray(0)
				cancelNotifications(addressesArray)
				json.encodeToString<Boolean?>(null)
			}
			"getDeviceLog" -> json.encodeToString<String>(LogReader.getLogFile(activity).toString())
			"changeLanguage" -> json.encodeToString<Boolean?>(null)
			"scheduleAlarms" -> {
				scheduleAlarms(jsonArray.getJSONArray(0))
				json.encodeToString<Boolean?>(null)
			}
			"encryptUsingKeychain" -> {
				val encryptionMode = jsonArray.getString(0)
				val dataToEncrypt = jsonArray.getString(1)
				val mode = CredentialEncryptionMode.fromName(encryptionMode)
				val encryptedData = credentialsEncryption.encryptUsingKeychain(dataToEncrypt, mode)
				JsonPrimitive(encryptedData).toString()
			}
			"decryptUsingKeychain" -> {
				val encryptionMode = jsonArray.getString(0)
				val dataToDecrypt = jsonArray.getString(1)
				val mode = CredentialEncryptionMode.fromName(encryptionMode)
				val decryptedData = credentialsEncryption.decryptUsingKeychain(dataToDecrypt, mode)
				JsonPrimitive(decryptedData).toString()
			}
			"getSupportedEncryptionModes" -> {
				val modes = credentialsEncryption.getSupportedEncryptionModes()
				json.encodeToString(modes.map { it.modeName })
			}
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
				files.writeFileStream(logoFile, logoInputStream)
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

	private suspend fun initPushNotifications() {
		withContext(Dispatchers.Main) {
			activity.askBatteryOptinmizationsIfNeeded()
			activity.setupPushNotifications()
		}
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