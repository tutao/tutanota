package de.tutao.langApi

import de.tutao.langApi.types.KtInt
import de.tutao.langApi.types.KtString
import kotlin.reflect.full.memberProperties

fun <T> neverNull(item: T?): T {
	if (item == null) {
		println("Called neverNull with a null value")
	}

	return item as T
}

fun <T> assertNotNull(item: T?): T {
	if (item == null) {
		throw Error("")
	}

	return item
}

fun <T> isNotNull(item: T?): Boolean {
	return item != null
}

fun <T> isNull(item: T?): Boolean {
	return item == null
}

fun getStringEnumValue(anyEnum: Enum<*>): KtString {
	val property = anyEnum::class.memberProperties
		.firstOrNull { it.name == "__ts_value" }
		?: error("${anyEnum::class.simpleName} does not have a __ts_value property.")
	return when (val result = property.getter.call(anyEnum)) {
		is KtString -> result
		else -> error(
			"${anyEnum::class.simpleName}.__ts_value must be String but was ${result?.let { it::class.simpleName } ?: "null"}"
		)
	}
}

fun getNumericEnumValue(anyEnum: Enum<*>): KtInt {
	val property = anyEnum::class.memberProperties
		.firstOrNull { it.name == "__ts_value" }
		?: error("${anyEnum::class.simpleName} does not have a __ts_value property.")
	return when (val result = property.getter.call(anyEnum)) {
		is KtInt -> result
		else -> error(
			"${anyEnum::class.simpleName}.__ts_value must be String but was ${result?.let { it::class.simpleName } ?: "null"}"
		)
	}
}