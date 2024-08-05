/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Similar to browser's built-in PublicKeyCredentialDescriptor but we only specify ID here
 */
@Serializable
data class WebauthnKeyDescriptor(
	val id: DataWrapper,
)
