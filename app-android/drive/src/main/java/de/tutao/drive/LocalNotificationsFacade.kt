package de.tutao.drive

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat.checkSelfPermission
import de.tutao.tutashared.file.FileNotificationSender
import de.tutao.tutashared.push.SseStorage
import java.io.File
import kotlin.math.abs

class LocalNotificationsFacade(private val context: Context, private val sseStorage: SseStorage) :
	FileNotificationSender {
	private fun driveNotificationId(identifier: String): Int = abs(1 + identifier.hashCode())

	override fun sendDownloadFinishedNotification(fileName: String?) {
		val notificationManager = NotificationManagerCompat.from(context)
		val channel = NotificationChannel(
			"downloads",
			"Downloads",
			NotificationManager.IMPORTANCE_DEFAULT
		)
		notificationManager.createNotificationChannel(channel)
		val notification = Notification.Builder(context, channel.id)
			// TODO .setContentIntent(...)
			.setContentTitle(fileName)
			.setContentText(context.getText(R.string.downloadCompleted_msg))
			.setSmallIcon(R.drawable.ic_download)
			.setAutoCancel(true)
			.build()
		if (checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
			return
		}
		notificationManager.notify(driveNotificationId("downloads"), notification)
	}

	override fun showDownloadNotification(file: File) {
		TODO("Not yet implemented")
	}
}