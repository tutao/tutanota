package de.tutao.tutashared

// this is a stub that stands in for the google billing API in our f-droid build.
fun TutaBilling.getBillingClient(): BillingWrapper {
	return object : BillingWrapper {
		override fun isReal(): Boolean {
			return false
		}

		override fun getPrices() {
			// noOp
		}

		override fun buyThing() {
			// noOp
		}
	}
}