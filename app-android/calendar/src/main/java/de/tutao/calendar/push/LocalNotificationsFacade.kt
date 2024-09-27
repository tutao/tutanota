package de.tutao.calendar.push

import android.Manifest
import android.annotation.TargetApi
import android.app.DownloadManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.annotation.ColorInt
import androidx.annotation.RequiresApi
import androidx.annotation.StringRes
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import de.tutao.calendar.BuildConfig
import de.tutao.calendar.MainActivity
import de.tutao.calendar.R
import de.tutao.calendar.getMimeType
import de.tutao.tutashared.push.SseStorage
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.TimeZone
import kotlin.math.abs

const val NOTIFICATION_DISMISSED_ADDR_EXTRA = "notificationDismissed"
private const val EMAIL_NOTIFICATION_CHANNEL_ID = "notifications"
private val VIBRATION_PATTERN = longArrayOf(100, 200, 100, 200)
private const val PERSISTENT_NOTIFICATION_CHANNEL_ID = "service_intent"
private const val ALARM_NOTIFICATION_CHANNEL_ID = "alarms"
private const val DOWNLOAD_NOTIFICATION_CHANNEL_ID = "downloads"
private const val EMAIL_ADDRESS_EXTRA = "email_address"


class LocalNotificationsFacade(private val context: Context, private val sseStorage: SseStorage) {
	companion object {
		private const val TAG = "LocalNotifications"
	}

	private val notificationManager: NotificationManager
		get() = ContextCompat.getSystemService(context, NotificationManager::class.java)!!

	fun makeConnectionNotification(): Notification {
		return NotificationCompat.Builder(context, PERSISTENT_NOTIFICATION_CHANNEL_ID)
			.setContentTitle("Notification service")
			.setContentText("Syncing notifications")
			.setSmallIcon(R.drawable.ic_sync)
			.setProgress(0, 0, true)
			.build()
	}

	fun dismissNotifications(addresses: List<String>) {
		val activeNotifications = notificationManager.activeNotifications
		val remainingPerGroup = mutableMapOf<String, MutableList<StatusBarNotification>>()
		for (notification in activeNotifications) {
			val emailAddress = notification.notification.extras.getString(EMAIL_ADDRESS_EXTRA)
			if (addresses.contains(emailAddress)) {
				notificationManager.cancel(notification.id)
			} else {
				remainingPerGroup.getOrPut(notification.groupKey) { mutableListOf() }
					.add(notification)
			}
		}
		for ((_, notifications) in remainingPerGroup) {
			if (notifications.size == 1) {
				// there's only one notification left: summary
				notificationManager.cancel(notifications[0].id)
			}
		}
	}

	fun sendEmailNotifications(mailMetadatas: List<Pair<NotificationInfo, MailMetadata?>>) {
		Log.e(TAG, "Calendar shouldn't send mail Notifications")
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
			context,
			1,
			Intent(DownloadManager.ACTION_VIEW_DOWNLOADS),
			PendingIntent.FLAG_IMMUTABLE
		)
		val notification = Notification.Builder(context, channel.id)
			.setContentIntent(pendingIntent)
			.setContentTitle(fileName)
			.setContentText(context.getText(R.string.downloadCompleted_msg))
			.setSmallIcon(R.drawable.ic_download)
			.setAutoCancel(true)
			.build()
		if (ActivityCompat.checkSelfPermission(
				context,
				Manifest.permission.POST_NOTIFICATIONS
			) != PackageManager.PERMISSION_GRANTED
		) {
			return
		}
		notificationManager.notify(mailNotificationId("downloads"), notification)
	}

	fun showErrorNotification(@StringRes message: Int, exception: Throwable?) {
		val intent = Intent(context, MainActivity::class.java)
			.setAction(Intent.ACTION_SEND)
			.setType("text/plain")
			.putExtra(Intent.EXTRA_SUBJECT, "Alarm error v" + BuildConfig.VERSION_NAME)

		if (exception != null) {
			val stackTrace = Log.getStackTraceString(exception)
			val errorString = "${exception.message}\n$stackTrace"
			intent.clipData = ClipData.newPlainText("error", errorString)
		}

		val notification: Notification =
			NotificationCompat.Builder(context, ALARM_NOTIFICATION_CHANNEL_ID)
				.setSmallIcon(R.drawable.ic_status)
				.setContentTitle(context.getString(R.string.app_name))
				.setContentText(context.getString(message))
				.setDefaults(NotificationCompat.DEFAULT_ALL)
				.setStyle(NotificationCompat.BigTextStyle())
				.setContentIntent(
					PendingIntent.getActivity(
						context,
						(Math.random() * 20000).toInt(),
						intent,
						PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
					)
				)
				.setAutoCancel(true)
				.build()
		notificationManager.notify(1000, notification)
	}

	fun createNotificationChannels() {
		val serviceNotificationChannel = NotificationChannel(
			PERSISTENT_NOTIFICATION_CHANNEL_ID, context.getString(R.string.notificationSync_msg),
			NotificationManager.IMPORTANCE_LOW
		)
		notificationManager.createNotificationChannel(serviceNotificationChannel)

		val alarmNotificationsChannel = NotificationChannel(
			ALARM_NOTIFICATION_CHANNEL_ID,
			context.getString(R.string.reminder_label),
			NotificationManager.IMPORTANCE_HIGH
		).default()
		notificationManager.createNotificationChannel(alarmNotificationsChannel)

		val downloadNotificationsChannel = NotificationChannel(
			DOWNLOAD_NOTIFICATION_CHANNEL_ID,
			context.getString(R.string.downloadCompleted_msg),
			NotificationManager.IMPORTANCE_DEFAULT
		)
		downloadNotificationsChannel.setShowBadge(false)
		notificationManager.createNotificationChannel(downloadNotificationsChannel)
	}

	private fun NotificationChannel.default(): NotificationChannel {
		val ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
		val att = AudioAttributes.Builder()
			.setUsage(AudioAttributes.USAGE_NOTIFICATION)
			.setContentType(AudioAttributes.CONTENT_TYPE_UNKNOWN)
			.build()

		setShowBadge(true)
		setSound(ringtoneUri, att)
		enableLights(true)
		vibrationPattern = VIBRATION_PATTERN
		lightColor = Color.RED

		return this
	}

	private fun mailNotificationId(address: String): Int =
		abs(1 + address.hashCode())

}

