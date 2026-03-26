package de.tutao.tutashared

import android.app.Activity
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.QueryProductDetailsParams
import de.tutao.tutashared.ipc.DataWrapper
import de.tutao.tutashared.ipc.MobilePaymentResult
import de.tutao.tutashared.ipc.MobilePaymentSubscriptionOwnership
import de.tutao.tutashared.ipc.MobilePaymentsFacade
import de.tutao.tutashared.ipc.MobilePlanPrice

class AndroidMobilePaymentsFacade(activity: Activity, val app: AppType) : MobilePaymentsFacade {
	val billingClient: TutaoBillingClient = TutaoBillingClient(activity)

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
		TODO("Not yet implemented")
	}

	override suspend fun queryExternalSubscriptionOwnership(customerIdBytes: DataWrapper?): MobilePaymentSubscriptionOwnership {
		TODO("Not yet implemented")
	}

	override suspend fun isExternalSubscriptionRenewalEnabled(): Boolean {
		TODO("Not yet implemented")
	}

	fun hasPlaystorePayment(): Boolean {
		return true
	}

	private fun getPlanPrefix(): String {
		val stage = if ("test" in BuildConfig.PACKAGE_NAME) {
			"test"
		} else if ("debug" in BuildConfig.PACKAGE_NAME) {
			"test"
		} else {
			""
		}

		return when (app) {
			AppType.MAIL -> "${stage}plans"
			AppType.CALENDAR, AppType.DRIVE -> "${stage}plans.${app.name.lowercase()}"
		}
	}
}