package de.tutao.tutanota.push

import android.annotation.TargetApi
import android.app.*
import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.text.TextUtils
import android.util.Log
import androidx.annotation.ColorInt
import androidx.annotation.StringRes
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import de.tutao.tutanota.BuildConfig
import de.tutao.tutanota.MainActivity
import de.tutao.tutanota.R
import de.tutao.tutanota.Utils
import de.tutao.tutanota.alarms.AlarmBroadcastReceiver
import java.util.*
import java.util.concurrent.ConcurrentHashMap

class LocalNotificationsFacade(private val context: Context) {
	private val notificationManager: NotificationManager
		get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

	private val aliasNotification: MutableMap<String, LocalNotificationInfo> = ConcurrentHashMap()

	fun makeConnectionNotification(): Notification {
		return NotificationCompat.Builder(context, PERSISTENT_NOTIFICATION_CHANNEL_ID)
				.setContentTitle("Notification service")
				.setContentText("Syncing notifications")
				.setSmallIcon(R.drawable.ic_status)
				.setProgress(0, 0, true)
				.build()
	}

	fun notificationDismissed(dismissAdders: List<String>?, isSummary: Boolean) {
		if (isSummary) {
			// If the user clicked on summary directly, reset counter for all notifications
			aliasNotification.clear()
		} else {
			if (dismissAdders != null) {
				for (addr in dismissAdders) {
					aliasNotification.remove(addr)
					notificationManager.cancel(makeNotificationId(addr))
				}
			}
		}
		if (aliasNotification.isEmpty()) {
			notificationManager.cancel(SUMMARY_NOTIFICATION_ID)
		} else {
			var allAreZero = true
			for (info in aliasNotification.values) {
				if (info.counter > 0) {
					allAreZero = false
					break
				}
			}
			if (allAreZero) {
				notificationManager.cancel(SUMMARY_NOTIFICATION_ID)
			} else {
				for (info in aliasNotification.values) {
					if (info.counter > 0) {
						sendSummaryNotification(notificationManager,
								info.message, info.notificationInfo, false)
						break
					}
				}
			}
		}
	}

	fun sendEmailNotifications(notificationInfos: List<NotificationInfo>) {
		if (notificationInfos.isEmpty()) {
			return
		}

		val title = context.getString(R.string.pushNewMail_msg)
		for (notificationInfo in notificationInfos) {
			var counterPerAlias = aliasNotification[notificationInfo.address]
			counterPerAlias = counterPerAlias?.incremented(notificationInfo.counter)
					?: LocalNotificationInfo(
							title,
							notificationInfo.counter, notificationInfo)

			aliasNotification[notificationInfo.address] = counterPerAlias
			val notificationId = makeNotificationId(notificationInfo.address)
			@ColorInt val redColor = context.resources.getColor(R.color.red, context.theme)
			val notificationBuilder = NotificationCompat.Builder(context, EMAIL_NOTIFICATION_CHANNEL_ID)
					.setLights(redColor, 1000, 1000)
			val addresses = ArrayList<String?>()
			addresses.add(notificationInfo.address)
			notificationBuilder.setContentTitle(title)
					.setColor(redColor)
					.setContentText(notificationContent(notificationInfo.address))
					.setNumber(counterPerAlias.counter)
					.setSmallIcon(R.drawable.ic_status)
					.setDeleteIntent(intentForDelete(addresses))
					.setContentIntent(intentOpenMailbox(notificationInfo, false))
					.setGroup(NOTIFICATION_EMAIL_GROUP)
					.setAutoCancel(true)
					.setGroupAlertBehavior(if (Utils.atLeastNougat()) NotificationCompat.GROUP_ALERT_CHILDREN else NotificationCompat.GROUP_ALERT_SUMMARY)
					.setDefaults(Notification.DEFAULT_ALL)
			notificationManager.notify(notificationId, notificationBuilder.build())
		}
		sendSummaryNotification(notificationManager, title,
				notificationInfos[0], true)
	}

	@TargetApi(Build.VERSION_CODES.Q)
	fun sendDownloadFinishedNotification(fileName: String?) {
		val notificationManager = NotificationManagerCompat.from(context)
		val channel = NotificationChannel(
				"downloads",
				"Downloads",
				NotificationManager.IMPORTANCE_DEFAULT
		)
		notificationManager.createNotificationChannel(channel)
		val pendingIntent = PendingIntent.getActivity(
				context,  /*requestCode*/
				1,
				Intent(DownloadManager.ACTION_VIEW_DOWNLOADS),  /*flags*/
				PendingIntent.FLAG_IMMUTABLE
		)
		val notification = Notification.Builder(context, channel.id)
				.setContentIntent(pendingIntent)
				.setContentTitle(fileName)
				.setContentText(context.getText(R.string.downloadCompleted_msg))
				.setSmallIcon(R.drawable.ic_download)
				.setAutoCancel(true)
				.build()
		notificationManager.notify(makeNotificationId("downloads"), notification)
	}

