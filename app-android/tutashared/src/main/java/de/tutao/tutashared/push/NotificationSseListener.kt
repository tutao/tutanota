package de.tutao.tutashared.push

import android.util.Log
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.push.SseClient.SseListener

class NotificationSseListener(
	var state: PushNotificationServiceStateIndicator,
	val notificationsHandler: INotificationsHandler): SseListener {

		override fun onStartingConnection(): Boolean {
			Log.d(TAG, "onStartingConnection")
			state = PushNotificationServiceStates.CONNECTING
			return notificationsHandler.onConnect()
		}

		override fun onMessage(data: String, sseInfo: SseInfo?) {
			if ("notification" == data) {
				notificationsHandler.onNewNotificationAvailable(sseInfo)
			}
		}

		override fun onConnectionEstablished() {
			Log.d(TAG, "onConnectionEstablished")
			state = PushNotificationServiceStates.CONNECTED

			// After establishing connection we finish in some time.
			scheduleJobFinish()
		}

		override fun onConnectionBroken() {
			Log.d(TAG, "onConnectionBroken")
			state = PushNotificationServiceStates.CONNECTING
		}

		override fun onNotAuthorized(userId: String) {
			notificationsHandler.onNotAuthorized(userId)
		}

		override fun onStoppingReconnectionAttempts() {
			Log.d(TAG, "onStoppingReconnectionAttempts")
			state = when (state) {
				PushNotificationServiceStates.CONNECTING -> PushNotificationServiceStates.STARTED
				else -> state
			}
			finishJobIfNeeded()
		}
	companion object {
		const val TAG = "NotificationSseListener"
	}
}