/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class MobileFacadeSendDispatcher (
	private val transport : NativeInterface
) : MobileFacade {
	private val encodedFacade = Json.encodeToString("MobileFacade")
	override suspend fun handleBackPress(
	): Boolean
	{
		val encodedMethod = Json.encodeToString("handleBackPress")
		val args : MutableList<String> = mutableListOf()
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return Json.decodeFromString(result)
	}
	
	override suspend fun visibilityChange(
		visibility: Boolean,
	): Unit
	{
		val encodedMethod = Json.encodeToString("visibilityChange")
		val args : MutableList<String> = mutableListOf()
		args.add(Json.encodeToString(visibility))
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return
	}
	
	override suspend fun keyboardSizeChanged(
		newSize: Int,
	): Unit
	{
		val encodedMethod = Json.encodeToString("keyboardSizeChanged")
		val args : MutableList<String> = mutableListOf()
		args.add(Json.encodeToString(newSize))
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return
	}
	
}
