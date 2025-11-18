import m, { Vnode } from "mithril"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import { InfoLink, lang, MaybeTranslation } from "../misc/LanguageViewModel.js"
import { defer, DeferredObject, lazy } from "@tutao/tutanota-utils"
import { windowFacade } from "../misc/WindowFacade.js"
import { LoginViewModel } from "./LoginViewModel.js"
import { LoginForm } from "./LoginForm.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { renderInfoLinks } from "../gui/RenderLoginInfoLinks.js"
import { Wizard, WizardAttrs } from "../gui/base/wizard/Wizard"
import { LoginButton, LoginButtonAttrs } from "../gui/base/buttons/LoginButton"
import { px } from "../gui/size"
import { WizardController } from "../gui/base/wizard/WizardController"
import { WizardStepAttrs } from "../gui/base/wizard/WizardStep"
import { SingleLineTextField, SingleLineTextFieldAttrs } from "../gui/base/SingleLineTextField"
import { TextFieldType } from "../gui/base/TextField"
import { UpgradeSubscriptionData } from "../subscription/UpgradeSubscriptionWizard"
import stream from "mithril/stream"
import { anyHasGlobalFirstYearCampaign, getDiscountDetails } from "../subscription/utils/PlanSelectorUtils"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider } from "../subscription/utils/PriceUtils"
import { getDefaultPaymentMethod, NewPaidPlans, PlanType, SubscriptionType } from "../api/common/TutanotaConstants"
import { getCurrentPaymentInterval, queryAppStoreSubscriptionOwnership, shouldShowApplePrices, UpgradeType } from "../subscription/utils/SubscriptionUtils"
import { locator } from "../api/main/CommonLocator"
import { stringToSubscriptionType } from "../misc/LoginUtils"
import { FeatureListProvider } from "../subscription/FeatureListProvider"
import { MobilePaymentSubscriptionOwnership } from "../native/common/generatedipc/MobilePaymentSubscriptionOwnership"
import { TranslationKeyType } from "../misc/TranslationKey"
import { SubscriptionActionButtons } from "../subscription/SubscriptionSelector"
import { PlanSelectorHeadline } from "../subscription/components/PlanSelectorHeadline"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { PlanSelector } from "../subscription/PlanSelector"

assertMainOrNode()

export interface SignupViewAttrs extends TopLevelAttrs {
	/** Default path to redirect to after the login. Can be overridden with query param `requestedPath`. */
	targetPath: string
	makeViewModel: () => LoginViewModel
}

export class SignupView extends BaseTopLevelView implements TopLevelView<SignupViewAttrs> {
	private readonly viewModel: LoginViewModel
	private readonly defaultRedirect: string
	private readonly initPromise: Promise<void>

	private moreExpanded: boolean
	// we save the login form because we need access to the password input field inside of it for when "loginWith" is set in the url,
	// in order to focus it
	private loginForm: DeferredObject<LoginForm>
	private selectedRedirect: string
	private bottomMargin = 0

	private readonly wizardController: WizardController
	private wizardViewModel: UpgradeSubscriptionData | undefined

	constructor({ attrs }: Vnode<SignupViewAttrs>) {
		super()
		this.defaultRedirect = attrs.targetPath
		this.selectedRedirect = this.defaultRedirect

		this.loginForm = defer()
		this.moreExpanded = false
		this.viewModel = attrs.makeViewModel()
		this.initPromise = this.viewModel.init().then(m.redraw)

		this.wizardController = new WizardController()
	}

