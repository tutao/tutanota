package de.tutao.tutashared

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import androidx.core.net.toUri
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingFlowParams.ProductDetailsParams.SubscriptionProductReplacementParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.MobilePaymentResult
import de.tutao.tutashared.ipc.MobilePaymentSubscriptionOwnership
import de.tutao.tutashared.ipc.MobilePaymentsFacade
import de.tutao.tutashared.ipc.MobilePlanPrice

class AndroidMobilePaymentsFacade(val activity: Activity, val app: AppType) : MobilePaymentsFacade {
	val billingClient: TutaoBillingClient = TutaoBillingClient(activity)

	// Handles plan changes as well as new subscriptions.
	override suspend fun requestSubscriptionToPlan(
		plan: String,
		interval: Long,
		customerIdBytes: DataWrapper,
		currentInterval: Long?,
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

		val accountId = customerIdBytes.toObfuscatedAccountId()
		val currentPurchases = billingClient.queryPurchases(
			QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).includeSuspendedSubscriptions(true).build()
		).filter { it.purchaseState == Purchase.PurchaseState.PURCHASED && it.accountIdentifiers?.obfuscatedAccountId == accountId }
		val currentPurchase = currentPurchases.singleOrNull()
		if (currentPurchases.size > 1) error("Multiple subscriptions found for this account")
		if (currentPurchase != null) {
			return replaceSubscription(productId, interval, currentInterval, accountId, productDetails, offerDetails, currentPurchase)
		}

		val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
			.setProductDetails(productDetails)
			.setOfferToken(offerDetails.offerToken)
			.build()

		val billingFlowParams =
			BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(productDetailsParams))
				.setObfuscatedAccountId(customerIdBytes.toObfuscatedAccountId()).build()

		return billingClient.launchBillingFlow(billingFlowParams)
	}

	private suspend fun replaceSubscription(
		productId: String,
		interval: Long,
		currentInterval: Long?,
		accountId: String,
		productDetails: ProductDetails,
		offerDetails: ProductDetails.SubscriptionOfferDetails,
		currentPurchase: Purchase,
	): MobilePaymentResult {
		val oldProductId = currentPurchase.products.single()
		val oldInterval = currentInterval ?: error("Missing current interval")
		val oldOffer = (if (oldProductId == productId) productDetails else billingClient.queryProduct(oldProductId)).subscriptionOfferDetails
			.orEmpty().single { it.basePlanId == (if (oldInterval == 12L) "yearly" else "monthly") && it.offerId == null }
		val isUpgrade = offerDetails.pricingPhases.pricingPhaseList.last().priceAmountMicros / interval >
			oldOffer.pricingPhases.pricingPhaseList.last().priceAmountMicros / oldInterval
		val mode = if (oldProductId == productId) {
			SubscriptionProductReplacementParams.ReplacementMode.WITHOUT_PRORATION
		} else if (isUpgrade && oldInterval == 1L && interval == 12L) {
			SubscriptionProductReplacementParams.ReplacementMode.CHARGE_FULL_PRICE
		} else if (isUpgrade) {
			SubscriptionProductReplacementParams.ReplacementMode.CHARGE_PRORATED_PRICE
		} else {
			SubscriptionProductReplacementParams.ReplacementMode.DEFERRED
		}
		val productDetailsParams = BillingFlowParams.ProductDetailsParams.newBuilder()
			.setProductDetails(productDetails)
			.setOfferToken(offerDetails.offerToken)
			.setSubscriptionProductReplacementParams(
				SubscriptionProductReplacementParams.newBuilder().setOldProductId(oldProductId).setReplacementMode(mode).build()
			).build()
		val billingFlowParams = BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(productDetailsParams))
			.setObfuscatedAccountId(accountId)
			.setSubscriptionUpdateParams(
				BillingFlowParams.SubscriptionUpdateParams.newBuilder().setOldPurchaseToken(currentPurchase.purchaseToken).build()
			).build()
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
		val params = QueryPurchasesParams.newBuilder()
			.setProductType(BillingClient.ProductType.SUBS)
			.includeSuspendedSubscriptions(true)
			.build()
		val purchases = billingClient.queryPurchases(params)
		if (purchases.isEmpty()) return MobilePaymentSubscriptionOwnership.NO_SUBSCRIPTION

		val customerId = customerIdBytes?.toObfuscatedAccountId()
		return if (customerId != null && purchases.any { purchase ->
				purchase.purchaseState == Purchase.PurchaseState.PURCHASED &&
						purchase.accountIdentifiers?.obfuscatedAccountId == customerId
			}) {
			MobilePaymentSubscriptionOwnership.OWNER
		} else {
			MobilePaymentSubscriptionOwnership.NOT_OWNER
		}
	}

	override suspend fun isExternalSubscriptionRenewalEnabled(): Boolean {
		val params = QueryPurchasesParams.newBuilder()
			.setProductType(BillingClient.ProductType.SUBS)
			.includeSuspendedSubscriptions(true)
			.build()

		return billingClient.queryPurchases(params).any { it.isAutoRenewing }
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
