import { createAccountingInfo, createBooking, createBookingItem, createCustomer, createFeature } from "../../../src/api/entities/sys/TypeRefs.js"
import { AccountType, BookingItemFeatureType, FeatureType, PlanType } from "../../../src/api/common/TutanotaConstants.js"
import o from "@tutao/otest"
import { SwitchSubscriptionDialogModel } from "../../../src/subscription/SwitchSubscriptionDialogModel.js"
import { PaymentInterval } from "../../../src/subscription/PriceUtils.js"

o.spec("SwitchSubscriptionDialogModelTest", function () {
	const paidPlanType = PlanType.Premium
	const premiumCustomer = createCustomer({
		type: AccountType.PAID,
	})
	const yearlyIntervalAccountingInfo = createAccountingInfo({
		paymentInterval: "" + PaymentInterval.Yearly,
	})
	o("multipleUsersStillSupportedLegacy - MultipleUsers enabled", function () {
		const premiumCustomerWithMultipleUsers = createCustomer({
			customizations: [
				createFeature({
					feature: FeatureType.MultipleUsers,
				}),
			],
		})
		const booking = createBooking({
			items: [
				createBookingItem({
					featureType: BookingItemFeatureType.Revolutionary,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomerWithMultipleUsers, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer has multiple users booked", function () {
		const booking = createBooking({
			items: [
				createBookingItem({
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "2",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer has shared mailbox booked", function () {
		const booking = createBooking({
			items: [
				createBookingItem({
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "1",
				}),
				createBookingItem({
					featureType: BookingItemFeatureType.SharedMailGroup,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer has a local admin group booked", function () {
		const booking = createBooking({
			items: [
				createBookingItem({
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "1",
				}),
				createBookingItem({
					featureType: BookingItemFeatureType.LocalAdminGroup,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer only has one user and does not have multiple users enabled", function () {
		const booking = createBooking({
			items: [
				createBookingItem({
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(false)
	})
})
