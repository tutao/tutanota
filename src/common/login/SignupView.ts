import m, { Vnode } from "mithril"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import { InfoLink, lang, MaybeTranslation, Translation, TranslationKey } from "../misc/LanguageViewModel.js"
import { getAsLazy } from "@tutao/tutanota-utils"
import { windowFacade } from "../misc/WindowFacade.js"
import { LoginViewModel } from "./LoginViewModel.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { renderInfoLinks } from "../gui/RenderLoginInfoLinks.js"
import { Wizard, WizardAttrs } from "../gui/base/wizard/Wizard"
import { LoginButton, LoginButtonAttrs, SecondaryButton, TertiaryButton } from "../gui/base/buttons/LoginButton"
import { px, size } from "../gui/size"
import { WizardStepAttrs } from "../gui/base/wizard/WizardStep"
import { NewAccountData, ReferralData, SubscriptionParameters } from "../subscription/UpgradeSubscriptionWizard"
import stream from "mithril/stream"
import { anyHasGlobalFirstYearCampaign, getDiscountDetails } from "../subscription/utils/PlanSelectorUtils"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider, SubscriptionPrice } from "../subscription/utils/PriceUtils"
import {
	AvailablePlanType,
	getDefaultPaymentMethod,
	InvoiceData,
	PaymentData,
	PlanType,
	PlanTypeToName,
	SubscriptionType,
} from "../api/common/TutanotaConstants"
import {
	canSubscribeToPlan,
	getCurrentPaymentInterval,
	queryAppStoreSubscriptionOwnership,
	shouldShowApplePrices,
	UpgradeType,
} from "../subscription/utils/SubscriptionUtils"
import { locator } from "../api/main/CommonLocator"
import {
	getAvailablePlansFromSubscriptionParameters,
	getReferralCodeFromParams,
	getRegistrationDataIdFromParams,
	getSubscriptionParameters,
	getWebsiteLangFromParams,
	stringToSubscriptionType,
} from "../misc/LoginUtils"
import { FeatureListProvider, SelectedSubscriptionOptions, UpgradePriceType } from "../subscription/FeatureListProvider"
import { MobilePaymentSubscriptionOwnership } from "../native/common/generatedipc/MobilePaymentSubscriptionOwnership"
import { TranslationKeyType } from "../misc/TranslationKey"
import { PlanSelectorHeadline } from "../subscription/components/PlanSelectorHeadline"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { PlanSelector, PlanSelectorAttr, SubscriptionActionButtons } from "../subscription/PlanSelector"
import { AccountingInfo, Customer } from "../api/entities/sys/TypeRefs"
import { PowSolution } from "../api/common/pow-worker"
import { SignupForm } from "../subscription/SignupForm"
import { createAccount } from "../subscription/utils/PaymentUtils"
import { InvoiceAndPaymentDataPageNew } from "../subscription/InvoiceAndPaymentDataPageNew"
import { UpgradeConfirmSubscriptionPageNew } from "../subscription/UpgradeConfirmSubscriptionPageNew"
import { UpgradeCongratulationsPageNew } from "../subscription/UpgradeCongratulationsPageNew"
import { RadioSelector, type RadioSelectorAttrs } from "../gui/base/RadioSelector"
import { type RadioSelectorOption } from "../gui/base/RadioSelectorItem"
import { theme } from "../gui/theme"
import { TextField, TextFieldAttrs } from "../gui/base/TextField"
import { Icons } from "../gui/base/icons/Icons"

assertMainOrNode()

export interface SignupViewAttrs extends TopLevelAttrs {
	/** Default path to redirect to after the login. Can be overridden with query param `requestedPath`. */
	targetPath: string
	makeViewModel: () => LoginViewModel
}

