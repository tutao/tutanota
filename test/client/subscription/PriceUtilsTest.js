// @flow
import o from "ospec"
import {formatMonthlyPrice, formatPrice, getSubscriptionPrice} from "../../../src/subscription/PriceUtils"
import stream from "mithril/stream/stream.js"
import {createPlanPrices} from "../../../src/api/entities/sys/PlanPrices"
import {SubscriptionType, UpgradePriceType} from "../../../src/subscription/SubscriptionUtils"
import {clone} from "@tutao/tutanota-utils"

const PLAN_PRICES = {
	PremiumBusiness: createPlanPrices({
		"additionalUserPriceMonthly": "2.40",
		"contactFormPriceMonthly": "24.00",
		"firstYearDiscount": "0",
		"includedAliases": "5",
		"includedStorage": "1",
		"monthlyPrice": "2.40",
		"monthlyReferencePrice": "2.40"
	}),
	Premium: createPlanPrices({
		"additionalUserPriceMonthly": "1.20",
		"contactFormPriceMonthly": "24.00",
		"firstYearDiscount": "0",
		"includedAliases": "5",
		"includedStorage": "1",
		"monthlyPrice": "1.20",
		"monthlyReferencePrice": "1.20"
	}),
	Pro: createPlanPrices({
		"additionalUserPriceMonthly": "4.80",
		"contactFormPriceMonthly": "24.00",
		"firstYearDiscount": "0",
		"includedAliases": "20",
		"includedStorage": "10",
		"monthlyPrice": "8.40",
		"monthlyReferencePrice": "8.40"
	}),
	TeamsBusiness: createPlanPrices({
		"additionalUserPriceMonthly": "3.60",
		"contactFormPriceMonthly": "24.00",
		"firstYearDiscount": "0",
		"includedAliases": "5",
		"includedStorage": "10",
		"monthlyPrice": "6.00",
		"monthlyReferencePrice": "6.00"
	}),
	Teams: createPlanPrices({
		"additionalUserPriceMonthly": "2.40",
		"contactFormPriceMonthly": "24.00",
		"firstYearDiscount": "0",
		"includedAliases": "5",
		"includedStorage": "10",
		"monthlyPrice": "4.80",
		"monthlyReferencePrice": "4.80"
	})
}

o.spec("price utils getSubscriptionPrice", () => {
	o("getSubscriptionPrice premium yearly price", () => {
		const data = {
			options: {
				businessUse: stream(false),
				paymentInterval: stream(12)
			},
			planPrices: PLAN_PRICES
		}
		// the return value is not rounded, but formatPrice handles that
		o(formatPrice(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanReferencePrice), false)).equals("14.40")
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)).equals(12)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(12)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.ContactFormPrice)).equals(240)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(12)
	})

	o("getSubscriptionPrice premium monthly price", () => {
		const data = {
			options: {
				businessUse: stream(false),
				paymentInterval: stream(1)
			},
			planPrices: PLAN_PRICES
		}
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanReferencePrice)).equals(1.20)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)).equals(1.20)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(1.20)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.ContactFormPrice)).equals(24)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(1.20)
	})

	o("getSubscriptionPrice Premium discount yearly", () => {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Premium.firstYearDiscount = "12"
		const data = {
			options: {
				businessUse: stream(false),
				paymentInterval: stream(12)
			},
			planPrices: discountPlanPrices
		}
		o(formatPrice(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanReferencePrice), false)).equals("14.40")
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)).equals(0)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(12)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.ContactFormPrice)).equals(240)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(12)
	})

	o("getSubscriptionPrice Pro discount yearly", () => {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Pro.firstYearDiscount = "84"
		const data = {
			options: {
				businessUse: stream(false),
				paymentInterval: stream(12)
			},
			planPrices: discountPlanPrices
		}
		o(formatPrice(getSubscriptionPrice(data, SubscriptionType.Pro, UpgradePriceType.PlanReferencePrice), false)).equals("100.80")
		o(getSubscriptionPrice(data, SubscriptionType.Pro, UpgradePriceType.PlanActualPrice)).equals(0)
		o(getSubscriptionPrice(data, SubscriptionType.Pro, UpgradePriceType.AdditionalUserPrice)).equals(48)
		o(getSubscriptionPrice(data, SubscriptionType.Pro, UpgradePriceType.ContactFormPrice)).equals(240)
		o(getSubscriptionPrice(data, SubscriptionType.Pro, UpgradePriceType.PlanNextYearsPrice)).equals(84)
	})

	o("getSubscriptionPrice Premium discount monthly", () => {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Premium.firstYearDiscount = "12"
		const data = {
			options: {
				businessUse: stream(false),
				paymentInterval: stream(1)
			},
			planPrices: discountPlanPrices
		}
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanReferencePrice)).equals(1.20)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)).equals(1.20)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(1.20)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.ContactFormPrice)).equals(24)
		o(getSubscriptionPrice(data, SubscriptionType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(1.20)
	})

	o("formatMonthlyPrices", () => {
		o(formatMonthlyPrice(0, 12)).equals("€0")
		o(formatMonthlyPrice(0, 1)).equals("€0")
		o(formatMonthlyPrice(12, 12)).equals("€1")
		o(formatMonthlyPrice(12, 1)).equals("€12")
		o(formatMonthlyPrice(1.20, 12)).equals("€0.10")
		o(formatMonthlyPrice(1.20, 1)).equals("€1.20")
	})
})