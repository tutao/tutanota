/* generated file, don't edit. */


@file:Suppress("NAME_SHADOWING")
package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

class MobileContactsFacadeReceiveDispatcher(
	private val json: Json,
	private val facade: MobileContactsFacade,
) {
	
	suspend fun dispatch(method: String, arg: List<String>): String {
		when (method) {
			"findSuggestions" -> {
				val query: String = json.decodeFromString(arg[0])
				val result: List<ContactSuggestion> = this.facade.findSuggestions(
					query,
				)
				return json.encodeToString(result)
			}
			"saveContacts" -> {
				val username: String = json.decodeFromString(arg[0])
				val contacts: List<StructuredContact> = json.decodeFromString(arg[1])
				val result: Unit = this.facade.saveContacts(
					username,
					contacts,
				)
				return json.encodeToString(result)
			}
			"syncContacts" -> {
				val username: String = json.decodeFromString(arg[0])
				val contacts: List<StructuredContact> = json.decodeFromString(arg[1])
				val result: ContactSyncResult = this.facade.syncContacts(
					username,
					contacts,
				)
				return json.encodeToString(result)
			}
			"getContactBooks" -> {
				val result: List<ContactBook> = this.facade.getContactBooks(
				)
				return json.encodeToString(result)
			}
			"getContactsInContactBook" -> {
				val bookId: String = json.decodeFromString(arg[0])
				val username: String = json.decodeFromString(arg[1])
				val result: List<StructuredContact> = this.facade.getContactsInContactBook(
					bookId,
					username,
				)
				return json.encodeToString(result)
			}
			"deleteContacts" -> {
				val username: String = json.decodeFromString(arg[0])
				val contactId: String? = json.decodeFromString(arg[1])
				val result: Unit = this.facade.deleteContacts(
					username,
					contactId,
				)
				return json.encodeToString(result)
			}
			"isLocalStorageAvailable" -> {
				val result: Boolean = this.facade.isLocalStorageAvailable(
				)
				return json.encodeToString(result)
			}
			"findLocalMatches" -> {
				val contacts: List<StructuredContact> = json.decodeFromString(arg[0])
				val result: List<String> = this.facade.findLocalMatches(
					contacts,
				)
				return json.encodeToString(result)
			}
			"deleteLocalContacts" -> {
				val contacts: List<String> = json.decodeFromString(arg[0])
				val result: Unit = this.facade.deleteLocalContacts(
					contacts,
				)
				return json.encodeToString(result)
			}
			else -> throw Error("unknown method for MobileContactsFacade: $method")
		}
	}
}
