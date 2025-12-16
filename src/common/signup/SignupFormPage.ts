import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { createAccount } from "../subscription/utils/PaymentUtils"
import { PlanType } from "../api/common/TutanotaConstants"
import { SignupFormNew } from "./components/SignupFormNew"
import { lang } from "../misc/LanguageViewModel"
import { theme } from "../gui/theme"
import { px } from "../gui/size"

export class SignupFormPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		const { ctx } = vnode.attrs
		const data = ctx.viewModel
		const newAccountData = data.newAccountData
		let mailAddress: undefined | string = undefined
		if (newAccountData) mailAddress = newAccountData.mailAddress

		return m(".flex.flex-column.full-width", [
			m("h1.font-mdio.line-height-1", lang.get("signup_page_title")),
			m("p", { style: { color: theme.on_surface_variant } }, lang.get("signup_page_subtitle")),
			m("div.flex.items-start.gap-64", [
				m(
					".flex-grow",
					m(SignupFormNew, {
						onComplete: async (result) => {
							if (result.type === "success") {
								data.registrationCode = result.registrationCode
								data.powChallengeSolutionPromise = result.powChallengeSolutionPromise
								data.emailInputStore = result.emailInputStore
								data.passwordInputStore = result.passwordInputStore

								await createAccount(data, () => m.route.set("/login"))
								ctx.setLabel(result.emailInputStore)
								ctx.controller.progressItems[ctx.index].isReachable = false
								ctx.goNext()
							} else {
								m.route.set("/login")
							}
						},
						onNext: () => ctx.goNext(),
						onChangePlan: () => ctx.goPrev(),
						isBusinessUse: data.options.businessUse,
						isPaidSubscription: () => data.targetPlanType !== PlanType.Free,
						campaignToken: () => data.registrationDataId,
						prefilledMailAddress: mailAddress,
						newAccountData: data.newAccountData,
						emailInputStore: data.emailInputStore,
						passwordInputStore: data.passwordInputStore,
					}),
				),
				m(
					".flex-grow",
					m("img.block.full-width", {
						style: { "max-width": px(400), "margin-inline": "auto" },
						src: `${window.tutao.appState.prefixWithoutFile}/images/signup/placeholder.svg`,
						alt: "",
						rel: "noreferrer",
						loading: "lazy",
						decoding: "async",
					}),
				),
			]),
		])
	}
}
