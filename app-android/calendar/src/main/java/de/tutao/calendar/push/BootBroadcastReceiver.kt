package de.tutao.calendar.push

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat

class BootBroadcastReceiver : BroadcastReceiver() {
	override fun onReceive(context: Context, intent: Intent) {
		Log.d("BootBroadcastReceiver", "Got intent$intent")
		if (Intent.ACTION_BOOT_COMPLETED == intent.action || "android.intent.action.QUICKBOOT_POWERON" == intent.action
		) {
			Log.d("BootBroadcastReceiver", "on boot")
			val serviceIntent = PushNotificationService.startIntent(
					context,
					"BootBroadcastReceiver",
					attemptForeground = true,
			)
			ContextCompat.startForegroundService(context, serviceIntent)
		}
	}
}