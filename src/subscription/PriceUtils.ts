import { BookingItemFeatureType, Const, PaymentMethodType, PlanType } from "../api/common/TutanotaConstants"
import { assertTranslation, lang, TranslationKey } from "../misc/LanguageViewModel"
import { assertNotNull, downcast, neverNull } from "@tutao/tutanota-utils"
import type { AccountingInfo, PlanPrices, PriceData, PriceItemData } from "../api/entities/sys/TypeRefs.js"
import { createUpgradePriceServiceData, PlanPricesTypeRef, UpgradePriceServiceReturn } from "../api/entities/sys/TypeRefs.js"
import { SubscriptionPlanPrices, UpgradePriceType, WebsitePlanPrices } from "./FeatureListProvider"
import { locator } from "../api/main/MainLocator"
import { UpgradePriceService } from "../api/entities/sys/Services"
import { IServiceExecutor } from "../api/common/ServiceRequest"
import { ProgrammingError } from "../api/common/error/ProgrammingError.js"
import { UserError } from "../api/main/UserError.js"

export const enum PaymentInterval {
	Monthly = 1,
	Yearly = 12,
}

export function asPaymentInterval(paymentInterval: string | number): PaymentInterval {
	if (typeof paymentInterval === "string") {
		paymentInterval = Number(paymentInterval)
	}
	switch (paymentInterval) {
		// additional cast to make this robust against changes to the PaymentInterval enum.
		case Number(PaymentInterval.Monthly):
			return PaymentInterval.Monthly
		case Number(PaymentInterval.Yearly):
			return PaymentInterval.Yearly
		default:
			throw new ProgrammingError(`invalid payment interval: ${paymentInterval}`)
	}
}

export function getPaymentMethodName(paymentMethod: PaymentMethodType): string {
	if (paymentMethod === PaymentMethodType.Invoice) {
		return lang.get("paymentMethodOnAccount_label")
	} else if (paymentMethod === PaymentMethodType.CreditCard) {
		return lang.get("paymentMethodCreditCard_label")
	} else if (paymentMethod === PaymentMethodType.Sepa) {
		return "SEPA"
	} else if (paymentMethod === PaymentMethodType.Paypal) {
		return "PayPal"
	} else if (paymentMethod === PaymentMethodType.AccountBalance) {
		return lang.get("paymentMethodAccountBalance_label")
	} else {
		return "<" + lang.get("comboBoxSelectionNone_msg") + ">"
	}
}

export function getPaymentMethodInfoText(accountingInfo: AccountingInfo): string {
	if (accountingInfo.paymentMethodInfo) {
		return accountingInfo.paymentMethod === PaymentMethodType.CreditCard
			? lang.get("endsWith_label") + " " + neverNull(accountingInfo.paymentMethodInfo)
			: neverNull(accountingInfo.paymentMethodInfo)
	} else {
		return ""
	}
}

export function formatPriceDataWithInfo(priceData: PriceData): string {
	return formatPriceWithInfo(Number(priceData.price), asPaymentInterval(priceData.paymentInterval), priceData.taxIncluded)
}

// Used on website, keep it in sync
export function formatPrice(value: number, includeCurrency: boolean): string {
	// round to two digits first because small deviations may exist at far away decimal places
	value = Math.round(value * 100) / 100

	if (includeCurrency) {
		return value % 1 !== 0 ? lang.formats.priceWithCurrency.format(value) : lang.formats.priceWithCurrencyWithoutFractionDigits.format(value)
	} else {
		return value % 1 !== 0 ? lang.formats.priceWithoutCurrency.format(value) : lang.formats.priceWithoutCurrencyWithoutFractionDigits.format(value)
	}
}

/**
 * Formats the monthly price of the subscription (even for yearly subscriptions).
 */
export function formatMonthlyPrice(subscriptionPrice: number, paymentInterval: PaymentInterval): string {
	const monthlyPrice = paymentInterval === PaymentInterval.Yearly ? subscriptionPrice / Number(PaymentInterval.Yearly) : subscriptionPrice
	return formatPrice(monthlyPrice, true)
}

export function formatPriceWithInfo(price: number, paymentInterval: PaymentInterval, taxIncluded: boolean): string {
	const netOrGross = taxIncluded ? lang.get("gross_label") : lang.get("net_label")
	const yearlyOrMonthly = paymentInterval === PaymentInterval.Yearly ? lang.get("pricing.perYear_label") : lang.get("pricing.perMonth_label")
	const formattedPrice = formatPrice(price, true)
	return `${formattedPrice} ${yearlyOrMonthly} (${netOrGross})`
}

/**
 * Provides the price item from the given priceData for the given featureType. Returns null if no such item is available.
 */
export function getPriceItem(priceData: PriceData | null, featureType: NumberString): PriceItemData | null {
	return priceData?.items.find((item) => item.featureType === featureType) ?? null
}

export function getCountFromPriceData(priceData: PriceData | null, featureType: BookingItemFeatureType): number {
	const priceItem = getPriceItem(priceData, featureType)
	return priceItem ? Number(priceItem.count) : 0
}

/**
 * Returns the price for the feature type from the price data if available. otherwise 0.
 * @return The price
 */
export function getPriceFromPriceData(priceData: PriceData | null, featureType: NumberString): number {
	let item = getPriceItem(priceData, featureType)

	if (item) {
		return Number(item.price)
	} else {
		return 0
	}
}

export class PriceAndConfigProvider {
	private upgradePriceData: UpgradePriceServiceReturn | null = null
	private planPrices: SubscriptionPlanPrices | null = null
	private isReferralCodeSignup: boolean = false

	private constructor() {}

