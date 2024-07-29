import { AccountingInfoTypeRef, BookingItemTypeRef, BookingTypeRef, CustomerTypeRef, FeatureTypeRef } from "../../../src/common/api/entities/sys/TypeRefs.js"
import { AccountType, BookingItemFeatureType, FeatureType, PlanType } from "../../../src/common/api/common/TutanotaConstants.js"
import o from "@tutao/otest"
import { SwitchSubscriptionDialogModel } from "../../../src/common/subscription/SwitchSubscriptionDialogModel.js"
import { PaymentInterval } from "../../../src/common/subscription/PriceUtils.js"
import { createTestEntity } from "../TestUtils.js"

o.spec("SwitchSubscriptionDialogModelTest", function () {
	const paidPlanType = PlanType.Premium
	const premiumCustomer = createTestEntity(CustomerTypeRef, {
		type: AccountType.PAID,
	})
	const yearlyIntervalAccountingInfo = createTestEntity(AccountingInfoTypeRef, {
		paymentInterval: "" + PaymentInterval.Yearly,
	})
	o("multipleUsersStillSupportedLegacy - MultipleUsers enabled", function () {
		const premiumCustomerWithMultipleUsers = createTestEntity(CustomerTypeRef, {
			customizations: [
				createTestEntity(FeatureTypeRef, {
					feature: FeatureType.MultipleUsers,
				}),
			],
		})
		const booking = createTestEntity(BookingTypeRef, {
			items: [
				createTestEntity(BookingItemTypeRef, {
					featureType: BookingItemFeatureType.Revolutionary,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomerWithMultipleUsers, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer has multiple users booked", function () {
		const booking = createTestEntity(BookingTypeRef, {
			items: [
				createTestEntity(BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "2",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer has shared mailbox booked", function () {
		const booking = createTestEntity(BookingTypeRef, {
			items: [
				createTestEntity(BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "1",
				}),
				createTestEntity(BookingItemTypeRef, {
					featureType: BookingItemFeatureType.SharedMailGroup,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer has a local admin group booked", function () {
		const booking = createTestEntity(BookingTypeRef, {
			items: [
				createTestEntity(BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "1",
				}),
				createTestEntity(BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LocalAdminGroup,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer only has one user and does not have multiple users enabled", function () {
		const booking = createTestEntity(BookingTypeRef, {
			items: [
				createTestEntity(BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(false)
	})
})
