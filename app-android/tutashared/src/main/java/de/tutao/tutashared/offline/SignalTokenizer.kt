package de.tutao.tutashared.offline

import com.sun.jna.Library
import com.sun.jna.Native
import com.sun.jna.Pointer

object SignalTokenizer {
	private val INSTANCE: TokenizerLibrary = Native.load(
		"signal_tokenizer",
		TokenizerLibrary::class.java
	)

	fun tokenize(query: String): List<String> {
		val ptr = INSTANCE.signal_tokenize(query)
		val result = INSTANCE.signal_tokenize_from_ptr(ptr)
		INSTANCE.signal_tokenize_free(ptr)
		return result.toList()
	}

	private interface TokenizerLibrary : Library {
		fun signal_tokenize(query: String): Pointer

		fun signal_tokenize_from_ptr(result: Pointer): Array<String>

		fun signal_tokenize_free(pointer: Pointer)
	}
}