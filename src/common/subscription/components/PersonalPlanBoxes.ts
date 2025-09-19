import m, { Children, Component, Vnode } from "mithril"
import { styles } from "../../gui/styles"
import { px, size } from "../../gui/size"
import { AvailablePlanType, PlanType } from "../../api/common/TutanotaConstants"
import { SelectedSubscriptionOptions } from "../FeatureListProvider"
import { PaymentInterval, PriceAndConfigProvider } from "../PriceUtils"
import { PaidPlanBox } from "./PaidPlanBox"
import { getApplePriceStr, getPriceStr } from "../SubscriptionUtils"
import { FreePlanBox } from "./FreePlanBox"
import Stream from "mithril/stream"
import { PlanConfig } from "./BusinessPlanBoxes"
import { Icons } from "../../gui/base/icons/Icons"

export type PlanBoxesAttrs = {
	allowSwitchingPaymentInterval: boolean
	availablePlans: readonly AvailablePlanType[]
	currentPaymentInterval: PaymentInterval | undefined
	currentPlan: PlanType | undefined
	hasCampaign: boolean
	hidePaidPlans: boolean
	isApplePrice: boolean
	priceAndConfigProvider: PriceAndConfigProvider
	selectedPlan: Stream<PlanType>
	selectedSubscriptionOptions: SelectedSubscriptionOptions
	showMultiUser: boolean
}

export class PersonalPlanBoxes implements Component<PlanBoxesAttrs> {
	private paidPlanConfigs: PlanConfig[] = [
		{
			type: PlanType.Revolutionary,
			tagLine: "mostPopular_label",
			icon: Icons.Revo,
			features: [
				{
					label: "pricing.comparisonStorage_msg",
					icon: Icons.PricingStorage,
					replacementKey: "storage",
				},
				{
					label: "pricing.calendarsPremium_label",
					icon: Icons.PricingCalendar,
				},
				{
					label: "pricing.mailAddressAliasesShort_label",
					icon: Icons.PricingMail,
					replacementKey: "mailAddressAliases",
				},
				{
					label: "pricing.comparisonCustomDomains_msg",
					icon: Icons.PricingCustomDomain,
					replacementKey: "customDomains",
				},
				{
					label: "pricing.comparisonSupportPremium_msg",
					icon: Icons.PricingSupport,
				},
			],
		},

		{
			type: PlanType.Legend,
			tagLine: "allYouNeed_label",
			icon: Icons.Legend,
			features: [
				{
					label: "pricing.comparisonStorage_msg",
					icon: Icons.PricingStorage,
					replacementKey: "storage",
				},
				{
					label: "pricing.calendarsPremium_label",
					icon: Icons.PricingCalendar,
				},
				{
					label: "pricing.mailAddressAliasesShort_label",
					icon: Icons.PricingMail,
					replacementKey: "mailAddressAliases",
				},
				{
					label: "pricing.comparisonCustomDomains_msg",
					icon: Icons.PricingCustomDomain,
					replacementKey: "customDomains",
				},
				{
					label: "pricing.comparisonSupportPro_msg",
					icon: Icons.PricingSupport,
				},
			],
		},
	]

	oncreate({ attrs }: Vnode<PlanBoxesAttrs>) {
		if (![PlanType.Free, PlanType.Revolutionary, PlanType.Legend].includes(attrs.selectedPlan())) {
			attrs.selectedPlan(PlanType.Revolutionary)
		}
	}

	view({
		attrs: {
			allowSwitchingPaymentInterval,
			availablePlans,
			currentPaymentInterval,
			currentPlan,
			hasCampaign,
			hidePaidPlans,
			isApplePrice,
			priceAndConfigProvider,
			selectedPlan,
			selectedSubscriptionOptions,
			showMultiUser,
		},
	}: Vnode<PlanBoxesAttrs>): Children {
		return m(
			`.flex-column${allowSwitchingPaymentInterval ? "" : ".mt"}`,
			{
				"data-testid": "dialog:select-subscription",
				style: {
					position: "relative",
					...(styles.isMobileLayout()
						? {
								// Ignore the horizontal paddings to use full width of the dialog for mobile
								width: `calc(100% + 2 * ${px(size.hpad_large)})`,
								left: "50%",
								transform: "translateX(-50%)",
							}
						: {
								width: "fit-content",
								"margin-inline": "auto",
								"max-width": px(500),
							}),
				},
			},
			m(
				"div.flex",
				{
					style: {
						width: "100%",
					},
				},
				!hidePaidPlans &&
					this.paidPlanConfigs.map((planCofig: PlanConfig, idx) => {
						const getPriceStrProps = {
							priceAndConfigProvider,
							targetPlan: planCofig.type,
							paymentInterval: selectedSubscriptionOptions.paymentInterval(),
						}
						const { referencePriceStr, priceStr } = isApplePrice ? getApplePriceStr(getPriceStrProps) : getPriceStr(getPriceStrProps)
						const isCurrentPlanAndInterval =
							currentPlan === planCofig.type && currentPaymentInterval === selectedSubscriptionOptions.paymentInterval()

						return m(PaidPlanBox, {
							planConfig: planCofig,
							price: priceStr,
							referencePrice: referencePriceStr,
							isSelected: planCofig.type === selectedPlan(),
							// We have to allow payment interval switch for iOS in the plan selector as we hide payment interval switch in the setting
							isDisabled:
								(planCofig.type === PlanType.Revolutionary && !availablePlans.includes(PlanType.Revolutionary)) ||
								(planCofig.type === PlanType.Legend && !availablePlans.includes(PlanType.Legend)) ||
								isApplePrice
									? isCurrentPlanAndInterval
									: currentPlan === planCofig.type,
							isCurrentPlan: isApplePrice ? isCurrentPlanAndInterval : currentPlan === planCofig.type,
							onclick: (newPlan) => selectedPlan(newPlan),
							selectedPaymentInterval: selectedSubscriptionOptions.paymentInterval,
							priceAndConfigProvider,
							hasCampaign,
							isApplePrice,
							showMultiUser,
							position: idx % 2 === 0 ? "left" : "right",
						})
					}),
			),
			m(FreePlanBox, {
				isSelected: selectedPlan() === PlanType.Free,
				isDisabled: !availablePlans.includes(PlanType.Free) || currentPlan === PlanType.Free,
				isCurrentPlan: currentPlan === PlanType.Free,
				select: () => selectedPlan(PlanType.Free),
				priceAndConfigProvider,
				hasCampaign,
			}),
		)
	}
}
