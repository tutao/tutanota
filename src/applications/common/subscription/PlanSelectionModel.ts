import type { AccountingInfo } from "@tutao/entities/sys"
import type { AvailablePlanType, PlanType } from "../../../entities/sys/Utils"
import type { Translation } from "../../../ui/utils/LanguageViewModel"
import type { SelectedSubscriptionOptions } from "./FeatureListProvider"
import type { PriceAndConfigProvider } from "./utils/PriceUtils"
import type { UpgradeType } from "./utils/SubscriptionUtils"

export interface PlanSelectionModel {
	options: SelectedSubscriptionOptions
	planPrices?: PriceAndConfigProvider
	acceptedPlans: readonly AvailablePlanType[]
	accountingInfo: AccountingInfo | null
	currentPlan: PlanType | null
	targetPlanType: PlanType
	upgradeType: UpgradeType
	globalCampaignName: string | null
	bonusMonthForYearlyPlans: number
	personalPlansAvailable: boolean
	messageBoxMessage?: Translation | null
}
