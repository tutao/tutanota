/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Common external calendar operations that must be completed on native side
 */
interface ExternalCalendarFacade {
	/**
	 * Fetches the content of an external calendar and return it as a string
	 */
	suspend fun fetchExternalCalendar(
		url: String,
	): String
}
