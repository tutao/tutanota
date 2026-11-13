package de.tutao.tutashared.push

import androidx.annotation.StringRes

interface ILocalNotificationsFacade {
	fun showErrorNotification(@StringRes message: Int, exception: Throwable?)
	fun createNotificationChannels()
}