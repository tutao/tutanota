package de.tutao.tutashared

import com.android.billingclient.api.BillingClient.BillingResponseCode
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import de.tutao.tutashared.ipc.MobilePaymentResult
import de.tutao.tutashared.ipc.MobilePaymentResultType
import kotlinx.coroutines.CompletableDeferred
import java.util.concurrent.atomic.AtomicReference

class PendingPurchase : PurchasesUpdatedListener {
	private val pendingPurchaseResult = AtomicReference<CompletableDeferred<MobilePaymentResult>?>(null)

	fun complete(result: MobilePaymentResult) {
		// replace the (hopefully) pending value with null so we know noone else messes with it.
		val pendingResult = pendingPurchaseResult.getAndSet(null)

		// we received a result, but we did not start the process from this device.
		if (pendingResult == null) {
			println("ignoring a successful payment result we were not waiting for: ${result.result} ${result.transactionID}")
		} else {
			println("received a successful payment result: ${result.result} ${result.transactionID}")
			pendingResult.complete(result)
		}
	}

	fun fail(error: Throwable) {
		val pendingResult = pendingPurchaseResult.getAndSet(null)
		if (pendingResult == null) {
			println("ignoring a failed payment result we were not waiting for: ${error.message}")
		} else {
			println("received a failed payment result: ${error.message}")
			pendingResult.completeExceptionally(error)
		}
	}

	fun start(): CompletableDeferred<MobilePaymentResult> {
		val deferredResult = CompletableDeferred<MobilePaymentResult>()
		check(
			pendingPurchaseResult.compareAndSet(
				null,
				deferredResult
			)
		) { "A Google Play purchase flow is already in progress" }
		return deferredResult
	}

	fun reset(deferredResult: CompletableDeferred<MobilePaymentResult>) {
		pendingPurchaseResult.compareAndSet(deferredResult, null)
	}

	override fun onPurchasesUpdated(
		billingResult: BillingResult,
		purchases: List<Purchase?>?
	) {
		when (billingResult.responseCode) {
			BillingResponseCode.OK -> {
				val purchase = purchases.orEmpty().singleOrNull()
				if (purchase == null) {
					fail(
						IllegalStateException("successful billing update contained ${purchases?.size} purchases")
					)
				} else {
					try {
						complete(purchase.toMobilePaymentResult())
					} catch (e: Throwable) {
						fail(e)
					}
				}
			}

			BillingResponseCode.USER_CANCELED -> {
				complete(
					MobilePaymentResult(
						result = MobilePaymentResultType.CANCELLED,
						transactionID = null,
						transactionHash = null
					)
				)
			}

			else -> {
				fail(
					IllegalStateException("purchase failed: code=${billingResult.responseCode}, message=${billingResult.debugMessage}")
				)
			}

		}

	}
}