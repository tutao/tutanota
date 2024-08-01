/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*


/**
 * Search-in-page result by Electron.
 */
@Serializable
data class ElectronResult(
	val matches: Int,
	val activeMatchOrdinal: Int,
)
