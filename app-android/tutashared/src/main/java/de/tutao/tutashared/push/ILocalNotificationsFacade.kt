package de.tutao.tutashared.push

import androidx.annotation.StringRes

/**
 * This is an ad-hoc interface.  It enables decoupling the app-specific LocalNotificationsFacades
 * from the shared classes.  The distinction between a LocalNotificationsFacade and NotificationsHandler
 * is not obvious, and they could probably be organized differently in the future.
 *
 * @see [INotificationsHandler]
 * @see [CommonNotificationsHandler]
 */
interface ILocalNotificationsFacade {
	fun showErrorNotification(@StringRes message: Int, exception: Throwable?)
	fun createNotificationChannels()
}