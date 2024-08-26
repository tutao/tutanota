/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Common operations used by all native platforms.
 */
interface CommonNativeFacade {
	/**
	 * Opens mail editor to write a new email. If `mailToUrlString` is specified it takes priority.
	 */
	suspend fun createMailEditor(
		filesUris: List<String>,
		text: String,
		addresses: List<String>,
		subject: String,
		mailToUrlString: String,
	): Unit
	/**
	 * Opens the mailbox of an address, optionally to an email specified by requestedPath
	 */
	suspend fun openMailBox(
		userId: String,
		address: String,
		requestedPath: String?,
	): Unit
	suspend fun openCalendar(
		userId: String,
	): Unit
	suspend fun showAlertDialog(
		translationKey: String,
	): Unit
	/**
	 * All local alarms have been deleted, reschedule alarms for the current user.
	 */
	suspend fun invalidateAlarms(
	): Unit
	/**
	 * Called when the system theme preference has changed
	 */
	suspend fun updateTheme(
	): Unit
	/**
	 * prompt the user to enter a new password and a confirmation, taking an optional old password into account
	 */
	suspend fun promptForNewPassword(
		title: String,
		oldPassword: String?,
	): String
	/**
	 * prompt the user to enter a password
	 */
	suspend fun promptForPassword(
		title: String,
	): String
	/**
	 * Pass a list of files (.vcf) to be handled by the app and if compatible, import them
	 */
	suspend fun handleFileImport(
		filesUris: List<String>,
	): Unit
}
