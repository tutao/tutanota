/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


@Serializable
data class NativeShortcut(
	val key: NativeKey,
	val ctrl: Boolean?,
	val alt: Boolean?,
	val shift: Boolean?,
	val meta: Boolean?,
	val help: String,
)
