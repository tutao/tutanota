/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class ContactSyncResult(
	val createdOnDevice: List<StructuredContact>,
	val editedOnDevice: List<StructuredContact>,
	val deletedOnDevice: List<StructuredContact>,
)
