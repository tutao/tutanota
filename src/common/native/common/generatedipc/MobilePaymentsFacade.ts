/* generated file, don't edit. */

import { MobilePaymentResult } from "./MobilePaymentResult.js"
import { MobilePlanPrice } from "./MobilePlanPrice.js"
import { MobilePaymentSubscriptionOwnership } from "./MobilePaymentSubscriptionOwnership.js"
/**
 * Operations for handling mobile payments.
 */
export interface MobilePaymentsFacade {
	/**
	 * Display a pop-up for the user to start a subscription
	 */
	requestSubscriptionToPlan(plan: string, interval: number, customerIdBytes: Uint8Array): Promise<MobilePaymentResult>

	/**
	 * Returns displayable prices for all plans
	 */
	getPlanPrices(): Promise<ReadonlyArray<MobilePlanPrice>>

	/**
	 * Display a view for the user to configure their subscription.
	 */
	showSubscriptionConfigView(): Promise<void>

	/**
	 * Check if the latest transaction using the current Store Account belongs to the user
	 */
	queryAppStoreSubscriptionOwnership(customerIdBytes: Uint8Array | null): Promise<MobilePaymentSubscriptionOwnership>

	/**
	 * Check if there's a subscription and if it has auto-renew enabled
	 */
	isAppStoreRenewalEnabled(): Promise<boolean>
}
