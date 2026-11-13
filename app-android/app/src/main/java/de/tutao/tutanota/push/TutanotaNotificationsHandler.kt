package de.tutao.tutanota.push

import android.database.SQLException
import android.util.Log
import androidx.lifecycle.LifecycleCoroutineScope
import de.tutao.tutashared.alarms.AlarmNotificationsManager
import de.tutao.tutasdk.ApiCallException
import de.tutao.tutasdk.HttpError
import de.tutao.tutasdk.LoginException
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.SdkFileClient
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.SuspensionHandler
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.ipc.NativeCredentialsFacade
import de.tutao.tutashared.ipc.wrap
import de.tutao.tutashared.offline.AndroidSqlCipherFacade
import de.tutao.tutashared.offline.sqlTagged
import de.tutao.tutashared.push.CommonNotificationsHandler
import de.tutao.tutashared.push.MissedNotification
import de.tutao.tutashared.push.NotificationInfo
import de.tutao.tutashared.push.SseStorage
import de.tutao.tutashared.push.toSdkCredentials
import de.tutao.tutashared.toSdkIdTupleGenerated
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import java.io.File
import java.util.*

class TutanotaNotificationsHandler(
	private val localNotificationsFacade: LocalNotificationsFacade,
	private val sseStorage: SseStorage,
	private val credentialsEncryption: NativeCredentialsFacade,
	private val alarmNotificationsManager: AlarmNotificationsManager,
	defaultClient: OkHttpClient,
	private val lifecycleScope: LifecycleCoroutineScope,
	private val getSqlCipherFacade: () -> AndroidSqlCipherFacade,
	private val appDir: File,
	private val suspensionHandler: SuspensionHandler
) : CommonNotificationsHandler(localNotificationsFacade, sseStorage, alarmNotificationsManager, defaultClient, suspensionHandler
	) {
	override fun onNewNotificationAvailable(sseInfo: SseInfo?) = lifecycleScope.launch {
		Log.d(TAG, "onNewNotificationAvailable")
		if (sseInfo == null) {
			Log.d(TAG, "No stored SSE info")
			return@launch
		}
		val missedNotificationSerialized: String? = super.downloadMissedNotification(sseInfo)
		if (missedNotificationSerialized != null) {
			val missedNotification = json.decodeFromString<MissedNotification>(missedNotificationSerialized)
			handleNotificationInfos(sseInfo, missedNotification.notificationInfos)
			alarmNotificationsManager.scheduleNewAlarms(missedNotification.alarmNotifications, null)
			sseStorage.setLastProcessedNotificationId(missedNotification.lastProcessedNotificationId)
			sseStorage.setLastMissedNotificationCheckTime(Date())
		}
	}

	private suspend fun handleNotificationInfos(sseInfo: SseInfo, notificationInfos: List<NotificationInfo>) {
		val metadatas = notificationInfos.map { notificationInfo ->
			try {
				val metaData = try {
					suspensionHandler.deferRequest({ downloadEmailMetadata(sseInfo, notificationInfo) }, MAIL_RESOURCE)
				} catch (e: ApiCallException.ServerResponseException) {
					val source = e.source
					if (source is HttpError.TooManyRequestsError && source.suspensionTimeSec != null) {
						suspensionHandler.activateSuspensionIfInactive(
							source.suspensionTimeSec!!.toInt(),
							MAIL_RESOURCE
						)
						suspensionHandler.deferRequest(
							{ downloadEmailMetadata(sseInfo, notificationInfo) },
							MAIL_RESOURCE
						)
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

	companion object {
		private const val TAG = "TutanotaNotifications"
		const val MAIL_RESOURCE = "mail"

	}
}