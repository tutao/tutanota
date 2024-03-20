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
}
