package de.tutao.tutanota.push

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
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

		when (action) {
			TRASH_ACTION -> {
				sendMailToTrash(notificationInfo)
			}

			READ_ACTION -> {
				markMailAsRead(notificationInfo)
			}

			else -> {
				Log.e(
					TAG,
					"Invalid notification action received: $action (valid actions are $TRASH_ACTION and $READ_ACTION)"
				)
			}
		}

		val notificationId = intent.getIntExtra(EMAIL_NOTIFICATION_CHANNEL_ID, 0)
		val notificationManager =
			ContextCompat.getSystemService(context, NotificationManager::class.java)!!
		dismissNotification(notificationManager, notificationId)
	}

	private fun sendMailToTrash(notificationInfo: NotificationInfo) {
		Log.d(
			TAG,
			"This should send the mail to trash! mailId: ${notificationInfo.mailId} userId: ${notificationInfo.userId}"
		)
	}

	private fun markMailAsRead(notificationInfo: NotificationInfo) {
		Log.d(
			TAG,
			"This should mark the mail as read! mailId: ${notificationInfo.mailId} userId: ${notificationInfo.userId}"
		)
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