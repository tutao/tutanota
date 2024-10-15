package de.tutao.tutanota.push

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import de.tutao.tutasdk.LoggedInSdk
import de.tutao.tutasdk.Sdk
import de.tutao.tutashared.AndroidNativeCryptoFacade
import de.tutao.tutashared.SdkRestClient
import de.tutao.tutashared.createAndroidKeyStoreFacade
import de.tutao.tutashared.credentials.CredentialsEncryptionFactory
import de.tutao.tutashared.data.AppDatabase
import de.tutao.tutashared.push.SseStorage
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Performs mail notification actions
 */
class MailNotificationActionReceiver : BroadcastReceiver() {
	override fun onReceive(context: Context, intent: Intent) {
		val action = intent.getStringExtra(NOTIFICATION_ACTION_EXTRA)
		val notificationInfo =
			Json.Default.decodeFromString<NotificationInfo>(intent.getStringExtra(NOTIFICATION_INFO_EXTRA)!!)
		val pendingResult = goAsync()

		@OptIn(DelicateCoroutinesApi::class)
		GlobalScope.launch {
			try {
				val db = AppDatabase.getDatabase(context, true)
				val keyStoreFacade = createAndroidKeyStoreFacade()
				val sseStorage = SseStorage(db, keyStoreFacade)

				val crypto = AndroidNativeCryptoFacade(context)
				val nativeCredentialsFacade = CredentialsEncryptionFactory.create(context, crypto, db)
				val credentials = nativeCredentialsFacade.loadByUserId(notificationInfo.userId)!!.toSdkCredentials()

				val sdk = Sdk(sseStorage.getSseOrigin()!!, SdkRestClient()).login(credentials)

				when (action) {
					TRASH_ACTION -> sendMailToTrash(sdk, notificationInfo)
					READ_ACTION -> markMailAsRead(sdk, notificationInfo)
					else -> {
						Log.e(
							TAG,
							"Invalid notification action received: $action (valid actions are $TRASH_ACTION and $READ_ACTION)"
						)
					}
				}
			} finally {
				pendingResult.finish()
			}
		}

		val notificationId = intent.getIntExtra(EMAIL_NOTIFICATION_CHANNEL_ID, 0)
		val notificationManager =
			ContextCompat.getSystemService(context, NotificationManager::class.java)!!
		dismissNotification(notificationManager, notificationId)
	}

	private suspend fun sendMailToTrash(sdk: LoggedInSdk, notificationInfo: NotificationInfo) {
		sdk.mailFacade().trashMails(listOf(notificationInfo.mailId!!.toSdkIdTuple()))
	}

	private suspend fun markMailAsRead(sdk: LoggedInSdk, notificationInfo: NotificationInfo) {
		sdk.mailFacade().setUnreadStatusForMails(listOf(notificationInfo.mailId!!.toSdkIdTuple()), false)
	}

	private fun dismissNotification(notificationManager: NotificationManager, notificationIdToDismiss: Int) {
		notificationManager.cancel(notificationIdToDismiss)
		val activeNotifications = notificationManager.activeNotifications
		for ((_, notifications) in activeNotifications.groupBy { it.groupKey }) {
			if (notifications.size == 1) {
				// there's only one notification left: summary
				notificationManager.cancel(notifications[0].id)
			}
		}
	}

	companion object {
		private const val TAG = "NotifAction"
		private const val TRASH_ACTION = "trash"
		private const val READ_ACTION = "read"
		private const val NOTIFICATION_INFO_EXTRA = "NotifInfo"

		fun makeTrashIntent(context: Context, notificationId: Int, notificationInfo: NotificationInfo): Intent {
			val intent = makeIntent(TRASH_ACTION, context, notificationId, notificationInfo)
			return intent
		}

		fun makeReadIntent(context: Context, notificationId: Int, notificationInfo: NotificationInfo): Intent {
			return makeIntent(READ_ACTION, context, notificationId, notificationInfo)
		}

		private fun makeIntent(
			actionType: String,
			context: Context,
			notificationId: Int,
			notificationInfo: NotificationInfo
		): Intent {
			val intent = Intent(context, MailNotificationActionReceiver::class.java)
			intent.putExtra(NOTIFICATION_ACTION_EXTRA, actionType)
			intent.putExtra(EMAIL_NOTIFICATION_CHANNEL_ID, notificationId)
			intent.putExtra(NOTIFICATION_INFO_EXTRA, Json.Default.encodeToString(notificationInfo))
			return intent
		}
	}
}