import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { createAccount } from "../subscription/utils/PaymentUtils"
import { PlanType } from "../api/common/TutanotaConstants"
import { SignupFormNew } from "./components/SignupFormNew"
import { lang } from "../misc/LanguageViewModel"
import { theme } from "../gui/theme"
import { layout_size, px, size } from "../gui/size"
import { styles } from "../gui/styles"

export class SignupFormPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		const { ctx } = vnode.attrs
		const data = ctx.viewModel
		const newAccountData = data.newAccountData
		let mailAddress: undefined | string = undefined
		if (newAccountData) mailAddress = newAccountData.mailAddress

		return m(`.flex.flex-column.full-width${styles.isMobileLayout() ? ".pt-16" : ""}`, [
			m(
				`h1.font-mdio${styles.isMobileLayout() ? ".h2" : ".h1"}`,
				{
					style: {
						// This aligns the font to the top edge of the layout box.
						// TODO: Replace below to `text-box-trim` once it becomes baseline. Same applies to the other sign-up wizard pages.
						// https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim
						position: "relative",
						top: px(-6),
					},
				},
				lang.get("signup_page_title"),
			),
			m(`p.${styles.isMobileLayout() ? ".mb-32" : ""}`, { style: { color: theme.on_surface_variant } }, lang.get("signup_page_subtitle")),
			m("div.flex.items-start.gap-64", [
				m(
					".flex-grow",
					{
						style: {
							width: `calc(50% - ${px(size.spacing_32)})`,
						},
					},
					m(SignupFormNew, {
						onComplete: async (formResult) => {
							if (formResult.type === "success") {
								data.registrationCode = formResult.registrationCode
								data.powChallengeSolutionPromise = formResult.powChallengeSolutionPromise
								data.emailInputStore = formResult.emailInputStore
								data.passwordInputStore = formResult.passwordInputStore

								const createResult = await createAccount(data)
								if (createResult != null) {
									const { errorMessageId, variant } = createResult
									if (variant === "fatalFailure") {
										m.route.set("/login")
									}
									return errorMessageId
								}
								ctx.setLabel(formResult.emailInputStore)
								ctx.controller.progressItems[ctx.index].isReachable = false
								ctx.goNext()
								return null
							} else {
								m.route.set("/login")
								return null
							}
						},
						onNext: () => ctx.goNext(),
						onChangePlan: () => {
							if (styles.bodyWidth >= layout_size.wizard_show_illustration_min_width && !data.options.businessUse()) {
								if (data.targetPlanType === PlanType.Free) {
									data.targetPlanType = PlanType.Revolutionary
									data.updatePrice()
								}
								data.inlinePlanSelectorOpen(true)
							} else {
								ctx.goPrev()
							}
						},
						isBusinessUse: data.options.businessUse,
						isPaidSubscription: () => data.targetPlanType !== PlanType.Free,
						campaignToken: () => data.registrationDataId,
						prefilledMailAddress: mailAddress,
						newAccountData: data.newAccountData,
						emailInputStore: data.emailInputStore,
						passwordInputStore: data.passwordInputStore,
						signupViewModel: data,
					}),
				),
			]),
		])
	}
}