	private fun sendSummaryNotification(
		notificationManager: NotificationManager,
		title: String,
		notificationInfo: NotificationInfo,
		sound: Boolean,
	) {
		var summaryCounter = 0
		val addresses = ArrayList<String?>()
		val inboxStyle = NotificationCompat.InboxStyle()
		for ((key, value) in aliasNotification) {
			val count = value.counter
			if (count > 0) {
				summaryCounter += count
				inboxStyle.addLine(notificationContent(key))
				addresses.add(key)
			}
		}
		val builder = NotificationCompat.Builder(context, EMAIL_NOTIFICATION_CHANNEL_ID)
				.setBadgeIconType(NotificationCompat.BADGE_ICON_SMALL)
		@ColorInt val red = context.resources.getColor(R.color.red, context.theme)
		val notification = builder.setContentTitle(title)
				.setContentText(notificationContent(notificationInfo.address))
				.setSmallIcon(R.drawable.ic_status)
				.setGroup(NOTIFICATION_EMAIL_GROUP)
				.setGroupSummary(true)
				.setColor(red)
				.setNumber(summaryCounter)
				.setStyle(inboxStyle)
				.setContentIntent(intentOpenMailbox(notificationInfo, true))
				.setDeleteIntent(intentForDelete(addresses))
				.setAutoCancel(true) // We need to update summary without sound when one of the alarms is cancelled
				// but we need to use sound if it's API < N because GROUP_ALERT_CHILDREN doesn't
				// work with sound there (pehaps summary consumes it somehow?) and we must do
				// summary with sound instead on the old versions.
				.setDefaults(if (sound) NotificationCompat.DEFAULT_SOUND or NotificationCompat.DEFAULT_VIBRATE else 0)
				.setGroupAlertBehavior(if (Utils.atLeastNougat()) NotificationCompat.GROUP_ALERT_CHILDREN else NotificationCompat.GROUP_ALERT_SUMMARY)
				.build()
		notificationManager.notify(SUMMARY_NOTIFICATION_ID, notification)
	}

	fun showErrorNotification(@StringRes message: Int, exception: Throwable?) {
		val intent = Intent(context, MainActivity::class.java)
				.setAction(Intent.ACTION_SEND)
				.setType("text/plain")
				.putExtra(Intent.EXTRA_SUBJECT, "Alarm error v" + BuildConfig.VERSION_NAME)
		if (exception != null) {
			val stackTrace = Log.getStackTraceString(exception)
			val errorString = """
				${exception.message}
				$stackTrace
				""".trimIndent()
			intent.clipData = ClipData.newPlainText("error", errorString)
		}
		val notification: Notification = NotificationCompat.Builder(context, AlarmBroadcastReceiver.ALARM_NOTIFICATION_CHANNEL_ID)
				.setSmallIcon(R.drawable.ic_status)
				.setContentTitle(context.getString(R.string.app_name))
				.setContentText(context.getString(message))
				.setDefaults(NotificationCompat.DEFAULT_ALL)
				.setStyle(NotificationCompat.BigTextStyle())
				.setContentIntent(PendingIntent.getActivity(context, (Math.random() * 20000).toInt(), intent, PendingIntent.FLAG_UPDATE_CURRENT))
				.setAutoCancel(true)
				.build()
		notificationManager.notify(1000, notification)
	}

	@TargetApi(Build.VERSION_CODES.O)
	fun createNotificationChannels() {
		val mailNotificationChannel = NotificationChannel(
				EMAIL_NOTIFICATION_CHANNEL_ID,
				context.getString(R.string.pushNewMail_msg),
				NotificationManager.IMPORTANCE_DEFAULT)
		mailNotificationChannel.setShowBadge(true)
		val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
		val att = AudioAttributes.Builder()
				.setUsage(AudioAttributes.USAGE_NOTIFICATION)
				.setContentType(AudioAttributes.CONTENT_TYPE_UNKNOWN)
				.build()
		mailNotificationChannel.setSound(ringtoneUri, att)
		mailNotificationChannel.vibrationPattern = VIBRATION_PATTERN
		mailNotificationChannel.enableLights(true)
		mailNotificationChannel.lightColor = Color.RED
		mailNotificationChannel.setShowBadge(true)
		notificationManager.createNotificationChannel(mailNotificationChannel)
		val serviceNotificationChannel = NotificationChannel(
				PERSISTENT_NOTIFICATION_CHANNEL_ID, context.getString(R.string.notificationSync_msg),
				NotificationManager.IMPORTANCE_LOW)
		notificationManager.createNotificationChannel(serviceNotificationChannel)
		val alarmNotificationsChannel = NotificationChannel(
				AlarmBroadcastReceiver.ALARM_NOTIFICATION_CHANNEL_ID,
				context.getString(R.string.reminder_label),
				NotificationManager.IMPORTANCE_HIGH)
		alarmNotificationsChannel.setShowBadge(true)
		alarmNotificationsChannel.setSound(ringtoneUri, att)
		alarmNotificationsChannel.vibrationPattern = VIBRATION_PATTERN
		alarmNotificationsChannel.enableLights(true)
		alarmNotificationsChannel.lightColor = Color.RED
		alarmNotificationsChannel.setShowBadge(true)
		notificationManager.createNotificationChannel(alarmNotificationsChannel)
	}

