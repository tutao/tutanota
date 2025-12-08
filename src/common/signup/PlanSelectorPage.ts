import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { getCurrentPaymentInterval, shouldShowApplePrices, UpgradeType } from "../subscription/utils/SubscriptionUtils"
import { anyHasGlobalFirstYearCampaign, getDiscountDetails } from "../subscription/utils/PlanSelectorUtils"
import { TranslationKeyType } from "../misc/TranslationKey"
import { LoginButtonAttrs } from "../gui/base/buttons/LoginButton"
import { PlanSelector, PlanSelectorAttr, SubscriptionActionButtons } from "../subscription/PlanSelector"
import { AvailablePlanType, PlanType, PlanTypeToName } from "../api/common/TutanotaConstants"
import { getAsLazy } from "@tutao/tutanota-utils"
import { PlanSelectorHeadline } from "../subscription/components/PlanSelectorHeadline"
import { lang } from "../misc/LanguageViewModel"
import { BootIcons } from "../gui/base/icons/BootIcons"

export class PlanSelectorPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		const ctx = vnode.attrs.ctx
		const data = ctx.viewModel
		const { planPrices, acceptedPlans, newAccountData, targetPlanType, accountingInfo } = data
		let availablePlans = acceptedPlans
		const isApplePrice = shouldShowApplePrices(accountingInfo ?? null)
		const discountDetails = getDiscountDetails(isApplePrice, planPrices!)
		const promotionMessage = planPrices!.getRawPricingData().messageTextId as TranslationKeyType

		const button: LoginButtonAttrs = {
			label: "pricing.select_action",
			onclick: () => {},
		}

		const actionButtons: SubscriptionActionButtons = {
			[PlanType.Free]: getAsLazy(button),
			[PlanType.Revolutionary]: getAsLazy(button),
			[PlanType.Legend]: getAsLazy(button),
		}

		return m(".flex.flex-column.items-start", [
			m("h1.font-mdio.line-height-1", lang.getTranslationText("planselector_page_title")),
			m("p", lang.getTranslationText("planselector_page_subtitle")),
			// Headline for a global campaign
			!data.options!.businessUse() &&
				anyHasGlobalFirstYearCampaign(discountDetails) &&
				m(PlanSelectorHeadline, {
					translation: lang.getTranslation("pricing.cyber_monday_msg"),
					icon: BootIcons.Heart,
				}),
			// Headline for general messages
			data.msg && m(PlanSelectorHeadline, { translation: data.msg }),
			// Headline for promotional messages
			promotionMessage && m(PlanSelectorHeadline, { translation: lang.getTranslation(promotionMessage) }),

			m(PlanSelector, {
				options: data.options!,
				actionButtons: actionButtons,
				priceAndConfigProvider: planPrices!,
				availablePlans: availablePlans!,
				isApplePrice,
				currentPlan: data.currentPlan ?? undefined,
				currentPaymentInterval: getCurrentPaymentInterval(accountingInfo!),
				allowSwitchingPaymentInterval: isApplePrice || data.upgradeType !== UpgradeType.Switch,
				showMultiUser: false,
				discountDetails,
				targetPlan: data.targetPlanType!,
				onContinue: (selectedPlan: AvailablePlanType) => {
					data.targetPlanType = selectedPlan
					data.updatePrice()
					ctx.setLabel(PlanTypeToName[selectedPlan])
					if (data.newAccountData?.mailAddress) {
						ctx.controller.setStep(ctx.index + 2)
					} else {
						ctx.goNext()
					}
				},
			} satisfies PlanSelectorAttr),
		])
	}
}
