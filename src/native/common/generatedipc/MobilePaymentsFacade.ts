/* generated file, don't edit. */

import { MobilePaymentResult } from "./MobilePaymentResult.js"
import { MobilePlanPrice } from "./MobilePlanPrice.js"
/**
 * Operations for handling mobile payments.
 */
export interface MobilePaymentsFacade {
	/**
	 * Display a pop-up for the user to start a subscription
	 */
	requestSubscriptionToPlan(plan: string, interval: number, customerIdBytes: Uint8Array): Promise<MobilePaymentResult>

	/**
	 * Returns a displayable price for a plan
	 */
	getPlanPrice(plan: string, interval: number): Promise<MobilePlanPrice | null>

	/**
	 * Display a view for the user to configure their subscription.
	 */
	showSubscriptionConfigView(): Promise<void>

	/**
	 * Check if the latest transaction using the current Store Account belongs to the user
	 */
	checkLastTransactionOwner(customerIdBytes: Uint8Array): Promise<boolean>
}
