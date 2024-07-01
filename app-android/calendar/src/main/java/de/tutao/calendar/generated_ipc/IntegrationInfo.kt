/* generated file, don't edit. */


package de.tutao.calendar.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Status of desktop integration.
 */
@Serializable
data class IntegrationInfo(
	val isMailtoHandler: Boolean,
	val isAutoLaunchEnabled: Boolean,
	val isIntegrated: Boolean,
	val isUpdateAvailable: Boolean,
)
