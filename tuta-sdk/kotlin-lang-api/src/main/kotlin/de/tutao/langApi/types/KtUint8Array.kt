package de.tutao.langApi.types

class KtUint8Array {
	// Uint8Array uses unsigned values, ByteArray signed (0 to 255 vs -128 to 127)
	var value: ByteArray = ByteArray(0)

	val length: KtNumber
		get() = TODO()

	operator fun get(index: KtNumber): KtNumber? {
		TODO()
	}

	operator fun set(index: KtNumber, value: KtNumber) {
		TODO()
	}

	fun subarray(begin: KtNumber = KtNumber(0), end: KtNumber? = null): KtUint8Array {
		TODO()
	}

	fun set_notTheKeyword(array: KtArray<KtNumber>, targetOffset: KtNumber = KtNumber(0)) {
		TODO()
	}

	fun set_notTheKeyword(array: KtUint8Array, targetOffset: KtNumber = KtNumber(0)) {
		TODO()
	}

	fun fill(value: KtNumber, start: KtNumber = KtNumber(0), end: KtNumber? = null): KtUint8Array {
		TODO()
	}

	companion object {
		fun from(arrayLike: Iterable<KtNumber>): KtUint8Array {
			TODO()
		}

		fun <T> from(arrayLike: Iterable<T>, mapFn: (T) -> KtNumber): KtUint8Array {
			TODO()
		}

		fun of(vararg elements: KtNumber): KtUint8Array {
			TODO()
		}
	}
}
