import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../../../ui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { getCurrentPaymentInterval, PlanTypeToName, shouldShowApplePrices, UpgradeType } from "../subscription/utils/SubscriptionUtils"
import { getDiscountDetails, getPlanSelectorSubtitle, getPlanSelectorTitle } from "../subscription/utils/PlanSelectorUtils"
import { TranslationKeyType } from "../../../ui/utils/TranslationKey"
import { PrimaryButtonAttrs } from "../../../ui/base/buttons/VariantButtons.js"
import { PlanSelector, PlanSelectorAttr, SubscriptionActionButtons } from "../subscription/PlanSelector"
import { getAsLazy } from "../../../ui/base/MaybeLazy"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { px } from "../../../ui/size"
import { styles } from "../../../ui/styles"
import { MessageBanner } from "../../../ui/base/MessageBanner"
import { AvailablePlanType, PlanType } from "../../../entities/sys/Utils"
import { PaymentInterval } from "../subscription/utils/PriceUtils"

export class PlanSelectorPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		const ctx = vnode.attrs.ctx
		const data = ctx.viewModel
		const { planPrices, acceptedPlans, accountingInfo } = data
		let availablePlans = acceptedPlans
		const isApplePrice = shouldShowApplePrices(accountingInfo ?? null)
		const discountDetails = getDiscountDetails(isApplePrice, planPrices!)
		const promotionMessage = planPrices!.getRawPricingData().messageTextId as TranslationKeyType

		const button: PrimaryButtonAttrs = {
			label: "pricing.select_action",
			onclick: () => {},
		}

		const actionButtons: SubscriptionActionButtons = {
			[PlanType.Free]: getAsLazy(button),
			[PlanType.Revolutionary]: getAsLazy(button),
			[PlanType.Legend]: getAsLazy(button),
		}
		const isBusiness = ctx.viewModel.options.businessUse()

		return m(
			`.full-width${styles.isMobileLayout() ? ".pt-16" : ""}`,
			// Headline for general messages -- currently only used when a user tries to manage multiple subscriptions on ios (which is not possible)
			data.msg && m(MessageBanner, { translation: data.msg, type: "error" }),
			// Headline for promotional messages
			promotionMessage && m(MessageBanner, { translation: lang.getTranslation(promotionMessage), type: "base" }),

			m(
				".flex.flex-column.items-start.full-width",
				{
					style: {
						"max-width": px(1000),
						"margin-inline": "auto",
					},
				},
				[
					this.renderHeadline(data),
					this.renderSubtitle(data),
					m(
						`.flex.gap-64.full-width${isBusiness ? ".justify-center" : ""}`,
						m(
							".flex-grow",
							{
								style: {
									"max-width": styles.isMobileLayout() ? "initial" : isBusiness ? px(860) : px(530),
								},
							},
							m(PlanSelector, {
								options: data.options!,
								actionButtons: actionButtons,
								priceAndConfigProvider: planPrices!,
								availablePlans: availablePlans!,
								isApplePrice,
								currentPlan: data.currentPlan ?? undefined,
								currentPaymentInterval: getCurrentPaymentInterval(accountingInfo) ?? PaymentInterval.Yearly,
								allowSwitchingPaymentInterval: isApplePrice || data.upgradeType !== UpgradeType.Switch,
								showMultiUser: false,
								discountDetails,
								targetPlan: data.targetPlanType!,
								onContinue: (selectedPlan: AvailablePlanType) => {
									data.targetPlanType = selectedPlan
									data.updatePrice()
									ctx.setLabel(PlanTypeToName[selectedPlan])
									ctx.goNext()
								},
								newSignupFlow: true,
								personalPlansAvailable: data.personalPlansAvailable,
							} satisfies PlanSelectorAttr),
						),
					),
				],
			),
		)
	}
	private renderSubtitle(data: SignupViewModel) {
		const subtitleTranslationKey = getPlanSelectorSubtitle(data.globalCampaignName, data.bonusMonthForYearlyPlans > 0)
		return m(`p.mb-32`, lang.getTranslationText(subtitleTranslationKey))
	}

	private renderHeadline(data: SignupViewModel) {
		const titleTranslationKey = getPlanSelectorTitle(data.globalCampaignName, data.bonusMonthForYearlyPlans > 0)

		return m(
			`h1.font-mdio${styles.isMobileLayout() ? ".h3" : ".h1"}`,
			{
				style: {
					position: "relative",
					top: px(-6),
				},
			},
			lang.getTranslationText(titleTranslationKey),
		)
	}
}
