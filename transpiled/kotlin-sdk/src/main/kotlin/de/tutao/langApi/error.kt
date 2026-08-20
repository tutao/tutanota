package de.tutao.langApi

import de.tutao.langApi.types.KtString

open class TutanotaError(
	val name: KtString,
	val errMessage: KtString = KtString("Unspecified error message")
) : Error() {
	override val message: String?
		get() = this.errMessage.asPrimitive()
}

open class ProgrammingError(msg: KtString?) :
	TutanotaError(KtString("ProgrammingError"), msg ?: KtString("Unknown Programming Error"))
