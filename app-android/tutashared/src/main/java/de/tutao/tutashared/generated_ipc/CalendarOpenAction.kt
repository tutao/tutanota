/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

@Serializable
enum class CalendarOpenAction(val value: String) {
	@SerialName("0")
	AGENDA("0"),
	
	@SerialName("1")
	EVENT_EDITOR("1");
	
	companion object {
		 fun fromValue(
			value: String,
		): CalendarOpenAction?
			= when (value) {
			"0" -> AGENDA
			"1" -> EVENT_EDITOR
			else -> null
		}
	}
}
