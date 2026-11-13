package de.tutao.tutashared.push

import android.util.Log
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.push.SseClient.SseListener

class SseListener(
	var state: PushNotificationServiceStateIndicator,
	val notificationsHandler: INotificationsHandler,
	val finishJobIfNeededCallback: ()->Unit,
	val scheduleJobFinishCallback: ()->Unit): SseListener {

		override fun onStartingConnection(): Boolean {
			Log.d(TAG, "onStartingConnection")
			state.state = PushNotificationServiceStates.CONNECTING
			return notificationsHandler.onConnect()
		}

		override fun onMessage(data: String, sseInfo: SseInfo?) {
			if ("notification" == data) {
				notificationsHandler.onNewNotificationAvailable(sseInfo)
			}
		}

		override fun onConnectionEstablished() {
			Log.d(TAG, "onConnectionEstablished")
			state.state = PushNotificationServiceStates.CONNECTED

			// After establishing connection we finish in some time.
			scheduleJobFinishCallback()
		}

		override fun onConnectionBroken() {
			Log.d(TAG, "onConnectionBroken")
			state.state = PushNotificationServiceStates.CONNECTING
		}

		override fun onNotAuthorized(userId: String) {
			notificationsHandler.onNotAuthorized(userId)
		}

		override fun onStoppingReconnectionAttempts() {
			Log.d(TAG, "onStoppingReconnectionAttempts")
			state.state = when (state.state) {
				PushNotificationServiceStates.CONNECTING -> PushNotificationServiceStates.STARTED
				else -> state.state
			}
			finishJobIfNeededCallback()
		}
	companion object {
		const val TAG = "NotificationSseListener"
	}
}