export class SignupViewModel {
	get isInitialized(): boolean {
		return this._isInitialized
	}
	private _isInitialized = false
	public options: SelectedSubscriptionOptions
	public invoiceData: InvoiceData
	public paymentData: PaymentData
	public targetPlanType: PlanType
	public price: SubscriptionPrice | null
	public nextYearPrice: SubscriptionPrice | null
	public accountingInfo: AccountingInfo | null
	public customer: Customer | null
	public newAccountData: NewAccountData | null
	public registrationDataId: string | null
	public priceInfoTextId?: TranslationKey | null
	public upgradeType: UpgradeType
	public planPrices?: PriceAndConfigProvider
	public currentPlan: PlanType | null
	public subscriptionParameters: SubscriptionParameters | null
	public featureListProvider?: FeatureListProvider
	public referralData: null | ReferralData
	public multipleUsersAllowed: boolean
	public acceptedPlans: AvailablePlanType[] = []
	public msg?: Translation | null
	public firstMonthForFreeOfferActive?: boolean
	public isCalledBySatisfactionDialog: boolean
	public registrationCode?: string
	public powChallengeSolutionPromise?: Promise<PowSolution>
	public emailInputStore?: string
	public passwordInputStore?: string
	public addressInputStore?: string
	constructor() {
		const urlParams = m.parseQueryString(location.search.substring(1) + "&" + location.hash.substring(1))

		const subscriptionParams = getSubscriptionParameters(urlParams)
		const registrationDataId = getRegistrationDataIdFromParams(urlParams)
		const referralData = getReferralCodeFromParams(urlParams)
		this.acceptedPlans = getAvailablePlansFromSubscriptionParameters(subscriptionParams).filter(canSubscribeToPlan)
		// We assume that if a user comes from our website for signup, the language selected on the website should take precedence over the browser language.
		// As we initialize the language with the browser's one in the app.ts already, we try to overwrite it by the website language here.
		const websiteLang = getWebsiteLangFromParams(urlParams)
		if (websiteLang) lang.setLanguage(websiteLang)
		const subscriptionType = stringToSubscriptionType(subscriptionParams?.type ?? "private")
		const paymentInterval = asPaymentInterval(PaymentInterval.Yearly)
		const subscriptionParameters = null
		this.options = {
			businessUse: stream(subscriptionType === SubscriptionType.Business),
			paymentInterval: stream(paymentInterval),
		}

		this.registrationDataId = registrationDataId
		this.subscriptionParameters = subscriptionParameters
		this.referralData = referralData
		this.invoiceData = {
			invoiceAddress: "",
			country: null,
			vatNumber: "", // only for EU countries otherwise empty
		}
		this.paymentData = {
			paymentMethod: getDefaultPaymentMethod(),
			creditCardData: null,
		}
		this.price = null
		this.nextYearPrice = null
		this.targetPlanType = PlanType.Revolutionary
		this.accountingInfo = null
		this.customer = null
		this.newAccountData = null
		this.upgradeType = UpgradeType.Signup
		this.currentPlan = null
		this.multipleUsersAllowed = false
		this.isCalledBySatisfactionDialog = false
	}

	private cleanupCalled = false

	private beforeUnloadHandler = (_event: BeforeUnloadEvent) => {
		this.runBeforeUnload()
	}

	private runBeforeUnload() {
		if (this.cleanupCalled) return
		this.cleanupCalled = true
		locator.logins.logout(true)
	}

	oncreate() {
		window.addEventListener("beforeunload", this.beforeUnloadHandler)
	}

	onremove() {
		this.runBeforeUnload()
		window.removeEventListener("beforeunload", this.beforeUnloadHandler)
	}

	public updatePrice() {
		this.price = this.planPrices!.getSubscriptionPriceWithCurrency(this.options.paymentInterval(), UpgradePriceType.PlanActualPrice, this)
		const nextYear = this.planPrices!.getSubscriptionPriceWithCurrency(this.options.paymentInterval(), UpgradePriceType.PlanNextYearsPrice, this)
		this.nextYearPrice = this.price.rawPrice !== nextYear.rawPrice ? nextYear : null
	}

	async init() {
		const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)
		const prices = priceDataProvider.getRawPricingData()
		const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig()
		const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig)
		let message: MaybeTranslation | null
		if (isIOSApp()) {
			const appstoreSubscriptionOwnership = await queryAppStoreSubscriptionOwnership(null)
			// if we are on iOS app we only show other plans if AppStore payments are enabled and there's no subscription for this Apple ID.
			if (appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) {
				this.acceptedPlans = this.acceptedPlans.filter((plan) => plan === PlanType.Free)
			}
			message =
				appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription
					? lang.getTranslation("storeMultiSubscriptionError_msg", { "{AppStorePayment}": InfoLink.AppStorePayment })
					: null
		} else {
			message = null
		}

		this.priceInfoTextId = priceDataProvider.getPriceInfoMessage()
		this.planPrices = priceDataProvider
		this.featureListProvider = featureListProvider
		this.msg = message
		this.firstMonthForFreeOfferActive = prices.firstMonthForFreeForYearlyPlan
		this._isInitialized = true
	}
}

export class SignupView extends BaseTopLevelView implements TopLevelView<SignupViewAttrs> {
	private bottomMargin = 0

	private wizardViewModel: SignupViewModel

	constructor({ attrs }: Vnode<SignupViewAttrs>) {
		super()
		this.wizardViewModel = new SignupViewModel()
	}

	async oncreate() {
		await this.wizardViewModel.init()
		m.redraw()
	}

