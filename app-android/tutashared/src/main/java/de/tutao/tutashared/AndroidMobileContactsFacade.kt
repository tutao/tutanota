package de.tutao.tutashared

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json


/**
 * Android doesn't really have a unique id for account so we use account type and name as a unique id.
 * We serialize it as JSON because both fields can have arbitrary values in them and we don't want to deal with
 * escaping.
 */
@Serializable
data class ContactBookId(val accountType: String?, val accountName: String?) {
	fun toJson() = Json.encodeToString(this)

	companion object {
		fun fromJson(jsonString: String): ContactBookId = Json.decodeFromString(jsonString)
	}
}