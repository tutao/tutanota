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
	 * Returns a displayable price for a plan
	 */
	func getPlanPrice(
		_ plan: String,
		_ interval: Int
	) async throws -> MobilePlanPrice?
	/**
	 * Display a view for the user to configure their subscription.
	 */
	func showSubscriptionConfigView(
	) async throws -> Void
	/**
	 * Check if the latest transaction using the current Store Account belongs to the user
	 */
	func checkLastTransactionOwner(
		_ customerIdBytes: DataWrapper
	) async throws -> Bool
}
