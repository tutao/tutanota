package de.tutao.tutanota.push

import android.database.SQLException
import android.util.Log
import androidx.lifecycle.LifecycleCoroutineScope
import de.tutao.tutanota.R
import de.tutao.tutanota.alarms.AlarmNotificationsManager
import de.tutao.tutasdk.ApiCallException
import de.tutao.tutasdk.HttpError
import de.tutao.tutasdk.LoginException
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.SdkFileClient
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.SuspensionHandler
import de.tutao.tutashared.await
import de.tutao.tutashared.base64ToBase64Url
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.wrap
import de.tutao.tutashared.offline.AndroidSqlCipherFacade
import de.tutao.tutashared.offline.sqlTagged
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.push.toSdkCredentials
import de.tutao.tutashared.toBase64
import de.tutao.tutashared.toSdkIdTupleGenerated
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import java.io.File
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
	private val appDir: File,
	private val suspensionHandler: SuspensionHandler
) {

	private val json = Json { ignoreUnknownKeys = true }

	fun onNewNotificationAvailable(sseInfo: SseInfo?) = lifecycleScope.launch {
		Log.d(TAG, "onNewNotificationAvailable")
		if (sseInfo == null) {
			Log.d(TAG, "No stored SSE info")
			return@launch
		}
		val missedNotificationSerialized: String? = downloadMissedNotification(sseInfo)
		if (missedNotificationSerialized != null) {
			val missedNotification = json.decodeFromString<MissedNotification>(missedNotificationSerialized)
			handleNotificationInfos(sseInfo, missedNotification.notificationInfos)
			alarmNotificationsManager.scheduleNewAlarms(missedNotification.alarmNotifications, null)
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

	private suspend fun downloadMissedNotification(sseInfo: SseInfo): String? {
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
				return suspensionHandler.deferRequest { executeMissedNotificationDownload(sseInfo, userId) }
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
				suspensionHandler.activateSuspensionIfInactive(e.suspensionSeconds, "missed notification")
				// tries are not decremented and we don't return, we just wait and try again.
				// waiting happens above with `deferRequest`
			} catch (e: TooManyRequestsException) {
				Log.d(
					TAG, "TooManyRequestsException when downloading missed notification, waiting " +
							e.retryAfterSeconds + "s"
				)
				suspensionHandler.activateSuspensionIfInactive(e.retryAfterSeconds, "missed notification")
				// tries are not decremented and we don't return, we just wait and try again.
				// waiting happens above with `deferRequest`
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
	private suspend fun executeMissedNotificationDownload(sseInfo: SseInfo, userId: String?): String? {
		val url = makeAlarmNotificationUrl(sseInfo)
		val request = Request.Builder()
			.url(url)
			.method("GET", null)
			.header("userIds", userId ?: "")
			.addSysVersionHeaders()
			.apply {
				val lastProcessedNotificationId = sseStorage.getLastProcessedNotificationId()
				if (lastProcessedNotificationId != null) {
					header("lastProcessedNotificationId", lastProcessedNotificationId)
				}
			}
			.build()

		val response = defaultClient
			.newBuilder()
			.connectTimeout(30, TimeUnit.SECONDS)
			.writeTimeout(20, TimeUnit.SECONDS)
			.readTimeout(20, TimeUnit.SECONDS)
			.build()
			.newCall(request)
			.await()

		val responseCode = response.code
		Log.d(TAG, "MissedNotification response code $responseCode")
		handleResponseCode(response)

		// OkHttp doesn't have a real async reading for response body so we have to make sure it's on IO dispatcher
		val responseString = withContext(Dispatchers.IO) {
			response.body?.string()
		}
		Log.d(TAG, "Loaded Missed notifications response")
		return responseString
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

	private suspend fun handleNotificationInfos(sseInfo: SseInfo, notificationInfos: List<NotificationInfo>) {
		val metadatas = notificationInfos.map { notificationInfo ->
			try {
				val metaData = try {
					suspensionHandler.deferRequest { downloadEmailMetadata(sseInfo, notificationInfo) }
				} catch (e: ApiCallException.ServerResponseException) {
					val source = e.source
					if (source is HttpError.TooManyRequestsError && source.suspensionTimeSec != null) {
						suspensionHandler.activateSuspensionIfInactive(
							source.suspensionTimeSec!!.toInt(),
							"mail"
						)
						suspensionHandler.deferRequest { downloadEmailMetadata(sseInfo, notificationInfo) }
					} else {
						throw e
					}
				}

				Pair(notificationInfo, metaData)
			} catch (e: Throwable) {
				Log.w(TAG, e)
				Pair(notificationInfo, null)
			}

		}
		localNotificationsFacade.sendEmailNotifications(metadatas)
	}

	@Throws(ApiCallException::class, Exception::class, IllegalArgumentException::class, LoginException::class)
	private suspend fun downloadEmailMetadata(sseInfo: SseInfo, notificationInfo: NotificationInfo): MailMetadata? {

		val unencryptedCredentials = try {
			credentialsEncryption.loadByUserId(notificationInfo.userId)
				?: throw Exception("Missing credentials for user")
		} catch (e: Throwable) {
			throw Exception(
				"Failed to get credentials with userId '${notificationInfo.userId}' to download notification: $e"
			)
		}

		if (unencryptedCredentials.encryptedPassphraseKey == null) {
			return null
		}


		val sdk = Sdk.newWithoutSuspension(sseInfo.sseOrigin, SdkRestClient(), SdkFileClient(this.appDir))
		val loggedInSdk = try {
			sdk.login(unencryptedCredentials.toSdkCredentials())
		} catch (e: LoginException.ApiCall) {
			// unwrap ApiCall exception to make it easier to handle on the outside
			throw e.source
		}

		val mailId = notificationInfo.mailId?.toSdkIdTupleGenerated()
			?: throw IllegalArgumentException("Missing mailId for notification ${sseInfo.pushIdentifier}")

		val mailParsedServerModel = loggedInSdk.mailFacade().loadUntypedMail(mailId)
		val mail = sdk.makeTypedMail(mailParsedServerModel)
		if (unencryptedCredentials.databaseKey != null) {
			Log.d(TAG, "Inserting mail $mailId into offline db")
			val serializedMail = sdk.serializeMail(mailParsedServerModel)
			val sqlCipherFacade = this.getSqlCipherFacade()
			try {
				sqlCipherFacade.openDb(
					unencryptedCredentials.credentialInfo.userId,
					unencryptedCredentials.databaseKey!!
				)
				// 97 is the Mail typeId
				sqlCipherFacade.run(
					"INSERT OR IGNORE INTO list_entities VALUES (?, ?, ?, ?, ?)", listOf(
						"tutanota/97".sqlTagged(),
						mailId.listId.sqlTagged(),
						mailId.elementId.sqlTagged(),
						(mail.ownerGroup ?: "").sqlTagged(),
						serializedMail.wrap().sqlTagged(),
					)
				)
			} catch (e: SQLException) {
				Log.w(TAG, "Failed to insert mail into offline db: $mailId", e)
			} finally {
				sqlCipherFacade.closeDb()
			}
		}


		val senderAddress = mail.sender.address
		val senderName = mail.sender.name
		val sender = SenderRecipient(senderAddress, senderName, null)

		val recipientMailAddress = mail.firstRecipient ?: throw Exception("Missing firstRecipient from ${mail.id}")
		val recipientAddress = recipientMailAddress.address
		val recipientName = recipientMailAddress.name

		val recipient = SenderRecipient(recipientAddress, recipientName, null)

		return MailMetadata(recipient, sender, mail.subject)
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