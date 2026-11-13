package de.tutao.tutashared.push

import de.tutao.tutashared.data.SseInfo
import kotlinx.coroutines.Job
interface INotificationsHandler {
	fun onNewNotificationAvailable(sseInfo: SseInfo?): Job
	fun onConnect(): Boolean
	fun onNotAuthorized(userId: String)
}
