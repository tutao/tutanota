import { FeatureType } from "@tutao/app-env"
import { asPaymentInterval, PaymentInterval } from "./utils/PriceUtils"
import { isCustomizationEnabledForCustomer } from "../api/common/utils/CustomerUtils.js"
import { sysTypeRefs } from "@tutao/typerefs"
import { BookingItemFeatureType, LegacyPlans, PlanType } from "@tutao/app-env"

export type CurrentPlanInfo = {
	businessUse: boolean
	planType: PlanType
	paymentInterval: PaymentInterval
}

export class SwitchSubscriptionDialogModel {
	currentPlanInfo: CurrentPlanInfo

	constructor(
		private readonly customer: sysTypeRefs.Customer,
		private readonly accountingInfo: sysTypeRefs.AccountingInfo,
		private readonly planType: PlanType,
		private readonly lastBooking: sysTypeRefs.Booking,
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

			// A user that has PlanType.Premium will always have LegacyUsers booked.
			const userCount = Number(userItem?.currentCount)

			// These may be booked but not always.
			const sharedMailCount = sharedMailItem ? Number(sharedMailItem.currentCount) : 0

			return userCount + sharedMailCount > 1
		}

		return false
	}
}
