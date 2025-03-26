package de.tutao.calendar.widget.data

import de.tutao.calendar.widget.WidgetUpdateTrigger
import kotlinx.serialization.Serializable

@Serializable
data class LastSyncDao(
	val lastSync: Long,
	val trigger: WidgetUpdateTrigger,
	val force: Boolean
)