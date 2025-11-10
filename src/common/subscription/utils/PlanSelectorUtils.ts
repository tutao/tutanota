import { PlanConfig } from "../components/BusinessPlanContainer"
import { AvailablePlans, AvailablePlanType, NewPersonalPaidPlans, NewPersonalPlans, PlanType } from "../../api/common/TutanotaConstants"
import { PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import Stream from "mithril/stream"
import { SelectedSubscriptionOptions } from "../FeatureListProvider"
import { px, size } from "../../gui/size"
import { styles } from "../../gui/styles"
import { lang, Translation } from "../../misc/LanguageViewModel"
import { isDarkTheme, Theme, theme } from "../../gui/theme"
import { getRawApplePrice, hasAppleIntroOffer } from "./SubscriptionUtils"

export type DiscountDetail = {
	ribbonTranslation: Translation
	discountType: "BonusMonths" | "IndividualFirstYear" | "Permanent" | "GlobalFirstYear"
}

export type DiscountDetails = Partial<Record<PlanType, DiscountDetail>>

export type PlanBoxContainerAttrs = {
	allowSwitchingPaymentInterval: boolean
	availablePlans: readonly PlanType[]
	currentPaymentInterval: PaymentInterval | undefined
	currentPlan: PlanType | undefined
	isApplePrice: boolean
	priceAndConfigProvider: PriceAndConfigProvider
	selectedPlan: Stream<PlanType>
	selectedSubscriptionOptions: SelectedSubscriptionOptions
	showMultiUser: boolean
	discountDetails?: DiscountDetails
}

export type PlanBoxPosition = "left" | "right" | "bottom"

export function isPersonalPlanAvailable(availablePlans: readonly AvailablePlanType[]) {
	return availablePlans.some((plan) => NewPersonalPlans.includes(plan))
}

export function filterPlanConfigsAndGetSelectedPlan(
	planConfigs: PlanConfig[],
	availablePlans: readonly PlanType[],
	selectedPlan: PlanType,
	currentPlan: PlanType | undefined,
): {
	planConfigs: PlanConfig[]
	selectedPlan: PlanType
} {
	planConfigs = planConfigs.map((planConfig) => {
		if (!availablePlans.includes(planConfig.type)) {
			planConfig.isDisabled = true
		}
		return planConfig
	})

	// planConfigs is filtered by availablePlan (i.e. only includes plans that are actually available)
	// If the selectedPlan is not part of the current view
	// (e.g. because we switched between private and business plans)
	// then we need to change the selectedPlan to one that can be shown.
	const availablePlansForCurrentView = planConfigs
		.filter((planConfig) => !planConfig.isDisabled && planConfig.type !== currentPlan)
		.map((config) => config.type)
	if (!availablePlansForCurrentView.includes(selectedPlan)) {
		selectedPlan = planConfigs.filter((planConfig) => planConfig.type !== currentPlan && !planConfig.isDisabled)[0].type

		const isPrivate = availablePlansForCurrentView.includes(PlanType.Free)
		const defaultPlanForCurrentView = isPrivate ? PlanType.Revolutionary : PlanType.Advanced
		if (availablePlansForCurrentView.includes(defaultPlanForCurrentView)) {
			selectedPlan = defaultPlanForCurrentView
		}
	}

	return { planConfigs, selectedPlan }
}

export function getBorderWidth(isSelected: boolean, position: PlanBoxPosition) {
	if (isSelected) {
		if (!styles.isMobileLayout()) return px(2)

		if (position === "left") {
			return `${px(2)} ${px(2)} ${px(2)} 0`
		} else if (position === "right") {
			return `${px(2)} 0 ${px(2)} ${px(2)}`
		} else {
			return `${px(2)} 0 ${px(2)} 0`
		}
	}

	if (styles.isMobileLayout() && position === "bottom") {
		return `${px(1)} 0 ${px(2)} 0`
	} else if (styles.isMobileLayout() && position !== "bottom") {
		return position === "left" ? `${px(2)} ${px(1)} ${px(1)} 0` : `${px(2)} 0 ${px(1)} ${px(1)}`
	} else if (position === "bottom") {
		return `${px(1)} ${px(2)} ${px(2)} ${px(2)}`
	} else {
		return position === "left" ? `${px(2)} ${px(1)} ${px(1)} ${px(2)}` : `${px(2)} ${px(2)} ${px(1)} ${px(1)}`
	}
}

export function getBorderColor(isSelected: boolean, hasCampaign: boolean, localTheme: Theme) {
	if (isSelected) {
		return `${hasCampaign ? "transparent" : localTheme.primary} ${localTheme.primary} ${localTheme.primary} ${localTheme.primary}`
	} else {
		return `${hasCampaign ? "transparent" : localTheme.outline_variant} ${localTheme.outline_variant} ${localTheme.outline_variant} ${localTheme.outline_variant}`
	}
}

export function getBorderRadius(hasBanner: boolean, position: PlanBoxPosition) {
	const topOuterRadius = hasBanner ? "0" : px(size.radius_8)
	if (styles.isMobileLayout()) {
		return `0 0 0 0`
	} else if (position === "bottom") {
		return `0 0 ${px(size.radius_8)} ${px(size.radius_8)}`
	} else {
		return position === "left" ? `${topOuterRadius} 0 0 0` : `0 ${topOuterRadius} 0 0`
	}
}

export function getHasCampaign(discountDetail: DiscountDetail | undefined, isYearly: boolean) {
	return !!(discountDetail && (discountDetail.discountType === "Permanent" || isYearly))
}

export function anyHasGlobalFirstYearCampaign(discountDetails?: DiscountDetails): boolean {
	if (!discountDetails) return false
	return Object.values(discountDetails).some((v) => v.discountType === "GlobalFirstYear")
}

export function getDiscountDetails(isApplePrice: boolean, priceAndConfigProvider: PriceAndConfigProvider): DiscountDetails {
	const discountDetails: DiscountDetails = {}
	const pricingData = priceAndConfigProvider.getRawPricingData()
	const bonusMonth = Number(pricingData.bonusMonthsForYearlyPlan)

	type PriceKey = "freePrices" | "revolutionaryPrices" | "legendaryPrices" | "essentialPrices" | "advancedPrices" | "unlimitedPrices"
	const planTypeToPriceKey: Record<AvailablePlanType, PriceKey> = {
		[PlanType.Free]: "freePrices",
		[PlanType.Revolutionary]: "revolutionaryPrices",
		[PlanType.Legend]: "legendaryPrices",
		[PlanType.Essential]: "essentialPrices",
		[PlanType.Advanced]: "advancedPrices",
		[PlanType.Unlimited]: "unlimitedPrices",
	}

	function getFirstYearDiscount(priceKey: PriceKey, targetPlan: PlanType): number {
		if (isApplePrice) {
			if (priceAndConfigProvider.getIosIntroOfferEligibility() && hasAppleIntroOffer(priceAndConfigProvider)) {
				const { referencePrice: rawYearlyPrice, price: rawOfferYearlyPrice } = getRawApplePrice({
					priceAndConfigProvider,
					targetPlan,
					paymentInterval: PaymentInterval.Yearly,
				})
				if (rawYearlyPrice && rawOfferYearlyPrice) return rawYearlyPrice - rawOfferYearlyPrice
			}
			return 0
		} else {
			return Number(pricingData[priceKey].firstYearDiscount)
		}
	}

	function hasGlobalFirstYearDiscount(firstYearDiscount: number): boolean {
		if (firstYearDiscount === 0) return false
		return isApplePrice
			? priceAndConfigProvider.getIosIntroOfferEligibility() && hasAppleIntroOffer(priceAndConfigProvider)
			: priceAndConfigProvider.getRawPricingData().hasGlobalFirstYearDiscount
	}

	const targetPlans = isApplePrice ? NewPersonalPaidPlans : AvailablePlans
	for (const targetPlan of targetPlans) {
		const priceKey = planTypeToPriceKey[targetPlan]
		const firstYearDiscount = getFirstYearDiscount(priceKey, targetPlan)
		const hasGlobalCampaign = hasGlobalFirstYearDiscount(firstYearDiscount)
		const monthlyPrice = isApplePrice
			? getRawApplePrice({ priceAndConfigProvider, targetPlan, paymentInterval: PaymentInterval.Monthly }).price
			: Number(pricingData[priceKey].monthlyPrice)
		const monthlyRefPrice = isApplePrice
			? getRawApplePrice({
					priceAndConfigProvider,
					targetPlan,
					paymentInterval: PaymentInterval.Monthly,
				}).referencePrice
			: Number(pricingData[priceKey].monthlyReferencePrice)
		const yearlyRefPrice = isApplePrice
			? getRawApplePrice({
					priceAndConfigProvider,
					targetPlan,
					paymentInterval: PaymentInterval.Yearly,
				}).referencePrice
			: monthlyRefPrice * 10
		const permanentDiscountPercentage = Math.floor((1 - monthlyPrice / monthlyRefPrice) * 100)
		const firstYearDiscountPercentage = Math.floor((firstYearDiscount / yearlyRefPrice) * 100)

		if (bonusMonth > 0) {
			discountDetails[targetPlan] = {
				ribbonTranslation: lang.getTranslation("pricing.bonusMonth_label", { "{months}": bonusMonth }),
				discountType: "BonusMonths",
			}
		} else if (permanentDiscountPercentage > 0) {
			discountDetails[targetPlan] = {
				ribbonTranslation: lang.getTranslation("pricing.saveAmount_label", { "{amount}": `${permanentDiscountPercentage}%` }),
				discountType: "Permanent",
			}
		} else if (hasGlobalCampaign) {
			discountDetails[targetPlan] = {
				ribbonTranslation: lang.getTranslation("pricing.saveAmountFirstYear_label", { "{amount}": `${firstYearDiscountPercentage}%` }),
				discountType: "GlobalFirstYear",
			}
		} else if (firstYearDiscount > 0) {
			discountDetails[targetPlan] = {
				ribbonTranslation: lang.getTranslation("pricing.saveAmountFirstYear_label", { "{amount}": `${firstYearDiscountPercentage}%` }),
				discountType: "IndividualFirstYear",
			}
		}
	}
	return discountDetails
}

export const blackFridayTheme = () => ({
	...structuredClone(theme),
	primary: isDarkTheme() ? "#FFFFFF" : "#9c7935",
	tertiary: isDarkTheme() ? "#F5D799" : "#F5D799",
	on_tertiary: isDarkTheme() ? "#111111" : "#111111",
	on_surface: isDarkTheme() ? "#FFFFFF" : "#303030",
	surface_container_high: isDarkTheme() ? "#271D1D" : "#faf4ed",
})
