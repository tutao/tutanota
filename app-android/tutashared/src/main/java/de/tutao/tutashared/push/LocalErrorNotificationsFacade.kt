package de.tutao.tutashared.push

import androidx.annotation.StringRes

interface LocalErrorNotificationsFacade {
	fun showErrorNotification(@StringRes message: Int, exception: Throwable?)
}