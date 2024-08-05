package de.tutao.tutanota.push

import android.util.Log
import de.tutao.tutanota.*
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.addCommonHeadersWithSysModelVersion
import de.tutao.tutashared.base64ToBase64Url
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.toBase64
import okhttp3.*
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.*
import java.net.URL
import java.net.URLEncoder
import java.util.*
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference
import kotlin.math.abs

class SseClient internal constructor(
	private val crypto: AndroidNativeCryptoFacade,
	private val sseStorage: SseStorage,
	private val networkObserver: NetworkObserver,
	private val sseListener: SseListener,
	private val defaultClient: OkHttpClient
) {
	@Volatile
	private var connectedSseInfo: SseInfo? = null

	@Volatile
	private var timeoutInSeconds: Long = 90
	private var failedConnectionAttempts = 0
	private val response = AtomicReference<Response?>(null)
	private val looperThread = LooperThread { connect() }
	private fun reschedule(delayInSeconds: Int) {
		if (looperThread._handler != null) {
			looperThread._handler!!.postDelayed({ connect() }, TimeUnit.SECONDS.toMillis(delayInSeconds.toLong()))
		} else {
			Log.d(TAG, "looper thread is starting, skip additional reschedule")
		}
	}

	fun restartConnectionIfNeeded(sseInfo: SseInfo) {
		val oldConnectedInfo = connectedSseInfo
		connectedSseInfo = sseInfo
		val response = response.get()
		if (response == null) {
			Log.d(TAG, "restart requested and connectionRef is not available, schedule connect")
			reschedule(0)
		} else if (
			oldConnectedInfo == null ||
			oldConnectedInfo.pushIdentifier != sseInfo.pushIdentifier ||
			oldConnectedInfo.sseOrigin != sseInfo.sseOrigin
		) {
			// If pushIdentifier or SSE origin have changed for some reason, restart the connect.
			// If user IDs have changed, do not restart, if current user is invalid we have either oldConnectedInfo
			Log.d(
				TAG,
				"restart requested, connectionRef is available, but sseInfo has changed, call disconnect to reschedule connection"
			)
			response.close()
		} else {
			Log.d(TAG, "restart requested but connectionRef available and didn't change, do nothing")
		}
	}

	private fun connect() {
		Log.d(TAG, "Starting SSE connection")
		val random = Random()
		val connectedSseInfo = this.connectedSseInfo
		if (connectedSseInfo == null) {
			Log.d(TAG, "sse info not available skip reconnect")
			return
		}
		if (!sseListener.onStartingConnection()) {
			return
		}
		timeoutInSeconds = sseStorage.getConnectTimeoutInSeconds()
		if (timeoutInSeconds == 0L) {
			timeoutInSeconds = 90
		}
		val connectionData = prepareSSEConnection(connectedSseInfo)
		try {
			var shouldNotifyAboutEstablishedConnection = true
			val response = openSseConnection(connectionData)
			Log.d(TAG, "connected, listening for events, ${response.code} ${response.isSuccessful}")
			if (!response.isSuccessful) {
				handleFailedConnection(random, connectionData.userId, null)
				return
			}

			BufferedReader(InputStreamReader(response.body!!.byteStream())).forEachLine {
				handleLine(it)
				if (shouldNotifyAboutEstablishedConnection) {
					// We expect to get at least one event right away so we don't consider the connection "established"
					// until it happens.
					sseListener.onConnectionEstablished()
					shouldNotifyAboutEstablishedConnection = false
				}
			}
		} catch (exception: Exception) {
			handleFailedConnection(random, connectionData.userId, exception)
		} finally {
			sseListener.onConnectionBroken()
			response.set(null)
		}
	}

	private fun handleFailedConnection(random: Random, userId: String, exception: Exception?) {
		val response = response.get()
		Log.d(TAG, "connection failed, $userId $exception ${response?.code}")
		try {
			// we get not authorized for the stored identifier and user ids, so remove them
			if (response != null && response.code == 401) {
				// unless there is another user id added there is no reason to try to reconnect
				Log.e(TAG, "not authorized to connect, disable reconnect")
				sseListener.onNotAuthorized(userId)
				return
			}
		} catch (e: IOException) {
			// ignore Exception when getting status code.
		}
		val delayBoundary = (timeoutInSeconds * 1.5).toInt()
		val delay = (random.nextInt(abs(timeoutInSeconds).toInt()) + delayBoundary) / 2
		failedConnectionAttempts++
		when {
			failedConnectionAttempts > RECONNECTION_ATTEMPTS -> {
				failedConnectionAttempts = 0
				Log.e(
					TAG,
					"Too many failed connection attempts, will try to sync notifications next time system wakes app up"
				)
				sseListener.onStoppingReconnectionAttempts()
			}
			networkObserver.hasNetworkConnection() -> {
				Log.e(
					TAG,
					"error opening sse, rescheduling after $delay, failedConnectionAttempts: $failedConnectionAttempts",
					exception
				)
				reschedule(delay)
			}
			else -> {
				Log.e(TAG, "network is not connected, do not reschedule ", exception)
				sseListener.onStoppingReconnectionAttempts()
			}
		}
	}

	private fun handleLine(line: String) {
		failedConnectionAttempts = 0
		if (!line.startsWith("data: ")) {
			Log.d(TAG, "heartbeat")
			return
		}
		val data = line.substring(6)
		if (data.matches(Regex("^[0-9]+$"))) return
		if (data.startsWith("heartbeatTimeout:")) {
			timeoutInSeconds = data.split(":".toRegex()).toTypedArray()[1].toInt().toLong()
			sseStorage.setConnectTimeoutInSeconds(timeoutInSeconds)
			return
		}
		sseListener.onMessage(data, connectedSseInfo)
		Log.d(TAG, "onMessage")
	}

	private fun requestJson(pushIdentifier: String, userId: String?): String {
		val jsonObject = JSONObject()
		return try {
			jsonObject.put("_format", "0")
			jsonObject.put("identifier", pushIdentifier)
			val jsonArray = JSONArray()
			val userIdObject = JSONObject()
			userIdObject.put("_id", generateId())
			userIdObject.put("value", userId)
			jsonArray.put(userIdObject)
			jsonObject.put("userIds", jsonArray)
			URLEncoder.encode(jsonObject.toString(), "UTF-8")
		} catch (e: JSONException) {
			throw RuntimeException(e)
		} catch (e: UnsupportedEncodingException) {
			throw RuntimeException(e)
		}
	}

	private fun generateId(): String {
		val bytes = ByteArray(4)
		crypto.randomizer.nextBytes(bytes)
		return bytes.toBase64().base64ToBase64Url()
	}

	private fun prepareSSEConnection(connectedSseInfo: SseInfo): ConnectionData {
		check(!connectedSseInfo.userIds.isEmpty()) { "Push identifier but no user IDs" }
		val userId = connectedSseInfo.userIds.first()
		val json = requestJson(connectedSseInfo.pushIdentifier, userId)
		val url = URL(connectedSseInfo.sseOrigin + "/sse?_body=" + json)
		return ConnectionData(userId, url)
	}

	@Throws(IOException::class)
	private fun openSseConnection(connectionData: ConnectionData): Response {
		val requestBuilder = Request.Builder()
			.url(connectionData.url)
			.method("GET", null)
			.header("Content-Type", "application/json")
			.header("Connection", "Keep-Alive")
			.header("Accept", "text/event-stream")
		addCommonHeadersWithSysModelVersion(requestBuilder)

		val req = requestBuilder.build()

		val response = defaultClient
			.newBuilder()
			.connectTimeout(5, TimeUnit.SECONDS)
			.writeTimeout(5, TimeUnit.SECONDS)
			.readTimeout((timeoutInSeconds * 1.2).toLong(), TimeUnit.SECONDS)
			.build()
			.newCall(req)
			.execute()
		this.response.set(response)
		return response
	}

	fun stopConnection() {
		val response = response.get()
		Log.d(TAG, "Disconnect sse client")
		if (response != null) {
			response.close()
			// check in connect() prevents rescheduling new connection attempts
			connectedSseInfo = null
		}
	}

	interface SseListener {
		/**
		 * @return `true` to continue connecting
		 */
		fun onStartingConnection(): Boolean

		/**
		 * Will block reading from SSE until this returns
		 */
		fun onMessage(data: String, sseInfo: SseInfo?)
		fun onConnectionEstablished()
		fun onConnectionBroken()
		fun onNotAuthorized(userId: String)
		fun onStoppingReconnectionAttempts()
	}

	private class ConnectionData constructor(val userId: String, val url: URL)
	companion object {
		private const val TAG = "SSE"
		const val RECONNECTION_ATTEMPTS = 3
	}

	init {
		looperThread.start()
		networkObserver.setNetworkConnectivityListener { connected ->
			val connection = response.get()
			if (connected && connection == null) {
				Log.d(TAG, "ConnectionRef not available, schedule connect because of network state change")
				reschedule(0)
			}
		}
	}
}