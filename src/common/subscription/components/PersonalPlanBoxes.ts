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
import { AvailablePlans } from "../PlanSelector"

export type PlanBoxesAttrs = {
	allowSwitchingPaymentInterval: boolean
	availablePlans: readonly AvailablePlanType[]
	currentPaymentInterval: PaymentInterval | undefined
	currentPlan: PlanType | undefined
	hasCampaign: boolean
	hidePaidPlans: boolean
	isApplePrice: boolean
	priceAndConfigProvider: PriceAndConfigProvider
	selectedPlan: Stream<AvailablePlans>
	selectedSubscriptionOptions: SelectedSubscriptionOptions
	showMultiUser: boolean
}

export class PersonalPlanBoxes implements Component<PlanBoxesAttrs> {
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
					[PlanType.Revolutionary, PlanType.Legend].map((plan: PlanType.Legend | PlanType.Revolutionary) => {
						const getPriceStrProps = {
							priceAndConfigProvider,
							targetPlan: plan,
							paymentInterval: selectedSubscriptionOptions.paymentInterval(),
						}
						const { referencePriceStr, priceStr } = isApplePrice ? getApplePriceStr(getPriceStrProps) : getPriceStr(getPriceStrProps)
						const isCurrentPlanAndInterval = currentPlan === plan && currentPaymentInterval === selectedSubscriptionOptions.paymentInterval()

						return m(PaidPlanBox, {
							price: priceStr,
							referencePrice: referencePriceStr,
							plan,
							isSelected: plan === selectedPlan(),
							// We have to allow payment interval switch for iOS in the plan selector as we hide payment interval switch in the setting
							isDisabled:
								(plan === PlanType.Revolutionary && !availablePlans.includes(PlanType.Revolutionary)) ||
								(plan === PlanType.Legend && !availablePlans.includes(PlanType.Legend)) ||
								isApplePrice
									? isCurrentPlanAndInterval
									: currentPlan === plan,
							isCurrentPlan: isApplePrice ? isCurrentPlanAndInterval : currentPlan === plan,
							onclick: (newPlan) => selectedPlan(newPlan),
							selectedPaymentInterval: selectedSubscriptionOptions.paymentInterval,
							priceAndConfigProvider,
							hasCampaign,
							isApplePrice,
							showMultiUser,
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