fun notificationDismissedIntent(
	context: Context,
	emailAddresses: ArrayList<String>,
	sender: String,
): Intent {
	val deleteIntent = Intent(context, PushNotificationService::class.java)
	deleteIntent.putStringArrayListExtra(NOTIFICATION_DISMISSED_ADDR_EXTRA, emailAddresses)
	deleteIntent.putExtra("sender", sender)
	return deleteIntent
}

fun showAlarmNotification(context: Context, timestamp: Long, summary: String, intent: Intent) {
	val contentText = when {
		isSameDay(timestamp, Date().time) -> String.format("%tR %s", timestamp, summary)
		else -> String.format("%1\$ta %1\$td %1\$tb %1\$tR %2\$s", timestamp, summary) // e.g. Fri 25 Nov 12:31 summary
	}
	val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
	@ColorInt val red = context.resources.getColor(R.color.dark_blue, context.theme)
	notificationManager.notify(
		System.currentTimeMillis().toInt(),
		NotificationCompat.Builder(context, ALARM_NOTIFICATION_CHANNEL_ID)
			.setSmallIcon(R.drawable.ic_alarm)
			.setContentTitle(context.getString(R.string.reminder_label))
			.setContentText(contentText)
			.setDefaults(NotificationCompat.DEFAULT_ALL)
			.setColor(red)
			.setContentIntent(openCalendarIntent(context, intent))
			.setAutoCancel(true)
			.build()
	)
}

/**
 * Returns whether two timestamps belong to the same day considering the time zone
 * @param time1 epoch time 1 in milliseconds
 * @param time2 epoch time 2 in milliseconds
 * @param timeZone optional, should only be used for testing! | otherwise the default value is used
 * @return boolean whether both timestamp are on the same day
 */
fun isSameDay(time1: Long, time2: Long, timeZone: TimeZone = TimeZone.getDefault()): Boolean {
	val customDateFormat = SimpleDateFormat("yyyy-MM-dd")
	customDateFormat.setTimeZone(timeZone)
	return customDateFormat.format(time1).equals(customDateFormat.format(time2))
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
		PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
	)
}

/**
 * create a notification that starts a new task and gives it access to the downloaded file
 * to view it.
 */
fun showDownloadNotification(context: Context, file: File) {
	val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
	val uri = FileProvider.getUriForFile(context, BuildConfig.FILE_PROVIDER_AUTHORITY, file)
	val mimeType = getMimeType(file.toUri(), context)
	val intent = Intent(Intent.ACTION_VIEW).apply {
		flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
		setDataAndType(uri, mimeType)
	}
	val pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
	notificationManager.notify(
		System.currentTimeMillis().toInt(),
		NotificationCompat.Builder(context, DOWNLOAD_NOTIFICATION_CHANNEL_ID)
			.setSmallIcon(R.drawable.ic_download)
			.setContentTitle(context.getString(R.string.downloadCompleted_msg))
			.setContentText(file.name)
			.setContentIntent(pendingIntent)
			.setAutoCancel(true)
			.build()
	)
}