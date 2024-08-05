/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class MobileFacadeSendDispatcher (
	private val json: Json,
	private val transport : NativeInterface,
) : MobileFacade {
	private val encodedFacade = json.encodeToString("MobileFacade")
	override suspend fun handleBackPress(
	): Boolean
	{
		val encodedMethod = json.encodeToString("handleBackPress")
		val args : MutableList<String> = mutableListOf()
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return json.decodeFromString(result)
	}
	
	override suspend fun visibilityChange(
		visibility: Boolean,
	): Unit
	{
		val encodedMethod = json.encodeToString("visibilityChange")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(visibility))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun keyboardSizeChanged(
		newSize: Int,
	): Unit
	{
		val encodedMethod = json.encodeToString("keyboardSizeChanged")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(newSize))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
}