	private fun notificationContent(address: String): String {
		return aliasNotification[address]!!.counter.toString() + " " + address
	}

	private fun makeNotificationId(address: String?): Int {
		return Math.abs(1 + address.hashCode())
	}

	private fun intentForDelete(addresses: ArrayList<String?>): PendingIntent {
		val deleteIntent = Intent(context, PushNotificationService::class.java)
		deleteIntent.putStringArrayListExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, addresses)
		return PendingIntent.getService(
				context.applicationContext,
				makeNotificationId("dismiss" + TextUtils.join("+", addresses)),
				deleteIntent,
				PendingIntent.FLAG_UPDATE_CURRENT)
	}

	private fun intentOpenMailbox(
		notificationInfo: NotificationInfo,
		isSummary: Boolean,
	): PendingIntent {
		val openMailboxIntent = Intent(context, MainActivity::class.java)
		openMailboxIntent.action = MainActivity.OPEN_USER_MAILBOX_ACTION
		openMailboxIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_MAILADDRESS_KEY,
				notificationInfo.address)
		openMailboxIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY,
				notificationInfo.userId)
		openMailboxIntent.putExtra(MainActivity.IS_SUMMARY_EXTRA, isSummary)
		return PendingIntent.getActivity(
				context.applicationContext,
				makeNotificationId(notificationInfo.address + "@isSummary" + isSummary),
				openMailboxIntent,
				PendingIntent.FLAG_UPDATE_CURRENT)
	}

	companion object {
		const val NOTIFICATION_DISMISSED_ADDR_EXTRA = "notificationDismissed"
		private const val EMAIL_NOTIFICATION_CHANNEL_ID = "notifications"
		private val VIBRATION_PATTERN = longArrayOf(100, 200, 100, 200)
		private const val NOTIFICATION_EMAIL_GROUP = "de.tutao.tutanota.email"
		private const val SUMMARY_NOTIFICATION_ID = 45
		private const val PERSISTENT_NOTIFICATION_CHANNEL_ID = "service_intent"
		fun notificationDismissedIntent(
			context: Context?,
			emailAddresses: ArrayList<String>?,
			sender: String?,
			isSummary: Boolean,
		): Intent {
			val deleteIntent = Intent(context, PushNotificationService::class.java)
			deleteIntent.putStringArrayListExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, emailAddresses)
			deleteIntent.putExtra("sender", sender)
			deleteIntent.putExtra(MainActivity.IS_SUMMARY_EXTRA, isSummary)
			return deleteIntent
		}

		fun showAlarmNotification(context: Context, `when`: Long, summary: String?, intent: Intent) {
			val contentText = String.format("%tR %s", `when`, summary)
			val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
			@ColorInt val red = context.resources.getColor(R.color.red, context.theme)
			notificationManager.notify(System.currentTimeMillis().toInt(),
					NotificationCompat.Builder(context, AlarmBroadcastReceiver.ALARM_NOTIFICATION_CHANNEL_ID)
							.setSmallIcon(R.drawable.ic_status)
							.setContentTitle(context.getString(R.string.reminder_label))
							.setContentText(contentText)
							.setDefaults(NotificationCompat.DEFAULT_ALL)
							.setColor(red)
							.setContentIntent(openCalendarIntent(context, intent))
							.setAutoCancel(true)
							.build())
		}

		private fun openCalendarIntent(context: Context, alarmIntent: Intent): PendingIntent {
			val userId = alarmIntent.getStringExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY)
			val openCalendarEventIntent = Intent(context, MainActivity::class.java)
			openCalendarEventIntent.action = MainActivity.OPEN_CALENDAR_ACTION
			openCalendarEventIntent.putExtra(MainActivity.OPEN_USER_MAILBOX_USERID_KEY, userId)
			return PendingIntent.getActivity(
					context,
					alarmIntent.data.toString().hashCode(),
					openCalendarEventIntent,
					PendingIntent.FLAG_UPDATE_CURRENT)
		}
	}
}