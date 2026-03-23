package de.tutao.tutashared

import java.time.Instant


interface DateProvider {
	val now: Instant
}

class DateProviderImpl : DateProvider {
	override val now: Instant
		get() = Instant.now()
}