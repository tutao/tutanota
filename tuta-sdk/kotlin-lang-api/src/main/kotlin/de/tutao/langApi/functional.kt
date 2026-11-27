package de.tutao.langApi

import de.tutao.langApi.types.KtNumber
import de.tutao.langApi.types.KtString
import kotlin.reflect.full.memberProperties

fun <T> neverNull(item: T?): T {
	if (item == null) {
		println("Called neverNull with a null value")
	}

	return item as T
}

fun <T> assertNotNull(item: T?, message: TsString? = TsString("")): T {
	if (item == null) {
		throw Error("Assertion failed: $message")
	}

	return item
}

fun assertNotNaN(
	number: KtNumber,
	message: KtString = KtString("Found NaN when valid number is expected"),
): KtNumber {
	TODO()
}

fun <T> assertNull(value: T?, message: KtString = KtString("not null")) {
	TODO()
}

fun assert(assertion: Boolean, message: KtString) {
	TODO()
}

fun <R> downcast(obj: Any): R {
	TODO()
}

fun thisFunctionDoesNothing() {
	TODO()
}

fun <T> panicOnThrow(expression: () -> T): () -> T {
	TODO()
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

fun getNumericEnumValue(anyEnum: Enum<*>): KtNumber {
	val property = anyEnum::class.memberProperties
		.firstOrNull { it.name == "__ts_value" }
		?: error("${anyEnum::class.simpleName} does not have a __ts_value property.")
	return when (val result = property.getter.call(anyEnum)) {
		is KtNumber -> result
		else -> error(
			"${anyEnum::class.simpleName}.__ts_value must be String but was ${result?.let { it::class.simpleName } ?: "null"}"
		)
	}
}


fun wormhole(vararg params: Any) {
	// do-nothing
}