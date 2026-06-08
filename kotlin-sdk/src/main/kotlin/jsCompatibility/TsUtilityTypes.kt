package de.tutao.jsCompatibility

object console {
	fun log(vararg items: Any) {}
	fun error(vararg items: Any) {}
	fun trace(vararg items: Any) {}
	fun warn(vararg items: Any) {}
}

class TURL {}

fun parseInt(s: TsString) = TsNumber.parseInt(s)