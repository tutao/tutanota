/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class CommonNativeFacadeSendDispatcher (
	private val json: Json,
	private val transport : NativeInterface,
) : CommonNativeFacade {
	private val encodedFacade = json.encodeToString("CommonNativeFacade")
	override suspend fun createMailEditor(
		filesUris: List<String>,
		text: String,
		addresses: List<String>,
		subject: String,
		mailToUrlString: String,
	): Unit
	{
		val encodedMethod = json.encodeToString("createMailEditor")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(filesUris))
		args.add(json.encodeToString(text))
		args.add(json.encodeToString(addresses))
		args.add(json.encodeToString(subject))
		args.add(json.encodeToString(mailToUrlString))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun openMailBox(
		userId: String,
		address: String,
		requestedPath: String?,
	): Unit
	{
		val encodedMethod = json.encodeToString("openMailBox")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(userId))
		args.add(json.encodeToString(address))
		args.add(json.encodeToString(requestedPath))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun openCalendar(
		userId: String,
		action: CalendarOpenAction?,
		dateIso: String?,
		eventId: String?,
	): Unit
	{
		val encodedMethod = json.encodeToString("openCalendar")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(userId))
		args.add(json.encodeToString(action))
		args.add(json.encodeToString(dateIso))
		args.add(json.encodeToString(eventId))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun openContactEditor(
		contactId: String,
	): Unit
	{
		val encodedMethod = json.encodeToString("openContactEditor")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(contactId))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun showAlertDialog(
		translationKey: String,
	): Unit
	{
		val encodedMethod = json.encodeToString("showAlertDialog")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(translationKey))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun invalidateAlarms(
	): Unit
	{
		val encodedMethod = json.encodeToString("invalidateAlarms")
		val args : MutableList<String> = mutableListOf()
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun updateTheme(
	): Unit
	{
		val encodedMethod = json.encodeToString("updateTheme")
		val args : MutableList<String> = mutableListOf()
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun promptForNewPassword(
		title: String,
		oldPassword: String?,
	): String
	{
		val encodedMethod = json.encodeToString("promptForNewPassword")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(title))
		args.add(json.encodeToString(oldPassword))
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return json.decodeFromString(result)
	}
	
	override suspend fun promptForPassword(
		title: String,
	): String
	{
		val encodedMethod = json.encodeToString("promptForPassword")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(title))
		val result = this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
		return json.decodeFromString(result)
	}
	
	override suspend fun handleFileImport(
		filesUris: List<String>,
	): Unit
	{
		val encodedMethod = json.encodeToString("handleFileImport")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(filesUris))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun openSettings(
		path: String,
	): Unit
	{
		val encodedMethod = json.encodeToString("openSettings")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(path))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
	override suspend fun sendLogs(
		logs: String,
	): Unit
	{
		val encodedMethod = json.encodeToString("sendLogs")
		val args : MutableList<String> = mutableListOf()
		args.add(json.encodeToString(logs))
		this.transport.sendRequest("ipc", listOf(encodedFacade, encodedMethod) + args)
	}
	
}
