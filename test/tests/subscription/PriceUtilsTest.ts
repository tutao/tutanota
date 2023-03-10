import o from "ospec"
import { asPaymentInterval, formatMonthlyPrice, formatPrice, PaymentInterval, PriceAndConfigProvider } from "../../../src/subscription/PriceUtils.js"
import { clone } from "@tutao/tutanota-utils"
import { SubscriptionType, UpgradePriceType } from "../../../src/subscription/FeatureListProvider"
import { lang } from "../../../src/misc/LanguageViewModel"
import en from "../../../src/translations/en"
import { ProgrammingError } from "../../../src/api/common/error/ProgrammingError.js"
import { createPriceMock, PLAN_PRICES } from "./priceTestUtils.js"

o.spec("price utils getSubscriptionPrice", function () {
	let provider: PriceAndConfigProvider
	o.before(async function () {
		// We need this because SendMailModel queries for default language. We should refactor to avoid this.
		lang.init(en)
		provider = await createPriceMock(PLAN_PRICES)
	})

	o("getSubscriptionPrice premium yearly price", function () {
		// the return value is not rounded, but formatPrice handles that
		o(formatPrice(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.PlanReferencePrice), false)).equals(
			"14.40",
		)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)).equals(12)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(12)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.ContactFormPrice)).equals(240)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(12)
	})
	o("getSubscriptionPrice premium monthly price", function () {
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.PlanReferencePrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.ContactFormPrice)).equals(24)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(1.2)
	})
	o("getSubscriptionPrice Premium discount yearly", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Premium.firstYearDiscount = "12"
		const provider = await createPriceMock(discountPlanPrices)
		o(formatPrice(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.PlanReferencePrice), false)).equals(
			"14.40",
		)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)).equals(0)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(12)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.ContactFormPrice)).equals(240)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(12)
	})
	o("getSubscriptionPrice Pro discount yearly", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Pro.firstYearDiscount = "84"
		const provider = await createPriceMock(discountPlanPrices)
		o(formatPrice(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Pro, UpgradePriceType.PlanReferencePrice), false)).equals("100.80")
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Pro, UpgradePriceType.PlanActualPrice)).equals(0)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Pro, UpgradePriceType.AdditionalUserPrice)).equals(48)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Pro, UpgradePriceType.ContactFormPrice)).equals(240)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, SubscriptionType.Pro, UpgradePriceType.PlanNextYearsPrice)).equals(84)
	})
	o("getSubscriptionPrice Premium discount monthly", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Premium.firstYearDiscount = "12"
		const provider = await createPriceMock(discountPlanPrices)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.PlanReferencePrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.PlanActualPrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.ContactFormPrice)).equals(24)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, SubscriptionType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(1.2)
	})
	o("formatMonthlyPrices", function () {
		o(formatMonthlyPrice(0, 12)).equals("€0")
		o(formatMonthlyPrice(0, 1)).equals("€0")
		o(formatMonthlyPrice(12, 12)).equals("€1")
		o(formatMonthlyPrice(12, 1)).equals("€12")
		o(formatMonthlyPrice(1.2, 12)).equals("€0.10")
		o(formatMonthlyPrice(1.2, 1)).equals("€1.20")
	})
})

o.spec("PaymentInterval", function () {
	o("asPaymentInterval correct values", function () {
		o(asPaymentInterval(1)).equals(PaymentInterval.Monthly)
		o(asPaymentInterval(12)).equals(PaymentInterval.Yearly)
		o(asPaymentInterval("1")).equals(PaymentInterval.Monthly)
		o(asPaymentInterval("12")).equals(PaymentInterval.Yearly)
	})

	o("asPaymentInterval rejects invalid values", function () {
		o(() => asPaymentInterval(0)).throws(ProgrammingError)
		o(() => asPaymentInterval("0")).throws(ProgrammingError)
		o(() => asPaymentInterval("")).throws(ProgrammingError)
		o(() => asPaymentInterval(null as any)).throws(ProgrammingError)
		o(() => asPaymentInterval(undefined as any)).throws(ProgrammingError)
	})
})
