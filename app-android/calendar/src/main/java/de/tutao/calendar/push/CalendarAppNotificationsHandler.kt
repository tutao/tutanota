package de.tutao.calendar.push

import android.util.Log
import androidx.lifecycle.LifecycleCoroutineScope
import de.tutao.tutashared.SuspensionHandler
import de.tutao.tutashared.alarms.AlarmNotificationsManager
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.push.NotificationsHandler
import de.tutao.tutashared.push.MissedNotification
import de.tutao.tutashared.push.SseStorage
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import java.util.*

class CalendarAppNotificationsHandler(
	localNotificationsFacade: CalendarLocalNotificationsFacade,
	private val sseStorage: SseStorage,
	private val alarmNotificationsManager: AlarmNotificationsManager,
	defaultClient: OkHttpClient,
	private val lifecycleScope: LifecycleCoroutineScope,
	suspensionHandler: SuspensionHandler

) : NotificationsHandler(localNotificationsFacade, sseStorage, alarmNotificationsManager, defaultClient, suspensionHandler) {

	override fun onNewNotificationAvailable(sseInfo: SseInfo?) = lifecycleScope.launch {
		Log.d(TAG, "onNewNotificationAvailable")
		if (sseInfo == null) {
			Log.d(TAG, "No stored SSE info")
			return@launch
		}
		val missedNotificationSerialized: String? = downloadMissedNotification(sseInfo)
		if (missedNotificationSerialized != null) {
			val missedNotification = json.decodeFromString<MissedNotification>(missedNotificationSerialized)
			alarmNotificationsManager.scheduleNewAlarms(missedNotification.alarmNotifications, null)
			sseStorage.setLastProcessedNotificationId(missedNotification.lastProcessedNotificationId)
			sseStorage.setLastMissedNotificationCheckTime(Date())
		}
	}

	companion object {
		private const val TAG = "CalendarNotificationsHandler"
	}
}