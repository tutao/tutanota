package de.tutao.tutashared

import com.android.billingclient.api.BillingClient

fun TutaBilling.getBillingClient(): BillingWrapper {
	val builder = BillingClient.newBuilder(this)
	val client = builder.build()
	println(client)
	return object : BillingWrapper {
		override fun isReal(): Boolean {
			return true
		}

		override fun getPrices() {
			println(client.isReady)
		}

		override fun buyThing() {
			println("buy " + client.isReady)
		}
	}
}