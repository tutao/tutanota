import { FeatureType } from "@tutao/appEnv"
import o from "@tutao/otest"
import { SwitchSubscriptionDialogModel } from "../../../src/common/subscription/SwitchSubscriptionDialogModel.js"
import { PaymentInterval } from "../../../src/common/subscription/utils/PriceUtils.js"
import { createTestEntity } from "../TestUtils.js"
import { sysTypeRefs } from "@tutao/typeRefs"
import { AccountType, BookingItemFeatureType, PlanType } from "@tutao/appEnv"

o.spec("SwitchSubscriptionDialogModelTest", function () {
	const paidPlanType = PlanType.Premium
	const premiumCustomer = createTestEntity(sysTypeRefs.CustomerTypeRef, {
		type: AccountType.PAID,
	})
	const yearlyIntervalAccountingInfo = createTestEntity(sysTypeRefs.AccountingInfoTypeRef, {
		paymentInterval: "" + PaymentInterval.Yearly,
	})
	o("multipleUsersStillSupportedLegacy - MultipleUsers enabled", function () {
		const premiumCustomerWithMultipleUsers = createTestEntity(sysTypeRefs.CustomerTypeRef, {
			customizations: [
				createTestEntity(sysTypeRefs.FeatureTypeRef, {
					feature: FeatureType.MultipleUsers,
				}),
			],
		})
		const booking = createTestEntity(sysTypeRefs.BookingTypeRef, {
			items: [
				createTestEntity(sysTypeRefs.BookingItemTypeRef, {
					featureType: BookingItemFeatureType.Revolutionary,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomerWithMultipleUsers, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer has multiple users booked", function () {
		const booking = createTestEntity(sysTypeRefs.BookingTypeRef, {
			items: [
				createTestEntity(sysTypeRefs.BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "2",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer has shared mailbox booked", function () {
		const booking = createTestEntity(sysTypeRefs.BookingTypeRef, {
			items: [
				createTestEntity(sysTypeRefs.BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "1",
				}),
				createTestEntity(sysTypeRefs.BookingItemTypeRef, {
					featureType: BookingItemFeatureType.SharedMailGroup,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer has a local admin group booked", function () {
		const booking = createTestEntity(sysTypeRefs.BookingTypeRef, {
			items: [
				createTestEntity(sysTypeRefs.BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "1",
				}),
				createTestEntity(sysTypeRefs.BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LocalAdminGroup,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(true)
	})
	o("multipleUsersStillSupportedLegacy - customer only has one user and does not have multiple users enabled", function () {
		const booking = createTestEntity(sysTypeRefs.BookingTypeRef, {
			items: [
				createTestEntity(sysTypeRefs.BookingItemTypeRef, {
					featureType: BookingItemFeatureType.LegacyUsers,
					currentCount: "1",
				}),
			],
		})
		const model = new SwitchSubscriptionDialogModel(premiumCustomer, yearlyIntervalAccountingInfo, paidPlanType, booking)
		o(model.multipleUsersStillSupportedLegacy()).equals(false)
	})
})
