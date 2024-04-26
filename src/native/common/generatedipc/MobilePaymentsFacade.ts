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
	 * Returns a displayable price for the current plan
	 */
	getCurrentPlanPrice(customerIdBytes: Uint8Array): Promise<string | null>
}
