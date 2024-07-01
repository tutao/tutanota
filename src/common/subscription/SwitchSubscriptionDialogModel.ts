import { BookingItemFeatureType, FeatureType, LegacyPlans, PlanType } from "../api/common/TutanotaConstants"
import type { AccountingInfo, Booking, Customer } from "../api/entities/sys/TypeRefs.js"
import { asPaymentInterval, PaymentInterval } from "./PriceUtils"
import { isCustomizationEnabledForCustomer } from "../api/common/utils/CustomerUtils.js"

export type CurrentPlanInfo = {
	businessUse: boolean
	planType: PlanType
	paymentInterval: PaymentInterval
}

export class SwitchSubscriptionDialogModel {
	currentPlanInfo: CurrentPlanInfo

	constructor(
		private readonly customer: Customer,
		private readonly accountingInfo: AccountingInfo,
		private readonly planType: PlanType,
		private readonly lastBooking: Booking,
	) {
		this.currentPlanInfo = this._initCurrentPlanInfo()
	}

	_initCurrentPlanInfo(): CurrentPlanInfo {
		const paymentInterval: PaymentInterval = asPaymentInterval(this.accountingInfo.paymentInterval)
		return {
			businessUse: this.customer.businessUse,
			planType: this.planType,
			paymentInterval,
		}
	}

	/**
	 * Check if the user's current plan has multiple users due to a legacy agreement and will continue to do so if the user switches plans.
	 *
	 * @return true if multiple users are supported due to legacy, false if not; note that returning false does not mean that the current plan does not actually support multiple users
	 */
	multipleUsersStillSupportedLegacy(): boolean {
		if (isCustomizationEnabledForCustomer(this.customer, FeatureType.MultipleUsers)) {
			return true
		}

		if (LegacyPlans.includes(this.planType)) {
			const userItem = this.lastBooking.items.find((item) => item.featureType === BookingItemFeatureType.LegacyUsers)
			const sharedMailItem = this.lastBooking.items.find((item) => item.featureType === BookingItemFeatureType.SharedMailGroup)
			const localAdminItem = this.lastBooking.items.find((item) => item.featureType === BookingItemFeatureType.LocalAdminGroup)

			// A user that has PlanType.Premium will always have LegacyUsers booked.
			const userCount = Number(userItem?.currentCount)

			// These may be booked but not always.
			const sharedMailCount = sharedMailItem ? Number(sharedMailItem.currentCount) : 0
			const localAdminCount = localAdminItem ? Number(localAdminItem.currentCount) : 0

			return userCount + sharedMailCount + localAdminCount > 1
		}

		return false
	}
}
