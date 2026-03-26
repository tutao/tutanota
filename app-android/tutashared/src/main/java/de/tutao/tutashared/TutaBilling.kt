package de.tutao.tutashared

class TutaBilling

// we wrap the com.android.billingclient library because it's not available in our f-droid build flavor.
interface BillingWrapper {
	fun isReal(): Boolean
	fun getPrices()
	fun buyThing()
}

