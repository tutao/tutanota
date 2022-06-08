/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

interface MobileFacade {
	 suspend fun handleBackPress(
	): Boolean
	 suspend fun visibilityChange(
		visibility: Boolean,
	): Unit
	 suspend fun keyboardSizeChanged(
		newSize: Int,
	): Unit
}
