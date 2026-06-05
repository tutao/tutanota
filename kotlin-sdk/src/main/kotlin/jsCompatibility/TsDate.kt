package de.tutao.jsCompatibility

import java.time.Instant

/// A wrapper class to provide same Api as typescript `Date`
class TsDate private constructor() {
	private lateinit var instant: Instant
}