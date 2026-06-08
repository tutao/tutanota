package de.tutao.jsCompatibility


typealias Resolve<T> = (T) -> Unit // T    : Any?
typealias Reject<U> = (U) -> Unit // U    : Throwable

class Promise<T>(private val block: (Resolve<T>, Reject<Throwable>) -> Unit) {

	companion object {
		fun <T> resolve(promise: Promise<T>): Promise<T> = promise
		fun <T> resolve(then: (Resolve<T>) -> Unit) = Promise<T> { _resolve, _ -> then(_resolve) }
		fun resolve(): Promise<Unit> = Promise { _resolve, _ -> _resolve(Unit) }
	}
}