package de.tutao.tutashared

import android.app.Activity
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.MobilePaymentResult
import de.tutao.tutashared.ipc.MobilePaymentResultType
import de.tutao.tutashared.ipc.MobilePlanPrice
import java.lang.Long
import java.util.UUID
import kotlin.ByteArray
import kotlin.IllegalStateException
import kotlin.String


//this file contains some extension functions for google billing types that bridge them to our types.


/**
 * map google's ProductDetails to something the web app can work with
 */
fun ProductDetails.toMobilePlanPrice(): MobilePlanPrice {
	val offers = subscriptionOfferDetails!!
	// only take offers without an offerId (these are non-discounted)
	val basePlans = offers.filter { it.offerId == null }
	// these only have one pricing phase since we're not doing 50% off the first year stuff here.
	val monthlyPlan = basePlans.find { it.basePlanId == "monthly" }!!.pricingPhases.pricingPhaseList.last()
	val yearlyPlan = basePlans.find { it.basePlanId == "yearly" }!!.pricingPhases.pricingPhaseList.last()

	return MobilePlanPrice(
		// eg plans.yearly -> yearly
		productId.substringAfterLast("."),
		monthlyPlan.priceAmountMicros,
		yearlyPlan.priceAmountMicros,
		null,
		monthlyPlan.formattedPrice,
		yearlyPlan.formattedPrice,
		null,
		false
	)
}

/**
 * map google's Purchase to something the web app can work with, if possible.
 * throws for unexpected purchase states.
 */
fun Purchase.toMobilePaymentResult(): MobilePaymentResult {
	when (purchaseState) {
		Purchase.PurchaseState.PENDING -> {
			return MobilePaymentResult(
				result = MobilePaymentResultType.PENDING,
				transactionID = null,
				transactionHash = null
			)
		}

		Purchase.PurchaseState.PURCHASED -> {
			return MobilePaymentResult(
				result = MobilePaymentResultType.SUCCESS,
				transactionID = purchaseToken,
				transactionHash = null
			)
		}

		else -> {
			throw IllegalStateException("Purchase has unknown state: $purchaseState")
		}
	}
}

/**
 * we pass the customerId to google together with the purchase request so we can determine the correct customer once we receive the subscription
 * notification from google on the backend.
 *
 * ergo, the result of this needs to be reversible.
 */
fun DataWrapper.toObfuscatedAccountId(): String {
	return generatedIdToUUID(this).toString()
}

/**
 * Convert a Byte array of 9 bytes into a UUID to send to the app store. this function is also implemented in the swift code
 * of the app in IosMobilePaymentsFacade.customerIdToUUID() and also in the server.
 *
 * @param id id to convert
 * @return UUID
 */
fun generatedIdToUUID(id: DataWrapper): UUID {
	val bytes = ByteArray(16)

	System.arraycopy(id.data, 0, bytes, 0, 6)
	System.arraycopy(id.data, 6, bytes, 9, 3)

	// version/type: name-based (3)
	bytes[6] = (3 shl 4).toByte()

	// variant: ietf (2)
	bytes[8] = (2 shl 6).toByte()

	var high = 0L
	var low = 0L
	for (i in 0..<Long.BYTES) {
		high = (high shl 8) or (bytes[i].toLong() and 0xFFL)
		low = (low shl 8) or (bytes[i + Long.BYTES].toLong() and 0xFFL)
	}

	return UUID(high, low)
}

/**
 * configures a new instance of the google billing client
 */
fun makeBillingClient(activity: Activity, purchasesUpdatedListener: PurchasesUpdatedListener): BillingClient {
	return BillingClient.newBuilder(activity)
		.setListener(purchasesUpdatedListener)
		.enableAutoServiceReconnection()
		.enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()).build()
}