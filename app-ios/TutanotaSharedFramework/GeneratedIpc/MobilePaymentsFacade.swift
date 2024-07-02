/* generated file, don't edit. */


import Foundation

/**
 * Operations for handling mobile payments.
 */
public protocol MobilePaymentsFacade {
	/**
	 * Display a pop-up for the user to start a subscription
	 */
	func requestSubscriptionToPlan(
		_ plan: String,
		_ interval: Int,
		_ customerIdBytes: DataWrapper
	) async throws -> MobilePaymentResult
	/**
	 * Returns displayable prices for all plans
	 */
	func getPlanPrices(
	) async throws -> [MobilePlanPrice]
	/**
	 * Display a view for the user to configure their subscription.
	 */
	func showSubscriptionConfigView(
	) async throws -> Void
	/**
	 * Check if the latest transaction using the current Store Account belongs to the user
	 */
	func queryAppStoreSubscriptionOwnership(
		_ customerIdBytes: DataWrapper?
	) async throws -> MobilePaymentSubscriptionOwnership
	/**
	 * Check if there's a subscription and if it has auto-renew enabled
	 */
	func isAppStoreRenewalEnabled(
	) async throws -> Bool
}
