import o from "@tutao/otest"
import { asPaymentInterval, formatMonthlyPrice, formatPrice, PaymentInterval, PriceAndConfigProvider } from "../../../src/common/subscription/PriceUtils.js"
import { clone } from "@tutao/tutanota-utils"
import { UpgradePriceType } from "../../../src/common/subscription/FeatureListProvider"
import { lang } from "../../../src/common/misc/LanguageViewModel"
import en from "../../../src/mail-app/translations/en"
import { ProgrammingError } from "../../../src/common/api/common/error/ProgrammingError.js"
import { createUpgradePriceServiceMock, PLAN_PRICES } from "./priceTestUtils.js"
import { PlanType } from "../../../src/common/api/common/TutanotaConstants.js"
import { UserError } from "../../../src/common/api/main/UserError.js"

o.spec("PriceUtilsTest", function () {
	o.before(async function () {
		// We need this because SendMailModel queries for default language. We should refactor to avoid this.
		lang.init(en)
	})

	o("getSubscriptionPrice premium yearly price", async function () {
		// the return value is not rounded, but formatPrice handles that
		const provider = await initPriceAndConfigProvider()
		o(formatPrice(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Premium, UpgradePriceType.PlanReferencePrice), false)).equals("14.40")
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Premium, UpgradePriceType.PlanActualPrice)).equals(12)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(12)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(12)
	})
	o("getSubscriptionPrice premium monthly price", async function () {
		const provider = await initPriceAndConfigProvider()
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Premium, UpgradePriceType.PlanReferencePrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Premium, UpgradePriceType.PlanActualPrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(1.2)
	})
	o("getSubscriptionPrice Premium discount yearly", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Premium.firstYearDiscount = "12"
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices)
		const provider = await PriceAndConfigProvider.getInitializedInstance(null, priceServiceMock, null)
		o(formatPrice(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Premium, UpgradePriceType.PlanReferencePrice), false)).equals("14.40")
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Premium, UpgradePriceType.PlanActualPrice)).equals(0)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(12)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(12)
	})
	o("getSubscriptionPrice Pro discount yearly", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Pro.firstYearDiscount = "84"
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices)
		const provider = await PriceAndConfigProvider.getInitializedInstance(null, priceServiceMock, null)
		o(formatPrice(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Pro, UpgradePriceType.PlanReferencePrice), false)).equals("100.80")
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Pro, UpgradePriceType.PlanActualPrice)).equals(0)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Pro, UpgradePriceType.AdditionalUserPrice)).equals(48)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Pro, UpgradePriceType.PlanNextYearsPrice)).equals(84)
	})
	o("getSubscriptionPrice Premium discount monthly", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Premium.firstYearDiscount = "12"
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices)
		const provider = await PriceAndConfigProvider.getInitializedInstance(null, priceServiceMock, null)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Premium, UpgradePriceType.PlanReferencePrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Premium, UpgradePriceType.PlanActualPrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Premium, UpgradePriceType.AdditionalUserPrice)).equals(1.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Premium, UpgradePriceType.PlanNextYearsPrice)).equals(1.2)
	})

	o("getSubscriptionPrice Revolutionary discount monthly", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Premium.firstYearDiscount = "36"
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices)
		const provider = await PriceAndConfigProvider.getInitializedInstance(null, priceServiceMock, null)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Revolutionary, UpgradePriceType.PlanReferencePrice)).equals(3.6)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Revolutionary, UpgradePriceType.PlanActualPrice)).equals(3.6)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Revolutionary, UpgradePriceType.AdditionalUserPrice)).equals(3.6)
		o(provider.getSubscriptionPrice(PaymentInterval.Monthly, PlanType.Revolutionary, UpgradePriceType.PlanNextYearsPrice)).equals(3.6)
	})

	o("getSubscriptionPrice Revolutionary discount yearly", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		discountPlanPrices.Revolutionary.firstYearDiscount = "36"
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices)
		const provider = await PriceAndConfigProvider.getInitializedInstance(null, priceServiceMock, null)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Revolutionary, UpgradePriceType.PlanReferencePrice)).equals(43.2)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Revolutionary, UpgradePriceType.PlanActualPrice)).equals(0)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Revolutionary, UpgradePriceType.AdditionalUserPrice)).equals(36)
		o(provider.getSubscriptionPrice(PaymentInterval.Yearly, PlanType.Revolutionary, UpgradePriceType.PlanNextYearsPrice)).equals(36)
	})

	o("formatMonthlyPrices", function () {
		o(formatMonthlyPrice(0, 12)).equals("€0")
		o(formatMonthlyPrice(0, 1)).equals("€0")
		o(formatMonthlyPrice(12, 12)).equals("€1")
		o(formatMonthlyPrice(12, 1)).equals("€12")
		o(formatMonthlyPrice(1.2, 12)).equals("€0.10")
		o(formatMonthlyPrice(1.2, 1)).equals("€1.20")
	})

	o("getPriceInfoMessage - default", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices)
		const provider = await PriceAndConfigProvider.getInitializedInstance(null, priceServiceMock, null)
		o(provider.getPriceInfoMessage()).equals(null)
	})

	o("getPriceInfoMessage - bonus months", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices, null, 12)
		const provider = await PriceAndConfigProvider.getInitializedInstance(null, priceServiceMock, null)
		o(provider.getPriceInfoMessage()).equals("chooseYearlyForOffer_msg")
	})

	o("getPriceInfoMessage - referral code", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices, null, 1)
		const provider = await PriceAndConfigProvider.getInitializedInstance(null, priceServiceMock, "abc")
		o(provider.getPriceInfoMessage()).equals("referralSignup_msg")
	})
	o("getPriceInfoMessage - referral code invalid", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices, null, 0)
		const provider = await PriceAndConfigProvider.getInitializedInstance(null, priceServiceMock, "abc")
		o(provider.getPriceInfoMessage()).equals("referralSignupInvalid_msg")
	})

	o("getPriceInfoMessage - referral code and registration id not allowed", async function () {
		const discountPlanPrices = clone(PLAN_PRICES)
		const priceServiceMock = createUpgradePriceServiceMock(discountPlanPrices, null, 0)
		try {
			await PriceAndConfigProvider.getInitializedInstance("reg-data-id", priceServiceMock, "abc")
			throw new Error("exception expected")
		} catch (e) {
			o(e instanceof UserError).equals(true)
		}
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

async function initPriceAndConfigProvider(): Promise<PriceAndConfigProvider> {
	const serviceExecutor = createUpgradePriceServiceMock()
	return PriceAndConfigProvider.getInitializedInstance(null, serviceExecutor, null)
}