	keyboardListener = (keyboardSize: number) => {
		this.bottomMargin = keyboardSize
		m.redraw()
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {}

	private renderSignupForm(): WizardStepAttrs<SignupViewModel>["content"] {
		return (ctx) => {
			const data = this.wizardViewModel
			const newAccountData = data.newAccountData
			let mailAddress: undefined | string = undefined
			if (newAccountData) mailAddress = newAccountData.mailAddress

			return m(
				"div.flex.items-center.flex-center",
				m(SignupForm, {
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
					onChangePlan: () => {
						ctx.goPrev()
					},
					isBusinessUse: data.options.businessUse,
					isPaidSubscription: () => data.targetPlanType !== PlanType.Free,
					campaignToken: () => data.registrationDataId,
					prefilledMailAddress: mailAddress,
					newAccountData: data.newAccountData,
					emailInputStore: data.emailInputStore,
					passwordInputStore: data.passwordInputStore,
				}),
			)
		}
	}

	private currentOption = 0
	private radioTestPage(): WizardStepAttrs<SignupViewModel>["content"] {
		const boxAttr = { style: { width: px(400), height: px(500), background: theme.primary_container, padding: size.spacing_16 } }
		return (ctx) => {
			const options: ReadonlyArray<RadioSelectorOption<number>> = [
				{
					name: "partner_label",
					value: 0,
					renderChild: () =>
						m(
							"div.flex.flex-column",
							{
								style: {
									width: px(400),
									height: px(500),
								},
							},

							[
								m(TextField, {
									oninput: (newValue) => (this.wizardViewModel.addressInputStore = newValue),
									label: lang.getTranslation("address_label"),
									value: this.wizardViewModel.addressInputStore ?? "",
									leadingIcon: {
										icon: Icons.Eye,
										color: theme.on_surface_variant,
									},
								} satisfies TextFieldAttrs),
								m(
									".flex-center.full-width.pt-32",
									m(LoginButton, {
										label: "next_action",
										width: "full",
										icon: Icons.Eye,
										onclick: () => ctx.goNext(),
									}),
								),
								m(
									".flex-center.full-width.pt-32",
									m(SecondaryButton, {
										label: "next_action",
										width: "full",
										icon: Icons.Eye,
										onclick: () => ctx.goNext(),
									}),
								),
								m(TertiaryButton, {
									label: "previous_action",
									icon: Icons.Eye,
									width: "flex",
									onclick: () => m.route.set("/"),
								}),
							],
						),
				},
				{ name: "credit_label", value: 1, renderChild: () => m("div", boxAttr, "2") },
				{ name: "userSettings_label", value: 2, renderChild: () => m("div", boxAttr, "3") },
			]
			return m(".mt-16.mb-16", [
				m(RadioSelector, {
					groupName: "credentialsEncryptionMode_label",
					options,
					selectedOption: this.currentOption,
					onOptionSelected: (mode: number) => {
						this.currentOption = mode
					},
				} satisfies RadioSelectorAttrs<number>),

				m(
					"full-width.pt-l",
					m(LoginButton, {
						label: "next_action",
						size: "md",
						width: "full",
						onclick: () => ctx.goNext(),
					}),
				),
			])
		}
	}

	private renderPlanSelector(): WizardStepAttrs<SignupViewModel>["content"] {
		return (ctx) => {
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

			return m("div.flex.items-center.flex-center", [
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

	private renderPaymentStep(): WizardStepAttrs<SignupViewModel>["content"] {
		return (ctx) => {
			return m(
				".flex.col.justify-center",
				{
					style: {
						"max-width": "50%",
					},
				},
				m(InvoiceAndPaymentDataPageNew, ctx),
			)
		}
	}

	private renderOrderConfirmation(): WizardStepAttrs<SignupViewModel>["content"] {
		return (ctx) => {
			return m(
				".flex.col.justify-center",
				{
					style: {
						"max-width": "50%",
					},
				},
				m(UpgradeConfirmSubscriptionPageNew, ctx),
			)
		}
	}

	private renderRecoveryCode(): WizardStepAttrs<SignupViewModel>["content"] {
		return (ctx) => {
			return m(UpgradeCongratulationsPageNew, ctx)
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
				!this.wizardViewModel.isInitialized
					? m("", "Loading spinner!")
					: m(Wizard, {
							steps: [
								{
									title: "radio test",
									content: this.radioTestPage(),
									onNext: () => console.log("next action was called"),
								},
								{
									title: "Select Plan",
									content: this.renderPlanSelector(),
									onNext: () => console.log("next action was called"),
								},
								{
									title: "Create Account",
									content: this.renderSignupForm(),
								},
								{
									title: "Payment",
									content: this.renderPaymentStep(),
									isEnabled: (ctx) => ctx.viewModel.targetPlanType !== PlanType.Free || ctx.controller.currentStep === 0,
								},

								{
									title: "Order Confirmation",
									content: this.renderOrderConfirmation(),
									isEnabled: (ctx) => ctx.viewModel.targetPlanType !== PlanType.Free || ctx.controller.currentStep === 0,
								},

								{
									title: "Recovery Code",
									content: this.renderRecoveryCode(),
								},
							],
							viewModel: this.wizardViewModel,
						} satisfies WizardAttrs<SignupViewModel>),
				renderInfoLinks(),
			],
		)
	}
}
