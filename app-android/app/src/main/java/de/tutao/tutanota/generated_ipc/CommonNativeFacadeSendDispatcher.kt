/* generated file, don't edit. */


package de.tutao.tutanota.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class CommonNativeFacadeSendDispatcher (
	private val transport : NativeInterface
) : CommonNativeFacade {
	private val encodedFacade = Json.encodeToString("CommonNativeFacade")
	override suspend fun createMailEditor(
		filesUris: List<String>,
		text: String,
		addresses: List<String>,
		subject: String,
		mailToUrlString: String,
	): Unit
	{
		val encodedMethod = Json.encodeToString("createMailEditor")
		val args : MutableList<String> = mutableListOf()
		args.add(Json.encodeToString(filesUris))
		args.add(Json.encodeToString(text))
		args.add(Json.encodeToString(addresses))
		args.add(Json.encodeToString(subject))
		args.add(Json.encodeToString(mailToUrlString))
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return
	}
	
	override suspend fun openMailBox(
		userId: String,
		address: String,
		requestedPath: String?,
	): Unit
	{
		val encodedMethod = Json.encodeToString("openMailBox")
		val args : MutableList<String> = mutableListOf()
		args.add(Json.encodeToString(userId))
		args.add(Json.encodeToString(address))
		args.add(Json.encodeToString(requestedPath))
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return
	}
	
	override suspend fun openCalendar(
		userId: String,
	): Unit
	{
		val encodedMethod = Json.encodeToString("openCalendar")
		val args : MutableList<String> = mutableListOf()
		args.add(Json.encodeToString(userId))
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return
	}
	
	override suspend fun showAlertDialog(
		translationKey: String,
	): Unit
	{
		val encodedMethod = Json.encodeToString("showAlertDialog")
		val args : MutableList<String> = mutableListOf()
		args.add(Json.encodeToString(translationKey))
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return
	}
	
	override suspend fun invalidateAlarms(
	): Unit
	{
		val encodedMethod = Json.encodeToString("invalidateAlarms")
		val args : MutableList<String> = mutableListOf()
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return
	}
	
}
