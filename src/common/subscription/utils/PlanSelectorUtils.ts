import { PlanConfig } from "../components/BusinessPlanContainer"
import { PlanType } from "../../api/common/TutanotaConstants"
import { PaymentInterval, PriceAndConfigProvider } from "./PriceUtils"
import Stream from "mithril/stream"
import { SelectedSubscriptionOptions } from "../FeatureListProvider"
import { px, size } from "../../gui/size"
import { styles } from "../../gui/styles"

export type PlanBoxesAttrs = {
	allowSwitchingPaymentInterval: boolean
	availablePlans: readonly PlanType[]
	currentPaymentInterval: PaymentInterval | undefined
	currentPlan: PlanType | undefined
	hasCampaign: boolean
	isApplePrice: boolean
	priceAndConfigProvider: PriceAndConfigProvider
	selectedPlan: Stream<PlanType>
	selectedSubscriptionOptions: SelectedSubscriptionOptions
	showMultiUser: boolean
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
	planConfigs = planConfigs.filter((planConfig) => availablePlans.includes(planConfig.type))
	// planConfigs is filtered by availablePlan (i.e. only includes plans that are actually available)
	// If the selectedPlan is not part of the current view
	// (e.g. because we switched between private and business plans)
	// then we need to change the selectedPlan to one that can be shown.
	if (!planConfigs.map((config) => config.type).includes(selectedPlan)) {
		selectedPlan = planConfigs.filter((planConfig) => planConfig.type !== currentPlan)[0].type
	}

	return { planConfigs, selectedPlan }
}

export function getBorderWidth(isSelected: boolean, hasBanner: boolean, position: "left" | "right" | "bottom", availablePlans: readonly PlanType[]) {
	if (isSelected) {
		return "0"
	}

	const topBorderWidth = hasBanner ? "0" : "2px"
	const bottomBorderWidth = availablePlans.includes(PlanType.Free) ? px(1) : px(2)
	if (styles.isMobileLayout() && position === "bottom") {
		return `1px 0 2px 0`
	} else if (styles.isMobileLayout() && position !== "bottom") {
		return position === "left" ? `${topBorderWidth} 1px 1px 0` : `${topBorderWidth} 0 1px 1px`
	} else if (position === "bottom") {
		return "1px 2px 2px 2px"
	} else {
		return position === "left" ? `${topBorderWidth} 1px ${bottomBorderWidth} 2px` : `${topBorderWidth} 2px ${bottomBorderWidth} 1px`
	}
}

export function getBorderRadius(hasBanner: boolean, position: "left" | "right" | "bottom", availablePlans: readonly PlanType[]) {
	const topOuterRadius = hasBanner ? "0" : px(size.border_radius_large)
	const bottomOuterRadius = availablePlans.includes(PlanType.Free) ? "0" : px(size.border_radius_large)
	if (styles.isMobileLayout()) {
		return `0 0 0 0`
	} else if (position === "bottom") {
		return `0 0 ${px(size.border_radius_large)} ${px(size.border_radius_large)}`
	} else {
		return position === "left" ? `${topOuterRadius} 0 0 ${bottomOuterRadius}` : `0 ${topOuterRadius} ${bottomOuterRadius} 0`
	}
}
