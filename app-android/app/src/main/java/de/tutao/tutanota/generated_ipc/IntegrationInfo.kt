/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class IntegrationInfo(
	val isMailtoHandler: Boolean,
	val isAutoLaunchEnabled: Boolean,
	val isIntegrated: Boolean,
	val isUpdateAvailable: Boolean,
)
