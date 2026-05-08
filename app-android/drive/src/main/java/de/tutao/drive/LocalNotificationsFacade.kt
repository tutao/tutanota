package de.tutao.drive

import android.Manifest
import android.app.DownloadManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat.checkSelfPermission
import androidx.core.content.FileProvider
import androidx.core.net.toUri
import de.tutao.tutashared.file.FileNotificationSender
import de.tutao.tutashared.file.getMimeType
import de.tutao.tutashared.push.SseStorage
import java.io.File
import kotlin.math.abs

private const val DOWNLOAD_NOTIFICATION_CHANNEL_ID = "downloads"

class LocalNotificationsFacade(private val context: Context) :
	FileNotificationSender {
	private fun driveNotificationId(identifier: String): Int = abs(1 + identifier.hashCode())

	override fun sendDownloadFinishedNotification(fileName: String?) {
		val notificationManager = NotificationManagerCompat.from(context)
		val channel = NotificationChannel(
			DOWNLOAD_NOTIFICATION_CHANNEL_ID,
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
		if (checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
			return
		}
		notificationManager.notify(driveNotificationId(DOWNLOAD_NOTIFICATION_CHANNEL_ID), notification)
	}

	override fun showDownloadNotification(file: File) {
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
}