package de.tutao.tutashared

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.core.content.ContextCompat.startActivity
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClient.BillingResponseCode
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.MobilePaymentResult
import de.tutao.tutashared.ipc.MobilePaymentSubscriptionOwnership
import de.tutao.tutashared.ipc.MobilePaymentsFacade
import de.tutao.tutashared.ipc.MobilePlanPrice
import kotlinx.coroutines.CompletableDeferred
import androidx.core.net.toUri

class AndroidMobilePaymentsFacade(val activity: Activity, val app: AppType) : MobilePaymentsFacade {
	val billingClient: TutaoBillingClient = TutaoBillingClient(activity)

	// FIXME: should this handle plan changes as well?
	override suspend fun requestSubscriptionToPlan(
		plan: String,
		interval: Long,
		customerIdBytes: DataWrapper
	): MobilePaymentResult {
		val planPrefix = getPlanPrefix()
		val productId = when (plan) {
			"legend",
			"revolutionary" -> "$planPrefix.$plan"

			else -> error("Unsupported plan: $plan")
		}

		val basePlanId = when (interval) {
			1L -> "monthly"
			12L -> "yearly"
			else -> error("Unsupported interval: $interval")
		}

		val productDetails = billingClient.queryProduct(productId)
		val offerDetails = productDetails.subscriptionOfferDetails
			.orEmpty()
			.singleOrNull() { offer ->
				offer.basePlanId == basePlanId && offer.offerId == null
			} ?: error("Could not find base plan $basePlanId for product $productId")

		val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
			.setProductDetails(productDetails)
			.setOfferToken(offerDetails.offerToken)
			.build()

		val billingFlowParams =
			BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(productDetailsParams))
				.setObfuscatedAccountId(customerIdBytes.toObfuscatedAccountId()).build()

		return billingClient.launchBillingFlow(billingFlowParams)
	}

	override suspend fun getPlanPrices(): List<MobilePlanPrice> {
		val prefix = getPlanPrefix()
		val products = listOf("$prefix.legend", "$prefix.revolutionary").map { productId ->
			QueryProductDetailsParams.Product.newBuilder()
				.setProductId(productId)
				.setProductType(BillingClient.ProductType.SUBS)
				.build()
		}

		val params = QueryProductDetailsParams.newBuilder()
			.setProductList(products)
			.build()

		return billingClient.queryProductDetails(params)
	}

	override suspend fun showSubscriptionConfigView() {

		// "https://play.google.com/store/account/subscriptions?sku=$sku&package=$packageName"
		try {
			val myIntent = Intent(Intent.ACTION_VIEW, "https://play.google.com/store/account/subscriptions".toUri())
			activity.startActivity(myIntent)

		} catch (e: ActivityNotFoundException) {
			e.printStackTrace()
		}
	}

	override suspend fun queryExternalSubscriptionOwnership(customerIdBytes: DataWrapper?): MobilePaymentSubscriptionOwnership {

		val builder = QueryPurchasesParams.newBuilder();
		val params = builder
			.setProductType(BillingClient.ProductType.SUBS)
			.includeSuspendedSubscriptions(true)
			.build();

		val result = CompletableDeferred<MobilePaymentSubscriptionOwnership>()
		val listener =  TutaoPurchasesResponseListener({ billingResult, purchases ->
			if(billingResult.responseCode == BillingResponseCode.OK) {
				if(purchases.isEmpty()) result.complete( MobilePaymentSubscriptionOwnership.NO_SUBSCRIPTION)
				for (purchase in purchases) {
					if(purchase.purchaseState != Purchase.PurchaseState.PURCHASED) {
						continue
					}
					if(purchase.accountIdentifiers?.obfuscatedAccountId == customerIdBytes?.toObfuscatedAccountId()) {
						result.complete(MobilePaymentSubscriptionOwnership.OWNER)
					}
				}
				result.complete(MobilePaymentSubscriptionOwnership.NOT_OWNER)
			}
		})

		billingClient.queryPurchasesAsync(params, listener)

		return result.await()
	}

	override suspend fun isExternalSubscriptionRenewalEnabled(): Boolean {

		val builder = QueryPurchasesParams.newBuilder();
		val params = builder
			.setProductType(BillingClient.ProductType.SUBS)
			.includeSuspendedSubscriptions(true)
			.build();

		val result = CompletableDeferred<Boolean>()
		val listener =  TutaoPurchasesResponseListener({ billingResult, purchases ->
			if(billingResult.responseCode == BillingResponseCode.OK) {
				if(purchases.isEmpty()) result.complete(false)
				for (purchase in purchases) {
					if(purchase.isAutoRenewing) result.complete(true)
				}
				result.complete(false)
			}
		})

		billingClient.queryPurchasesAsync(params, listener)

		return result.await()
	}

	fun hasPlaystorePayment(): Boolean {
		return true
	}

	private fun getPlanPrefix(): String {
		val stage = if ("test" in BuildConfig.PACKAGE_NAME) {
			"test"
		} else if ("debug" in BuildConfig.PACKAGE_NAME) {
			"debug"
		} else {
			""
		}

		return when (app) {
			AppType.MAIL -> "${stage}plans"
			AppType.CALENDAR, AppType.DRIVE -> "${stage}plans.${app.name.lowercase()}"
		}
	}
}