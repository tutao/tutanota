package de.tutao.langApi

open class TutanotaError(val name: TsString, override val message: String? = null) : Error()

open class ProgrammingError(msg: TsString?) :
	TutanotaError(TsString("ProgrammingError"), msg?.inner ?: "Unknown Programming Error")
