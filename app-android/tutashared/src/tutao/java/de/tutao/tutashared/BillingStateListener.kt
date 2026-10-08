package de.tutao.tutashared

import com.android.billingclient.api.BillingClient.BillingResponseCode
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingResult
import de.tutao.tutashared.error.MobilePaymentError
import kotlinx.coroutines.CompletableDeferred

class BillingStateListener(private val initialized: CompletableDeferred<Unit>) : BillingClientStateListener {
	override fun onBillingSetupFinished(billingResult: BillingResult) {
		if (billingResult.responseCode == BillingResponseCode.OK) {
			println("billing connected!")
			initialized.complete(Unit)
		} else if (billingResult.responseCode == BillingResponseCode.BILLING_UNAVAILABLE) {
			// this is not an error we can meaningfully handle, but it is expected to happen to a certain
			// amount of users.
			// https://developer.android.com/google/play/billing/errors#billing_unavailable_error_code_3
			println(
				"Billing setup failed: " +
						"code=${billingResult.responseCode}, " +
						"message=${billingResult.debugMessage}"
			)
			initialized.completeExceptionally(MobilePaymentError())
		} else {
			initialized.completeExceptionally(
				IllegalStateException(
					"Billing setup failed: " +
							"code=${billingResult.responseCode}, " +
							"message=${billingResult.debugMessage}"
				)
			)
		}
	}

	override fun onBillingServiceDisconnected() {
		println("billing disconnected!")
		// If automatic service reconnection is enabled, this can be left empty (no-op)
		// because the library handles retries. You can still use this for non-retry
		// tasks like logging or updating the UI to reflect a disconnected state.
		// Otherwise, try to restart the connection on the next request to
		// Google Play by calling the startConnection() method.
	}
}