	private async init(registrationDataId: string | null, serviceExecutor: IServiceExecutor, referralCode: string | null): Promise<void> {
		const data = createUpgradePriceServiceData({
			date: Const.CURRENT_DATE,
			campaign: registrationDataId,
			referralCode: referralCode,
		})
		this.upgradePriceData = await serviceExecutor.get(UpgradePriceService, data)
		this.isReferralCodeSignup = referralCode != null
		this.planPrices = {
			[PlanType.Free]: this.upgradePriceData.freePrices,
			[PlanType.Premium]: this.upgradePriceData.premiumPrices,
			[PlanType.PremiumBusiness]: this.upgradePriceData.premiumBusinessPrices,
			[PlanType.Teams]: this.upgradePriceData.teamsPrices,
			[PlanType.TeamsBusiness]: this.upgradePriceData.teamsBusinessPrices,
			[PlanType.Pro]: this.upgradePriceData.proPrices,
			[PlanType.Revolutionary]: this.upgradePriceData.revolutionaryPrices,
			[PlanType.Legend]: this.upgradePriceData.legendaryPrices,
			[PlanType.Essential]: this.upgradePriceData.essentialPrices,
			[PlanType.Advanced]: this.upgradePriceData.advancedPrices,
			[PlanType.Unlimited]: this.upgradePriceData.unlimitedPrices,
		}
	}

	static async getInitializedInstance(
		registrationDataId: string | null,
		serviceExecutor: IServiceExecutor = locator.serviceExecutor,
		referralCode: string | null,
	): Promise<PriceAndConfigProvider> {
		// There should be only one method to request a discount either referralCode or a promotion
		if (referralCode != null && registrationDataId != null) {
			throw new UserError("referralSignupCampaignError_msg")
		}

		const priceDataProvider = new PriceAndConfigProvider()
		await priceDataProvider.init(registrationDataId, serviceExecutor, referralCode)
		return priceDataProvider
	}

	getSubscriptionPrice(paymentInterval: PaymentInterval, subscription: PlanType, type: UpgradePriceType): number {
		return paymentInterval === PaymentInterval.Yearly
			? this.getYearlySubscriptionPrice(subscription, type)
			: this.getMonthlySubscriptionPrice(subscription, type)
	}

	getRawPricingData(): UpgradePriceServiceReturn {
		return assertNotNull(this.upgradePriceData)
	}

	private getYearlySubscriptionPrice(subscription: PlanType, upgrade: UpgradePriceType): number {
		const prices = this.getPlanPrices(subscription)
		const monthlyPrice = getPriceForUpgradeType(upgrade, prices)
		const monthsFactor = upgrade === UpgradePriceType.PlanReferencePrice ? Number(PaymentInterval.Yearly) : 10
		const discount = upgrade === UpgradePriceType.PlanActualPrice ? Number(prices.firstYearDiscount) : 0
		return monthlyPrice * monthsFactor - discount
	}

	private getMonthlySubscriptionPrice(subscription: PlanType, upgrade: UpgradePriceType): number {
		const prices = this.getPlanPrices(subscription)
		return getPriceForUpgradeType(upgrade, prices)
	}

	getPlanPrices(subscription: PlanType): PlanPrices {
		return assertNotNull(this.planPrices)[subscription]
	}

	getPriceInfoMessage(): TranslationKey | null {
		const rawData = this.getRawPricingData()
		const bonusMonthMessage = getReasonForBonusMonths(Number(rawData.bonusMonthsForYearlyPlan), this.isReferralCodeSignup)
		if (bonusMonthMessage) {
			return bonusMonthMessage
		} else if (rawData.messageTextId) {
			// text id that is specified by a promotion.
			return assertTranslation(rawData.messageTextId)
		} else {
			return null
		}
	}
}

function getPriceForUpgradeType(upgrade: UpgradePriceType, prices: WebsitePlanPrices): number {
	switch (upgrade) {
		case UpgradePriceType.PlanReferencePrice:
			return Number(prices.monthlyReferencePrice)
		case UpgradePriceType.PlanActualPrice:
		case UpgradePriceType.PlanNextYearsPrice:
			return Number(prices.monthlyPrice)
		case UpgradePriceType.AdditionalUserPrice:
			return Number(prices.additionalUserPriceMonthly)
		case UpgradePriceType.ContactFormPrice:
			return Number(prices.contactFormPriceMonthly)
	}
}

function descendingSubscriptionOrder(): Array<PlanType> {
	return [PlanType.Unlimited, PlanType.Advanced, PlanType.Legend, PlanType.Essential, PlanType.Revolutionary]
}

/**
 * Returns true if the targetSubscription plan is considered to be a lower (~ cheaper) subscription plan
 * Is based on the order of business and non-business subscriptions as defined in descendingSubscriptionOrder
 */
export function isSubscriptionDowngrade(targetSubscription: PlanType, currentSubscription: PlanType): boolean {
	const order = descendingSubscriptionOrder()
	if (Object.values(PlanType).includes(downcast(currentSubscription))) {
		return order.indexOf(targetSubscription) > order.indexOf(downcast(currentSubscription))
	} else {
		return false
	}
}

/**
 * Helper function to determine the reason for bonus months that have be provided by the UpgradePriceService
 * @param bonusMonths The amount of bonus month
 * @param isReferralCodeSignup Indication if a referral code has been used to query the bonus months.
 */
function getReasonForBonusMonths(bonusMonths: Number, isReferralCodeSignup: boolean): TranslationKey | null {
	if (bonusMonths == 12) {
		return "chooseYearlyForOffer_msg"
	} else if (bonusMonths == 1) {
		return "referralSignup_msg"
	} else if (bonusMonths == 0 && isReferralCodeSignup) {
		return "referralSignupInvalid_msg"
	} else {
		return null
	}
}
