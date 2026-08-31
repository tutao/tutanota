/* generated file, don't edit. */


package de.tutao.tutashared.ipc

import kotlinx.serialization.*
import kotlinx.serialization.json.*

/**
 * Operations for handling mobile payments.
 */
interface MobilePaymentsFacade {
	/**
	 * Display a pop-up for the user to start a subscription
	 */
	suspend fun requestSubscriptionToPlan(
		plan: String,
		interval: Long,
		customerIdBytes: DataWrapper,
		currentInterval: Long?,
	): MobilePaymentResult
	/**
	 * Returns displayable prices for all plans
	 */
	suspend fun getPlanPrices(
	): List<MobilePlanPrice>
	/**
	 * Display a view for the user to configure their subscription.
	 */
	suspend fun showSubscriptionConfigView(
	): Unit
	/**
	 * Check if the latest transaction using the current Store Account belongs to the tuta customer
	 */
	suspend fun queryExternalSubscriptionOwnership(
		customerIdBytes: DataWrapper?,
	): MobilePaymentSubscriptionOwnership
	/**
	 * Check if there's a subscription with google or apple and if it has auto-renew enabled
	 */
	suspend fun isExternalSubscriptionRenewalEnabled(
	): Boolean
}