	async oncreate() {
		let acceptedPlans = NewPaidPlans // FIXME: Do we have a case that we need hide some plans?
		const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)
		const prices = priceDataProvider.getRawPricingData()
		const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig()
		const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig)
		let message: MaybeTranslation | null
		if (isIOSApp()) {
			const appstoreSubscriptionOwnership = await queryAppStoreSubscriptionOwnership(null)
			// if we are on iOS app we only show other plans if AppStore payments are enabled and there's no subscription for this Apple ID.
			if (appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) {
				acceptedPlans = acceptedPlans.filter((plan) => plan === PlanType.Free)
			}
			message =
				appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription
					? lang.getTranslation("storeMultiSubscriptionError_msg", { "{AppStorePayment}": InfoLink.AppStorePayment })
					: null
		} else {
			message = null
		}

		// FIXME: Need to add parameter handling ///////////////////////////////////////////////////////////////////////
		// const subscriptionType = stringToSubscriptionType(subscriptionParameters?.type ?? "private")
		// const paymentInterval = asPaymentInterval(subscriptionParameters?.interval ?? PaymentInterval.Yearly)
		const subscriptionType = stringToSubscriptionType("private")
		const paymentInterval = asPaymentInterval(PaymentInterval.Yearly)
		const registrationDataId = null
		const subscriptionParameters = null
		const referralData = null
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		this.wizardViewModel = {
			options: {
				businessUse: stream(subscriptionType === SubscriptionType.Business),
				paymentInterval: stream(paymentInterval),
			},
			invoiceData: {
				invoiceAddress: "",
				country: null,
				vatNumber: "", // only for EU countries otherwise empty
			},
			paymentData: {
				paymentMethod: await getDefaultPaymentMethod(),
				creditCardData: null,
			},
			price: null,
			nextYearPrice: null,
			targetPlanType: PlanType.Free,
			accountingInfo: null,
			customer: null,
			newAccountData: null,
			registrationDataId,
			priceInfoTextId: priceDataProvider.getPriceInfoMessage(),
			upgradeType: UpgradeType.Signup,
			planPrices: priceDataProvider,
			currentPlan: null,
			subscriptionParameters,
			featureListProvider,
			referralData,
			multipleUsersAllowed: false,
			acceptedPlans,
			msg: message,
			firstMonthForFreeOfferActive: prices.firstMonthForFreeForYearlyPlan,
			isCalledBySatisfactionDialog: false,
		}
		m.redraw()
	}

	keyboardListener = (keyboardSize: number) => {
		this.bottomMargin = keyboardSize
		m.redraw()
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {}

	private makeMainStep(color: string, defaultLabel: string): WizardStepAttrs<UpgradeSubscriptionData>["content"] {
		return (ctx) =>
			m(
				".flex.col",
				{
					style: {
						backgroundColor: color,
						width: px(300),
						height: px(300),
						padding: px(8),
					},
				},
				[
					m("div", `Main content for ${defaultLabel} (step ${ctx.index + 1})`),
					m(SingleLineTextField, {
						oninput: (newValue) => {
							ctx.setLabel(newValue || defaultLabel)
						},
						value: ctx.getLabel(),
						ariaLabel: "",
						type: TextFieldType.Text,
					} satisfies SingleLineTextFieldAttrs<any>),
					m(
						".mt-m",
						m(LoginButton, {
							label: ctx.controller.stepCount === ctx.index + 1 ? "previous_action" : "next_action",
							onclick: () => {
								if (ctx.controller.stepCount === ctx.index + 1) {
									ctx.controller.prev()
								} else {
									ctx.markComplete(true)
									ctx.controller.next()
								}
							},
						}),
					),
				],
			)
	}

	private planSelectionStep(): WizardStepAttrs<UpgradeSubscriptionData>["content"] {
		return (ctx) => {
			const data = ctx.viewModel
			const { planPrices, acceptedPlans, newAccountData, targetPlanType, accountingInfo } = data
			let availablePlans = acceptedPlans
			const isApplePrice = shouldShowApplePrices(accountingInfo)
			const discountDetails = getDiscountDetails(isApplePrice, planPrices)
			const promotionMessage = planPrices.getRawPricingData().messageTextId as TranslationKeyType

			const createPaidPlanActionButtons = (planType: PlanType): lazy<LoginButtonAttrs> => {
				const isFirstMonthForFree = data.planPrices.getRawPricingData().firstMonthForFreeForYearlyPlan
				const isYearly = data.options.paymentInterval() === PaymentInterval.Yearly

				return () => ({
					label: isFirstMonthForFree && isYearly ? "pricing.selectTryForFree_label" : "pricing.select_action",
					// onclick: () => this.setNonFreeDataAndGoToNextPage(data, planType),
					onclick: () => console.log("not implemented yet"),
				})
			}

			const actionButtons: SubscriptionActionButtons = {
				[PlanType.Free]: () => {
					return {
						label: "pricing.select_action",
						// onclick: () => this.selectFree(data),
						onclick: () => console.log("not implemented yet"),
					} as LoginButtonAttrs
				},
				[PlanType.Revolutionary]: createPaidPlanActionButtons(PlanType.Revolutionary),
				[PlanType.Legend]: createPaidPlanActionButtons(PlanType.Legend),
				[PlanType.Essential]: createPaidPlanActionButtons(PlanType.Essential),
				[PlanType.Advanced]: createPaidPlanActionButtons(PlanType.Advanced),
				[PlanType.Unlimited]: createPaidPlanActionButtons(PlanType.Unlimited),
			}

			return m("div", [
				// Headline for a global campaign
				!data.options.businessUse() &&
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
					options: data.options,
					actionButtons,
					priceAndConfigProvider: planPrices,
					availablePlans,
					isApplePrice,
					currentPlan: data.currentPlan ?? undefined,
					currentPaymentInterval: getCurrentPaymentInterval(accountingInfo),
					allowSwitchingPaymentInterval: isApplePrice || data.upgradeType !== UpgradeType.Switch,
					showMultiUser: false,
					discountDetails,
					targetPlan: data.targetPlanType,
				}),
			])
		}
	}

	view({ attrs }: Vnode<SignupViewAttrs>) {
		return m(
			"#login-view.main-view.flex.col.nav-bg",
			{
				oncreate: () => windowFacade.addKeyboardSizeListener(this.keyboardListener),
				onremove: () => windowFacade.removeKeyboardSizeListener(this.keyboardListener),
				style: {
					marginBottom: this.bottomMargin + "px",
				},
			},
			[
				!this.wizardViewModel
					? m("", "Loading spinner!")
					: m(Wizard, {
							steps: [
								{
									title: "!Step 1",
									content: this.planSelectionStep(),
								},
								{
									content: this.makeMainStep("yellow", "Step 2"),
								},
								{
									title: "Step 3",
									content: this.makeMainStep("green", "Step 3"),
								},

								{
									title: "Step 4",
									content: this.makeMainStep("green", "Step 3"),
								},

								{
									title: "Step 5",
									content: this.makeMainStep("green", "Step 3"),
								},

								{
									title: "Step 6",
									content: this.makeMainStep("green", "Step 3"),
								},
							],
							controller: this.wizardController,
							viewModel: this.wizardViewModel,
						} satisfies WizardAttrs<UpgradeSubscriptionData>),
				renderInfoLinks(),
			],
		)
	}
}
