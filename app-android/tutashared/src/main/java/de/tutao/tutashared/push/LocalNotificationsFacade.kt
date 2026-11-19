package de.tutao.tutashared.push

import androidx.annotation.StringRes

/** A LocalNotificationsFacade describes what to do with notifications after they have been received.
 * E.g. how is it displayed to the user, and how the user can interact with the notification.
 *
 * It enables decoupling the app-specific LocalNotificationsFacades
 * from the shared classes.
 *
 * @see [INotificationsHandler]
 * @see [NotificationsHandler]
 */
interface LocalNotificationsFacade {
	fun showErrorNotification(@StringRes message: Int, exception: Throwable?)
	fun createNotificationChannels()
}