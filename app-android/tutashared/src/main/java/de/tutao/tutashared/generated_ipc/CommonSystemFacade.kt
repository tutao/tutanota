/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Common operations implemented by each platform.
 */
interface CommonSystemFacade {
	/**
	 * Must be called before any other methods are called.
	 */
	suspend fun initializeRemoteBridge(
	): Unit
	/**
	 * Reload the webpage with the specified query arguments.
	 */
	suspend fun reload(
		query: Map<String, String>,
	): Unit
	/**
	 * Returns the log contents of the native process.
	 */
	suspend fun getLog(
	): String
}
