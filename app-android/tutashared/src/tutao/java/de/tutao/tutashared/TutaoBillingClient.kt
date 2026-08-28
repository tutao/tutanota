package de.tutao.tutashared

import android.app.Activity
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClient.BillingResponseCode
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.android.billingclient.api.queryProductDetails
import de.tutao.tutashared.ipc.MobilePaymentResult
import de.tutao.tutashared.ipc.MobilePlanPrice
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

/**
 * wrapper around the google billing library to keep some initialization and error handling code out of the MobilePaymentsFacade.
 * Also makes sure it's easy to use this in suspend functions, as googles API for purchases is rather callback-based
 */
class TutaoBillingClient(val activity: Activity) {
	val initialized = CompletableDeferred<Unit>()

	// max time to wait before declaring the billing clients initial connection attempt failed
	val INIT_TIMEOUT: Duration = 20.seconds
	val pendingPurchase = PendingPurchase()
	private val googleBillingClient: BillingClient = makeBillingClient(activity, pendingPurchase)

	init {
		googleBillingClient.startConnection(BillingStateListener(initialized))
	}

	suspend fun launchBillingFlow(params: BillingFlowParams): MobilePaymentResult {
		withTimeout(INIT_TIMEOUT) {
			initialized.await()
		}
		val deferredResult = pendingPurchase.start()
		try {
			val launchResult = withContext(Dispatchers.Main.immediate) {
				googleBillingClient.launchBillingFlow(activity, params)
			}
			if (launchResult.responseCode != BillingResponseCode.OK) {
				error("Failed to launch: code=${launchResult.responseCode} message=${launchResult.debugMessage}")
			}
			// duration until resolution depends on how fast the user goes through the flow
			return deferredResult.await()
		} finally {
			// reset the pending purchase - at this point we're definitely done.
			pendingPurchase.reset(deferredResult)
		}
	}

	suspend fun queryProductDetails(params: QueryProductDetailsParams): List<MobilePlanPrice> {
		withTimeout(INIT_TIMEOUT) {
			initialized.await()
		}
		val result = googleBillingClient.queryProductDetails(params)

		if (result.billingResult.responseCode != BillingResponseCode.OK || result.productDetailsList == null) {
			error("failed to get prices code: " + result.billingResult.responseCode + " " + result.productDetailsList)
		}
		return (result.productDetailsList as Iterable<ProductDetails>).map { product ->
			product.toMobilePlanPrice()
		}
	}

	suspend fun queryPurchasesAsync(params: QueryPurchasesParams, listener: TutaoPurchasesResponseListener){

		withTimeout(INIT_TIMEOUT) {
			initialized.await()
		}
		googleBillingClient.queryPurchasesAsync(params, listener)
	}

	suspend fun queryProduct(productId: String): ProductDetails {
		withTimeout(INIT_TIMEOUT) {
			initialized.await()
		}
		val product = QueryProductDetailsParams.Product.newBuilder()
			.setProductId(productId)
			.setProductType(BillingClient.ProductType.SUBS)
			.build()


		val params = QueryProductDetailsParams.newBuilder()
			.setProductList(listOf(product))
			.build()

		val result = googleBillingClient.queryProductDetails(params)

		if (result.billingResult.responseCode != BillingResponseCode.OK) {
			error("Failed to query $productId")
		}

		val productDetails = result.productDetailsList.orEmpty()
		return productDetails.singleOrNull()
			?: error("Received more than one ProductDetails for $productId")
	}
}