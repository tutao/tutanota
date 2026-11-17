package de.tutao.tutashared.push

import de.tutao.tutashared.data.SseInfo
import kotlinx.coroutines.Job

/** Describes methods that should be provided by all NotificationsHandlers.
 * @see [CommonNotificationsHandler]
 */
interface INotificationsHandler {
	fun onNewNotificationAvailable(sseInfo: SseInfo?): Job
	fun onConnect(): Boolean
	fun onNotAuthorized(userId: String)
}
