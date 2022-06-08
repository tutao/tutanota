/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface CommonNativeFacade {
	 suspend fun createMailEditor(
		filesUris: List<String>,
		text: String,
		addresses: List<String>,
		subject: String,
		mailToUrlString: String,
	): Unit
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
	 suspend fun invalidateAlarms(
	): Unit
}
