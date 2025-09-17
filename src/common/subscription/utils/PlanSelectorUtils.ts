import { PlanConfig } from "../components/BusinessPlanContainer"
import { AvailablePlanType, NewPersonalPlans, PlanType } from "../../api/common/TutanotaConstants"
import { PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import Stream from "mithril/stream"
import { SelectedSubscriptionOptions } from "../FeatureListProvider"
import { px, size } from "../../gui/size"
import { styles } from "../../gui/styles"
import { Translation } from "../../misc/LanguageViewModel"

export type DiscountDetail = {
	ribbonTranslation: Translation
	discountType: "BonusMonths" | "IndividualFirstYear" | "Permanent" | "GlobalFirstYear"
}

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
	discountDetail?: DiscountDetail
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
	const availablePlansForCurrentView = planConfigs.filter((planConfig) => !planConfig.isDisabled).map((config) => config.type)
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

export function getBorderWidth(isSelected: boolean, hasBanner: boolean, position: PlanBoxPosition) {
	const topBorderWidth = hasBanner && position !== "bottom" ? "0" : "2px"
	if (isSelected) {
		if (!styles.isMobileLayout()) return `${topBorderWidth} ${px(2)} ${px(2)} ${px(2)}`

		if (position === "left") {
			return `${topBorderWidth} ${px(2)} ${px(2)} 0`
		} else if (position === "right") {
			return `${topBorderWidth} 0 ${px(2)} ${px(2)}`
		} else {
			return `${px(2)} 0 ${px(2)} 0`
		}
	}

	if (styles.isMobileLayout() && position === "bottom") {
		return `1px 0 2px 0`
	} else if (styles.isMobileLayout() && position !== "bottom") {
		return position === "left" ? `${topBorderWidth} 1px 1px 0` : `${topBorderWidth} 0 1px 1px`
	} else if (position === "bottom") {
		return "1px 2px 2px 2px"
	} else {
		return position === "left" ? `${topBorderWidth} 1px 1px 2px` : `${topBorderWidth} 2px 1px 1px`
	}
}

export function getBorderRadius(hasBanner: boolean, position: PlanBoxPosition) {
	const topOuterRadius = hasBanner ? "0" : px(size.border_radius_large)
	if (styles.isMobileLayout()) {
		return `0 0 0 0`
	} else if (position === "bottom") {
		return `0 0 ${px(size.border_radius_large)} ${px(size.border_radius_large)}`
	} else {
		return position === "left" ? `${topOuterRadius} 0 0 0` : `0 ${topOuterRadius} 0 0`
	}
}

export function getHasCampaign(discountDetail: DiscountDetail | undefined, isYearly: boolean) {
	return !!(discountDetail && (discountDetail.discountType === "Permanent" || isYearly))
}
