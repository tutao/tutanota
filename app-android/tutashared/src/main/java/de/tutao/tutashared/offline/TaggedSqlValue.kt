package de.tutao.tutashared.offline

import de.tutao.tutashared.ipc.DataWrapper
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
sealed class TaggedSqlValue {
	@Serializable
	@SerialName("SqlNull")
	object Null : TaggedSqlValue()

	@Serializable
	@SerialName("SqlStr")
	data class Str(val value: String) : TaggedSqlValue()

	@Serializable
	@SerialName("SqlNum")
	data class Num(val value: Int) : TaggedSqlValue()

	@Serializable
	@SerialName("SqlBytes")
	data class Bytes(val value: DataWrapper) : TaggedSqlValue()
}

fun TaggedSqlValue.unwrap(): Any? = when (this) {
	is TaggedSqlValue.Null -> null
	is TaggedSqlValue.Str -> this.value
	is TaggedSqlValue.Num -> this.value
	is TaggedSqlValue.Bytes -> this.value.data
}

fun String.sqlTagged() = TaggedSqlValue.Str(this)

fun DataWrapper.sqlTagged() = TaggedSqlValue.Bytes(this)