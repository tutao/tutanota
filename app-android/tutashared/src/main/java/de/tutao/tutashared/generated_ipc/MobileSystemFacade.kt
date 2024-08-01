/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Common operations implemented by each mobile platform.
 */
interface MobileSystemFacade {
	/**
	 * Redirect the user to Phone's Settings
	 */
	suspend fun goToSettings(
	): Unit
	/**
	 * Open URI in the OS.
	 */
	suspend fun openLink(
		uri: String,
	): Boolean
	/**
	 * Share the text via OS sharing mechanism.
	 */
	suspend fun shareText(
		text: String,
		title: String,
	): Boolean
	/**
	 * Returns whether the specified system permission has already been granted by the user.
	 */
	suspend fun hasPermission(
		permission: PermissionType,
	): Boolean
	/**
	 * Requests a system permission from the user.
	 */
	suspend fun requestPermission(
		permission: PermissionType,
	): Unit
	suspend fun getAppLockMethod(
	): AppLockMethod
	suspend fun setAppLockMethod(
		method: AppLockMethod,
	): Unit
	suspend fun enforceAppLock(
		method: AppLockMethod,
	): Unit
	suspend fun getSupportedAppLockMethods(
	): List<AppLockMethod>
}
