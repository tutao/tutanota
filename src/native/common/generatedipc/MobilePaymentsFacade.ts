/* generated file, don't edit. */

import { MobilePaymentResult } from "./MobilePaymentResult.js"
/**
 * Operations for handling mobile payments.
 */
export interface MobilePaymentsFacade {
	/**
	 * Display a pop-up for the user to start a subscription
	 */
	requestSubscriptionToPlan(plan: string, interval: number): Promise<MobilePaymentResult>
}
