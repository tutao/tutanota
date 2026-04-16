package de.tutao.tutashared.alarms

import android.content.Context
import android.content.Intent
import java.util.Date

interface AlarmIntentFactory {

	fun makeAlarmIntent(
		context: Context,
		occurrence: Int,
		identifier: String,
		summary: String?,
		eventDate: Date,
		isAllDayEvent: Boolean,
		userId: String?
	): Intent
}