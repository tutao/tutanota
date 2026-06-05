package de.tutao.jsCompatibility

open class TsError(
	message: String = ""
) : RuntimeException(message) {

	val name: String = this::class.simpleName ?: "Error"

	final override var message: String = message
		private set

	val stack: String?
		get() = this.stackTraceToString()

	override fun toString(): String {
		return "$name: $message"
	}

	fun setMessage(newMessage: String) {
		message = newMessage
	}
}