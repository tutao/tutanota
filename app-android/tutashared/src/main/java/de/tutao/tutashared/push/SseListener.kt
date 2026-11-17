package de.tutao.tutashared.push

import android.util.Log
import de.tutao.tutashared.data.SseInfo
import de.tutao.tutashared.push.SseClient.SseListener

/** Enables hooks for reacting to messages received over SSE, or changes in SSE connectivity status.
 *
 *  @param serviceState the state indicator of its parent service.  Enables changing the overall state of the service
 *  in response to SSE messages or conditions.
 *
 *  @param notificationsHandler provides app-specific behaviors in response to SSE messages or connection changes.
 *  This could be any behavior that your app needs. @see [INotificationsHandler] and [CommonNotificationsHandler]
 *
 *  @param onStoppingReconnectionAttemptsCallback action to be taken when establishing a connection has failed multiple
 *  times such that the SseListener will give up on reestablishing it automatically.
 *
 *  @param onConnectionEstablishedCallback action to be taken when an SSE connection has been successfully established.
 */
class SseListener(
	var serviceState: PushNotificationServiceStateIndicator,
	val notificationsHandler: INotificationsHandler,
	val onStoppingReconnectionAttemptsCallback: ()->Unit,
	val onConnectionEstablishedCallback: ()->Unit): SseListener {

		override fun onStartingConnection(): Boolean {
			Log.d(TAG, "onStartingConnection")
			serviceState.state = PushNotificationServiceState.CONNECTING
			return notificationsHandler.onConnect()
		}

		override fun onMessage(data: String, sseInfo: SseInfo?) {
			if ("notification" == data) {
				notificationsHandler.onNewNotificationAvailable(sseInfo)
			}
		}

		override fun onConnectionEstablished() {
			Log.d(TAG, "onConnectionEstablished")
			serviceState.state = PushNotificationServiceState.CONNECTED

			// After establishing connection we finish in some time.
			onConnectionEstablishedCallback()
		}

		override fun onConnectionBroken() {
			Log.d(TAG, "onConnectionBroken")
			serviceState.state = PushNotificationServiceState.CONNECTING
		}

		override fun onNotAuthorized(userId: String) {
			notificationsHandler.onNotAuthorized(userId)
		}

		override fun onStoppingReconnectionAttempts() {
			Log.d(TAG, "onStoppingReconnectionAttempts")
			serviceState.state = when (serviceState.state) {
				PushNotificationServiceState.CONNECTING -> PushNotificationServiceState.STARTED
				else -> serviceState.state
			}
			onStoppingReconnectionAttemptsCallback()
		}
	companion object {
		const val TAG = "NotificationSseListener"
	}
}