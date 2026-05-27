import { PlanConfig } from "../components/BusinessPlanContainer"
import { PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import { SelectedSubscriptionOptions } from "../FeatureListProvider"
import { component_size, px, size } from "../../../../ui/size"
import { styles } from "../../../../ui/styles"
import { lang, Translation, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { isDarkTheme, Theme, theme } from "../../../../ui/theme"
import { getRawApplePrice, hasAppleIntroOffer } from "./SubscriptionUtils"
import {
	AvailablePlans,
	AvailablePlanType,
	NewBusinessPlans,
	NewPersonalPaidPlans,
	NewPersonalPlans,
	PlanType,
	SubscriptionType,
} from "../../../../entities/sys/Utils"
import { goEuropeanBlue, sovereignYellowDark, sovereignYellowLight } from "../../../../ui/builtinThemes"
import Stream from "mithril/stream"

export type DiscountDetail = {
	ribbonTranslation: Translation
	discountType: "BonusMonths" | "BonusMonthsAndGlobalFirstYear" | "IndividualFirstYear" | "Permanent" | "GlobalFirstYear"
}

export type DiscountDetails = Partial<Record<PlanType, DiscountDetail>>

export type PlanBoxContainerAttrs = {
	allowSwitchingPaymentInterval: boolean
	availablePlans: readonly PlanType[]
	currentPaymentInterval: PaymentInterval | undefined
	currentPlan: PlanType | undefined
	isApplePrice: boolean
	priceAndConfigProvider: PriceAndConfigProvider
	selectedPlan: Stream<PlanType | null>
	selectedSubscriptionOptions: SelectedSubscriptionOptions
	showMultiUser: boolean
	discountDetails?: DiscountDetails
}

export type PlanBoxPosition = "left" | "right" | "bottom"

export function shouldFixButtonPosition() {
	const planSelectorEl = document.querySelector("#plan-selector")
	if (planSelectorEl) {
		const planSelectorBottom = planSelectorEl.getBoundingClientRect().bottom
		return styles.isMobileLayout() && planSelectorBottom + size.spacing_32 + component_size.button_floating_size > window.innerHeight
	}
	return false
}

export function isPersonalPlanAvailable(availablePlans: readonly AvailablePlanType[]) {
	return availablePlans.some((plan) => NewPersonalPlans.includes(plan))
}

export function filterPlanConfigsAndGetSelectedPlan(
	planConfigs: PlanConfig[],
	availablePlans: readonly PlanType[],
	selectedPlan: PlanType | null,
	currentPlan: PlanType | undefined,
): {
	planConfigs: PlanConfig[]
	selectedPlan: PlanType | null
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
	if (selectedPlan == null || !availablePlansForCurrentView.includes(selectedPlan)) {
		const enabledAndNotCurrentPlans = planConfigs.filter((planConfig) => planConfig.type !== currentPlan && !planConfig.isDisabled)
		selectedPlan = enabledAndNotCurrentPlans.length > 0 ? enabledAndNotCurrentPlans[0].type : PlanType.Free

		const isPrivate = availablePlansForCurrentView.includes(PlanType.Free)
		const defaultPlanForCurrentView = isPrivate ? PlanType.Revolutionary : null
		if (defaultPlanForCurrentView == null || availablePlansForCurrentView.includes(defaultPlanForCurrentView)) {
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

export function getHasCampaign(discountDetail: DiscountDetail | undefined, isYearly: boolean): boolean {
	return !!(discountDetail && (discountDetail.discountType === "Permanent" || isYearly))
}

function isRelevantNewPlanName(planName: string, subscriptionType: SubscriptionType): boolean {
	const planType = planName as AvailablePlanType

	if (!AvailablePlans.includes(planType)) {
		return false
	}

	switch (subscriptionType) {
		case SubscriptionType.Personal:
		case SubscriptionType.PaidPersonal:
			return NewPersonalPlans.includes(planType)
		case SubscriptionType.Business:
			return NewBusinessPlans.includes(planType)
	}
}

export function hasRelevantGlobalFirstYearCampaign(
	discountDetails: DiscountDetails | null,
	subscriptionType: SubscriptionType = SubscriptionType.Personal,
): boolean {
	if (discountDetails == null) return false
	return Object.entries(discountDetails)
		.filter(([planName, _]) => isRelevantNewPlanName(planName, subscriptionType))
		.map((v) => v[1])
		.some((v) => v.discountType === "GlobalFirstYear" || v.discountType === "BonusMonthsAndGlobalFirstYear")
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

		if (bonusMonth > 0 && NewPersonalPaidPlans.includes(targetPlan)) {
			if (firstYearDiscount > 0) {
				discountDetails[targetPlan] = {
					ribbonTranslation: lang.getTranslation("pricing.bonusMonthWithCampaign_label", { "{months}": bonusMonth }),
					discountType: "BonusMonthsAndGlobalFirstYear",
				}
			} else {
				discountDetails[targetPlan] = {
					ribbonTranslation: lang.getTranslation("pricing.bonusMonth_label", { "{months}": bonusMonth }),
					discountType: "BonusMonths",
				}
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

// these are the actual campaign name set on the server for the
// time period of the campaign. they have to be unique.
export const enum CAMPAIGN_NAME {
	BIRTHDAY_12_CAMPAIGN = "birthday_12_campaign",
	BLACKFRIDAY_CAMPAIGN = "blackfriday_campaign",
	DIGITAL_SOVEREIGNTY_2026_CAMPAIGN = "sovereignty2026",
}

export function getPlanSelectorTitle(campaignName: string | null, isReferred: boolean): TranslationKey {
	switch (campaignName) {
		case CAMPAIGN_NAME.DIGITAL_SOVEREIGNTY_2026_CAMPAIGN:
			if (isReferred) {
				return "planselector_page_sovereignty2026_referred_title"
			}
			return "planselector_page_sovereignty2026_title"
		default:
			return "planselector_page_title"
	}
}

export function getPlanSelectorSubtitle(campaignName: string | null, isReferred: boolean): TranslationKey {
	switch (campaignName) {
		case CAMPAIGN_NAME.DIGITAL_SOVEREIGNTY_2026_CAMPAIGN:
			if (isReferred) {
				return "planselector_page_sovereignty2026_referred_subtitle"
			}
			return "planselector_page_sovereignty2026_subtitle"
		default:
			return "planselector_page_subtitle"
	}
}

export const defaultCampaignTheme = () => ({
	...structuredClone(theme),
	primary: isDarkTheme() ? "#FFFFFF" : "#9c7935",
	tertiary: isDarkTheme() ? "#F5D799" : "#F5D799",
	on_tertiary: isDarkTheme() ? "#111111" : "#111111",
	on_surface: isDarkTheme() ? "#FFFFFF" : "#303030",
	surface_container_high: isDarkTheme() ? "#271D1D" : "#faf4ed",
})
export const birthdayTheme = () => ({
	...structuredClone(theme),
	primary: theme.tertiary,
	primary_container: theme.tertiary,
	secondary: theme.tertiary,
	on_surface: theme.tertiary,
	on_surface_variant: theme.tertiary,
	surface_container_high: theme.tertiary_container,
})

export const sovereignty2026Theme = () => ({
	...structuredClone(theme),
	primary: goEuropeanBlue,
	primary_container: goEuropeanBlue,
	secondary: goEuropeanBlue,
	tertiary: goEuropeanBlue,
	on_tertiary: "#FFFFFF",
	on_surface: "#111111",
	surface_container_high: sovereignYellowDark,
	surface: sovereignYellowLight,
	on_surface_variant: "#111111",
	outline_variant: goEuropeanBlue,
})

export function getCampaignTheme(campaignName: string | null) {
	if (campaignName === CAMPAIGN_NAME.BIRTHDAY_12_CAMPAIGN) {
		return birthdayTheme()
	} else if (campaignName === CAMPAIGN_NAME.DIGITAL_SOVEREIGNTY_2026_CAMPAIGN) {
		return sovereignty2026Theme()
	}

	return defaultCampaignTheme()
}
