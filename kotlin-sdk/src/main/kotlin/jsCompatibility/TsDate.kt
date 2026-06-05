package de.tutao.jsCompatibility

import java.time.Instant

/// A wrapper class to provide same Api as typescript `Date`
class JsDate private constructor(private var instant: Instant) {
}