package de.tutao.tutashared.ipc

import kotlinx.serialization.Serializable

/** Corresponds to DataFile in Typescript */
@Serializable
data class DataFile(
	val name: String,
	val mimeType: String,
	val data: DataWrapper,
	val size: Int,
) {
	@Suppress("unused")
	private val _type: String = "DataFile"
}