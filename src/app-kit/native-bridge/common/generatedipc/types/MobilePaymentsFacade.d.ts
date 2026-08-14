/* generated file, don't edit. */

import { MobilePaymentResult } from "../types/MobilePaymentResult"
import { MobilePlanPrice } from "../types/MobilePlanPrice"
import { MobilePaymentSubscriptionOwnership } from "../types/MobilePaymentSubscriptionOwnership"
/**
 * Operations for handling mobile payments.
 */
export interface MobilePaymentsFacade {
	/**
	 * Display a pop-up for the user to start a subscription
	 */
	requestSubscriptionToPlan(plan: string, interval: number, customerIdBytes: Uint8Array<ArrayBuffer>): Promise<MobilePaymentResult>

	/**
	 * Returns displayable prices for all plans
	 */
	getPlanPrices(): Promise<ReadonlyArray<MobilePlanPrice>>

	/**
	 * Display a view for the user to configure their subscription.
	 */
	showSubscriptionConfigView(): Promise<void>

	/**
	 * Check if the latest transaction using the current Store Account belongs to the tuta customer
	 */
	queryExternalSubscriptionOwnership(customerIdBytes: Uint8Array<ArrayBuffer> | null): Promise<MobilePaymentSubscriptionOwnership>

	/**
	 * Check if there's a subscription with google or apple and if it has auto-renew enabled
	 */
	isExternalSubscriptionRenewalEnabled(): Promise<boolean>
}
