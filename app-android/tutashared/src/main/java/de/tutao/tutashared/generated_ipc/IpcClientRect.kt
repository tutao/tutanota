/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Position and size of the active element. Used e.g. as an anchor for file picker popup.
 */
@Serializable
data class IpcClientRect(
	val x: Int,
	val y: Int,
	val width: Int,
	val height: Int,
)
