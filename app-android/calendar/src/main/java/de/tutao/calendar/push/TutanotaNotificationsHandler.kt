package de.tutao.calendar.push

import android.util.Log
import androidx.lifecycle.LifecycleCoroutineScope
import de.tutao.calendar.R
import de.tutao.calendar.alarms.AlarmNotificationsManager
import de.tutao.tutashared.addCommonHeadersWithSysModelVersion
import de.tutao.tutashared.alarms.EncryptedAlarmNotification
import de.tutao.tutashared.base64ToBase64Url
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.offline.AndroidSqlCipherFacade
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.toBase64
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import org.apache.commons.io.IOUtils
import java.io.FileNotFoundException
import java.io.IOException
import java.net.MalformedURLException
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.*
import java.util.concurrent.TimeUnit

class TutanotaNotificationsHandler(
	private val localNotificationsFacade: LocalNotificationsFacade,
	private val sseStorage: SseStorage,
	private val credentialsEncryption: NativeCredentialsFacade,
	private val alarmNotificationsManager: AlarmNotificationsManager,
	private val defaultClient: OkHttpClient,
	private val lifecycleScope: LifecycleCoroutineScope,
	private val getSqlCipherFacade: () -> AndroidSqlCipherFacade,
) {

	private val json = Json { ignoreUnknownKeys = true }

	fun onNewNotificationAvailable(sseInfo: SseInfo?) {
		Log.d(TAG, "onNewNotificationAvailable")
		if (sseInfo == null) {
			Log.d(TAG, "No stored SSE info")
			return
		}
		val missedNotification = downloadMissedNotification(sseInfo)
		if (missedNotification != null) {
			handleAlarmNotifications(missedNotification.alarmNotifications)
			sseStorage.setLastProcessedNotificationId(missedNotification.lastProcessedNotificationId)
			sseStorage.setLastMissedNotificationCheckTime(Date())
		}
	}

	fun onConnect(): Boolean {
		if (hasNotificationTTLExpired()) {
			Log.d(TAG, "Notification TTL expired - resetting stored state")
			alarmNotificationsManager.unscheduleAlarms(null)
			sseStorage.clear()
			return false
		}
		if (sseStorage.getLastMissedNotificationCheckTime() == null) {
			sseStorage.setLastMissedNotificationCheckTime(Date())
		}
		return true
	}

	private fun downloadMissedNotification(sseInfo: SseInfo): MissedNotification? {
		var triesLeft = 3
		// We try to download limited number of times. If it fails then  we are probably offline
		var userId: String?
		while (triesLeft > 0) {
			if (sseInfo.userIds.isEmpty()) {
				Log.i(TAG, "No users to download missed notification with")
				return null
			}
			userId = sseInfo.userIds.iterator().next()
			try {
				Log.d(TAG, "Downloading missed notification with user id $userId")
				return executeMissedNotificationDownload(sseInfo, userId)
			} catch (e: FileNotFoundException) {
				Log.i(TAG, "MissedNotification is not found, ignoring: " + e.message)
				return null
			} catch (e: IOException) {
				triesLeft--
				Log.d(TAG, "Failed to download missed notification, tries left: $triesLeft", e)
			} catch (e: IllegalArgumentException) {
				Log.w(TAG, e)
				localNotificationsFacade.showErrorNotification(R.string.scheduleAlarmError_msg, e)
				return null
			} catch (e: ServiceUnavailableException) {
				Log.d(
					TAG, "ServiceUnavailable when downloading missed notification, waiting " +
							e.suspensionSeconds + "s"
				)
				try {
					Thread.sleep(TimeUnit.SECONDS.toMillis(e.suspensionSeconds.toLong()))
				} catch (ignored: InterruptedException) {
				}
				// tries are not decremented and we don't return, we just wait and try again.
			} catch (e: TooManyRequestsException) {
				Log.d(
					TAG, "TooManyRequestsException when downloading missed notification, waiting " +
							e.retryAfterSeconds + "s"
				)
				try {
					Thread.sleep(TimeUnit.SECONDS.toMillis(e.retryAfterSeconds.toLong()))
				} catch (ignored: InterruptedException) {
				}
				// tries are not decremented and we don't return, we just wait and try again.
			} catch (e: ServerResponseException) {
				triesLeft--
				Log.w(TAG, e)
			} catch (e: ClientRequestException) {
				if (e.code == ResponseCodes.NOT_AUTHENTICATED || e.code == ResponseCodes.NOT_AUTHORIZED) {
					Log.i(TAG, "Not authenticated to download missed notification with user $userId", e)
					// This will initiate reconnect so we don't have to try again here
					onNotAuthorized(userId)
				} else {
					Log.w(TAG, e)
				}
				return null
			} catch (e: HttpException) { // other HTTP exceptions, client ones
				Log.w(TAG, e)
				return null
			}
		}
		return null
	}

	@Throws(IllegalArgumentException::class, IOException::class, HttpException::class)
	private fun executeMissedNotificationDownload(sseInfo: SseInfo, userId: String?): MissedNotification? {
		val url = makeAlarmNotificationUrl(sseInfo)
		val requestBuilder = Request.Builder()
			.url(url)
			.method("GET", null)
			.header("Content-Type", "application/json")
			.header("userIds", userId ?: "")
		addCommonHeadersWithSysModelVersion(requestBuilder)
		val lastProcessedNotificationId = sseStorage.getLastProcessedNotificationId()
		if (lastProcessedNotificationId != null) {
			requestBuilder.header("lastProcessedNotificationId", lastProcessedNotificationId)
		}

		var req = requestBuilder.build()

		val response = defaultClient
			.newBuilder()
			.connectTimeout(30, TimeUnit.SECONDS)
			.writeTimeout(20, TimeUnit.SECONDS)
			.readTimeout(20, TimeUnit.SECONDS)
			.build()
			.newCall(req)
			.execute()

		val responseCode = response.code
		Log.d(TAG, "MissedNotification response code $responseCode")
		handleResponseCode(response)

		response.body?.byteStream().use { inputStream ->
			val responseString = IOUtils.toString(inputStream, StandardCharsets.UTF_8)
			Log.d(TAG, "Loaded Missed notifications response")
			return json.decodeFromString(responseString)
		}
	}

	@Throws(
		FileNotFoundException::class,
		ServerResponseException::class,
		ClientRequestException::class,
		ServiceUnavailableException::class,
		TooManyRequestsException::class
	)
	private fun handleResponseCode(response: Response) {
		when (response.code) {
			404 -> {
				throw FileNotFoundException("Missed notification not found: " + 404)
			}

			ServiceUnavailableException.CODE -> {
				val suspensionTime = extractSuspensionTime(response)
				throw ServiceUnavailableException(suspensionTime)
			}

			TooManyRequestsException.CODE -> {
				val suspensionTime = extractSuspensionTime(response)
				throw TooManyRequestsException(suspensionTime)
			}

			in 400..499 -> {
				throw ClientRequestException(response.code)
			}

			in 500..600 -> {
				throw ServerResponseException(response.code)
			}
		}
	}

	private fun extractSuspensionTime(response: Response): Int {
		val retryAfterHeader = response.header("Retry-After")
			?: response.header("Suspension-Time")
		return retryAfterHeader?.toIntOrNull() ?: 0
	}

	@Throws(MalformedURLException::class)
	private fun makeAlarmNotificationUrl(sseInfo: SseInfo): URL {
		val customId =
			sseInfo.pushIdentifier.toByteArray(StandardCharsets.UTF_8).toBase64().base64ToBase64Url()
		return URL(sseInfo.sseOrigin + "/rest/sys/missednotification/" + customId)
	}

	private fun handleAlarmNotifications(alarmNotifications: List<EncryptedAlarmNotification>) {
		alarmNotificationsManager.scheduleNewAlarms(alarmNotifications)
	}

	/**
	 * We remember the last time we connected or fetched missed notification and if since the last time we did the the TTL time has
	 * expired, we certainly missed some updates.
	 * We need to unschedule all alarms and to tell web part that we would like alarms to be scheduled all over.
	 */
	private fun hasNotificationTTLExpired(): Boolean {
		val lastMissedNotificationCheckTime = sseStorage.getLastMissedNotificationCheckTime()
		Log.d(TAG, "check lastMissedNotificationCheckTime: $lastMissedNotificationCheckTime")
		return lastMissedNotificationCheckTime != null && System.currentTimeMillis() - lastMissedNotificationCheckTime.time > MISSED_NOTIFICATION_TTL
	}

	fun onNotAuthorized(userId: String) {
		// If we get notAuthorized, then user removed push identifier and we should try the next one.
		// It will be done automatically when we remove the user from DB because there's already an observer for users
		// in PushNotificationService which restarts the connection.
		sseStorage.removeUser(userId)
		alarmNotificationsManager.unscheduleAlarms(userId)
		if (sseStorage.getUsers().isEmpty()) {
			alarmNotificationsManager.unscheduleAlarms(null)
			sseStorage.clear()
		}
	}

	internal class ClientRequestException(code: Int) : HttpException(code)
	internal class ServerResponseException(code: Int) : HttpException(code)
	internal class TooManyRequestsException(val retryAfterSeconds: Int) : HttpException(CODE) {

		companion object {
			const val CODE = 429
		}
	}

	internal class ServiceUnavailableException(val suspensionSeconds: Int) : HttpException(CODE) {

		companion object {
			const val CODE = 503
		}
	}

	internal open class HttpException(val code: Int) : Exception()
	companion object {
		private const val TAG = "TutanotaNotifications"
		private val MISSED_NOTIFICATION_TTL = TimeUnit.DAYS.toMillis(30)
	}
}