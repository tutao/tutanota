import m, { Children, Vnode } from "mithril"
import { assertMainOrNode, Country, InvoiceData, isDesktop, isIOSApp } from "@tutao/app-env"
import { InfoLink, lang, MaybeTranslation, Translation, TranslationKey } from "../../../ui/utils/LanguageViewModel.js"
import { BaseTopLevelView } from "../../../ui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../../ui/base/TopLevelView.js"
import { createWizard, WizardAttrs } from "../../../ui/base/wizard/Wizard"
import { NewAccountData, ReferralData } from "../subscription/UpgradeSubscriptionWizard"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider, SubscriptionPrice } from "../subscription/utils/PriceUtils"
import {
	canSubscribeToPlan,
	getDefaultPaymentMethod,
	PaymentData,
	queryAppStoreSubscriptionOwnership,
	UpgradeType,
} from "../subscription/utils/SubscriptionUtils"
import { locator } from "../api/main/CommonLocator"
import {
	getAvailablePlansFromSubscriptionParameters,
	getBusinessOnly,
	getReferralCodeFromParams,
	getRegistrationDataIdFromParams,
	getSubscriptionParameters,
	getWebsiteLangFromParams,
	stringToSubscriptionType,
} from "../misc/LoginUtils"
import { FeatureListProvider, SelectedSubscriptionOptions, UpgradePriceType } from "../subscription/FeatureListProvider"
import { MobilePaymentSubscriptionOwnership } from "@tutao/native-bridge/generatedIpc/enums"
import { PowSolution } from "../api/common/pow-worker"
import { PlanSelectorPage } from "./PlanSelectorPage"
import { SignupFormPage } from "./SignupFormPage"
import InvoiceAndPaymentDataPageNew from "./InvoiceAndPaymentDataPageNew"
import { SimplifiedCreditCardViewModel } from "../subscription/SimplifiedCreditCardInputModel"
import { IconMessageBox, InfoMessaggeBoxAttrs } from "../../../ui/base/ColumnEmptyMessageBox"
import { theme } from "../../../ui/theme"
import { RecoveryKitPage } from "../subscription/RecoveryKitPage"
import { UpgradeConfirmSubscriptionPageNew } from "../subscription/UpgradeConfirmSubscriptionPageNew"
import { ReferralType, SignupFlowStage, SignupFlowUsageTestController } from "../subscription/usagetest/UpgradeSubscriptionWizardUsageTestUtils"
import { completeUpgradeStage } from "../ratings/UserSatisfactionUtils"
import { windowFacade } from "../misc/WindowFacade"
import SignupWizardLayout from "./SignupWizardLayout"
import { filterInt, noOp } from "@tutao/utils"
import { Icons } from "../../../ui/base/icons/Icons"
import { AccountingInfo, Customer } from "@tutao/entities/sys"
import { AvailablePlanType, PlanType, SubscriptionType } from "../../../entities/sys/Utils"
import { getPreselectedPlanType } from "../subscription/SubscriptionPage"
import { UsageTestModel } from "../misc/UsageTestModel"
import { UsageTestController } from "@tutao/usagetests"

assertMainOrNode()

export interface SignupViewAttrs extends TopLevelAttrs {
	viewModel: SignupViewModel
	usageTestModel: UsageTestModel
	usageTestController: UsageTestController
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
	public featureListProvider?: FeatureListProvider
	public referralData: null | ReferralData
	public multipleUsersAllowed: boolean
	public acceptedPlans: AvailablePlanType[] = []
	public msg?: Translation | null
	public firstMonthForFreeOfferActive?: boolean
	public bonusMonthForYearlyPlans: number = 0
	public isCalledBySatisfactionDialog: boolean
	public registrationCode?: string
	public powChallengeSolutionPromise?: Promise<PowSolution>
	public emailInputStore?: string
	public passwordInputStore?: string
	public addressInputStore?: string
	public inlinePlanSelectorOpen: Stream<boolean>
	public inlinePlanSelectorToggleSteps: number[]
	public ccViewModel: SimplifiedCreditCardViewModel = new SimplifiedCreditCardViewModel(lang)
	public globalCampaignName: string | null
	public personalPlansAvailable: boolean
	public readonly isFreeOnly: boolean

	constructor() {
		const urlParams = m.parseQueryString(location.search.substring(1) + "&" + location.hash.substring(1))

		const registrationDataId = getRegistrationDataIdFromParams(urlParams)
		const referralData = getReferralCodeFromParams(urlParams)

		// We assume that if a user comes from our website for signup, the language selected on the website should take precedence over the browser language.
		// As we initialize the language with the browser's one in the app.ts already, we try to overwrite it by the website language here.
		const websiteLang = getWebsiteLangFromParams(urlParams)
		if (websiteLang) lang.setLanguage(websiteLang)

		const subscriptionParams = getSubscriptionParameters(urlParams)
		this.acceptedPlans = getAvailablePlansFromSubscriptionParameters(subscriptionParams).filter(canSubscribeToPlan)
		const subscriptionType = stringToSubscriptionType(subscriptionParams?.type ?? "private")
		this.isFreeOnly = subscriptionType === SubscriptionType.FreeOnly

		const paymentInterval = asPaymentInterval(PaymentInterval.Yearly)
		this.options = {
			businessUse: stream(subscriptionType === SubscriptionType.Business),
			paymentInterval: stream(paymentInterval),
		}

		this.registrationDataId = registrationDataId
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
		this.targetPlanType = getPreselectedPlanType(subscriptionParams)
		this.accountingInfo = null
		this.customer = null
		this.newAccountData = null
		this.upgradeType = UpgradeType.Signup
		this.currentPlan = null
		this.multipleUsersAllowed = false
		this.isCalledBySatisfactionDialog = false
		this.inlinePlanSelectorOpen = stream(false)
		this.inlinePlanSelectorToggleSteps = [1, 2, 3]
		this.globalCampaignName = null
		this.personalPlansAvailable = !getBusinessOnly(urlParams)
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

	public updatePrice() {
		if (this.targetPlanType === PlanType.Free) {
			this.price = null
			this.nextYearPrice = null
			return
		}
		this.price = this.planPrices!.getSubscriptionPriceWithCurrency(this.options.paymentInterval(), UpgradePriceType.PlanActualPrice, this)
		const nextYear = this.planPrices!.getSubscriptionPriceWithCurrency(this.options.paymentInterval(), UpgradePriceType.PlanNextYearsPrice, this)
		this.nextYearPrice = this.price.rawPrice !== nextYear.rawPrice ? nextYear : null
	}

	public updateInvoiceCountry(country: Country) {
		this.invoiceData.country = country
		// We overwrite this flag only for th UI change, this does not affect anything for the stored data in the server.
		// Actual paymentBillingAgreement is removed in PaymentDataService.put if the updated payment method is not PayPal.
		if (this.accountingInfo) this.accountingInfo.paypalBillingAgreement = null
	}

	async init() {
		const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(
			this.registrationDataId,
			locator.serviceExecutor,
			this.referralData?.code ?? null,
		)
		const prices = priceDataProvider.getRawPricingData()
		this.globalCampaignName = prices.globalCampaignName
		const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig()
		const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig)
		let message: MaybeTranslation | null = null
		if (isIOSApp()) {
			const appstoreSubscriptionOwnership = await queryAppStoreSubscriptionOwnership(null)
			// if we are on iOS app we only show other plans if AppStore payments are enabled and there's no subscription for this Apple ID.
			if (appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) {
				this.acceptedPlans = this.acceptedPlans.filter((plan) => plan === PlanType.Free)
			}
			if (appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) {
				message = lang.getTranslation("storeMultiSubscriptionError_msg", { "{AppStorePayment}": InfoLink.AppStorePayment })
			}
		}

		this.priceInfoTextId = priceDataProvider.getPriceInfoMessage()
		this.planPrices = priceDataProvider
		this.featureListProvider = featureListProvider
		this.msg = message
		this.firstMonthForFreeOfferActive = prices.firstMonthForFreeForYearlyPlan
		const bonusMonths = filterInt(prices.bonusMonthsForYearlyPlan)
		this.bonusMonthForYearlyPlans = Number.isNaN(bonusMonths) ? 0 : bonusMonths
		this._isInitialized = true
	}
}

export class SignupView extends BaseTopLevelView implements TopLevelView<SignupViewAttrs> {
	private bottomMargin = 0

	private wizardViewModel: SignupViewModel
	private unregisterListener: (...args: Array<any>) => any = noOp
	private SignupWizard = createWizard<SignupViewModel>()

	constructor({ attrs }: Vnode<SignupViewAttrs>) {
		super()
		this.wizardViewModel = attrs.viewModel
	}

	async onbeforeremove() {}

	private closeListener = async (event: Event) => {
		event.preventDefault()
	}

	async oncreate({ attrs }: Vnode<SignupViewAttrs>) {
		const activeTests = await attrs.usageTestModel.loadActiveUsageTests()
		attrs.usageTestController.setTests(activeTests)
		await this.wizardViewModel.init()
		let referralConversion: ReferralType = "not_referred"
		if (this.wizardViewModel.referralData && this.wizardViewModel.referralData.isCalledBySatisfactionDialog)
			referralConversion = "satisfactiondialog_referral"
		else if (this.wizardViewModel.referralData && !this.wizardViewModel.referralData.isCalledBySatisfactionDialog) referralConversion = "organic_referral"
		SignupFlowUsageTestController.initSignupFlowUsageTest(referralConversion)

		if (!isDesktop()) {
			this.unregisterListener = windowFacade.addWindowCloseListener(async () => {})
		}

		m.redraw()
	}

	onremove() {
		this.unregisterListener()
	}

	keyboardListener = (keyboardSize: number) => {
		this.bottomMargin = keyboardSize
		m.redraw()
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {}

	view({ attrs }: Vnode<SignupViewAttrs>) {
		return m(
			"#signup-view.main-view.flex.col.nav-bg",
			{
				oncreate: () => windowFacade.addKeyboardSizeListener(this.keyboardListener),
				onremove: () => windowFacade.removeKeyboardSizeListener(this.keyboardListener),
				style: {
					marginBottom: this.bottomMargin + "px",
				},
			},
			[
				!this.wizardViewModel.isInitialized
					? m(
							".flex-grow.flex.col.justify-center",
							m(IconMessageBox, {
								icon: Icons.Sync,
								message: "pleaseWait_msg",
								color: theme.on_surface_variant,
							} satisfies InfoMessaggeBoxAttrs),
						)
					: this.renderSignupPages(attrs),
			],
		)
	}

	renderSignupPages(attrs: SignupViewAttrs): Children {
		return attrs.viewModel.isFreeOnly ? this.renderFreeOnlySignupPages(attrs) : this.renderDefaultSignupPages(attrs)
	}

	renderFreeOnlySignupPages(attrs: SignupViewAttrs): Children {
		return m(this.SignupWizard, {
			layout: SignupWizardLayout,
			steps: [
				{
					title: "Create Account",
					content: SignupFormPage,
					isBackButtonEnabled: () => true,
					onPrev: (ctx) => {
						m.route.set("/")
					},
				},
				{
					title: "Recovery Kit",
					content: RecoveryKitPage,
					onNext: () => this.unregisterListener(),
					onPrev: () => {},
					isBackButtonEnabled: () => false,
				},
			],
			viewModel: this.wizardViewModel,
		} satisfies WizardAttrs<SignupViewModel>)
	}

	renderDefaultSignupPages(attrs: SignupViewAttrs): Children {
		return m(this.SignupWizard, {
			layout: SignupWizardLayout,
			steps: [
				{
					title: "Select Plan",
					content: PlanSelectorPage,
					onNext: () =>
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.SELECT_PLAN,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
						),
					onPrev: (ctx) => {
						if (ctx.viewModel.options.businessUse() && ctx.viewModel.personalPlansAvailable) {
							ctx.viewModel.options.businessUse(false)
						} else {
							m.route.set("/")
						}
					},
					isBackButtonEnabled: () => true,
					showProgress: () => false,
				},
				{
					title: "Create Account",
					content: SignupFormPage,
					onNext: () => {
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.CREATE_ACCOUNT,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
						)
						if (isIOSApp()) {
							SignupFlowUsageTestController.completeStage(
								SignupFlowStage.SELECT_PAYMENT_METHOD,
								this.wizardViewModel.targetPlanType,
								this.wizardViewModel.options.paymentInterval(),
								this.wizardViewModel.paymentData.paymentMethod,
							)
						}
					},
				},
				{
					title: "Payment",
					content: InvoiceAndPaymentDataPageNew,
					onNext: () => {
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.SELECT_PAYMENT_METHOD,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
							this.wizardViewModel.paymentData.paymentMethod,
						)
					},
					isEnabled: (ctx) => ctx.viewModel.targetPlanType !== PlanType.Free && !isIOSApp(),
				},
				{
					title: "Order Confirmation",
					content: UpgradeConfirmSubscriptionPageNew,
					onNext: () => {
						let referralConversion: ReferralType = "not_referred"
						if (this.wizardViewModel.referralData && this.wizardViewModel.referralData.isCalledBySatisfactionDialog)
							referralConversion = "satisfactiondialog_referral"
						else if (this.wizardViewModel.referralData && !this.wizardViewModel.referralData.isCalledBySatisfactionDialog)
							referralConversion = "organic_referral"
						SignupFlowUsageTestController.completeStage(
							SignupFlowStage.CONFIRM_PAYMENT,
							this.wizardViewModel.targetPlanType,
							this.wizardViewModel.options.paymentInterval(),
							this.wizardViewModel.paymentData.paymentMethod,
							referralConversion,
						)

						if (this.wizardViewModel.isCalledBySatisfactionDialog) {
							completeUpgradeStage(this.wizardViewModel.currentPlan!, this.wizardViewModel.targetPlanType)
						}
					},
					isEnabled: (ctx) => ctx.viewModel.targetPlanType !== PlanType.Free,
				},
				{
					title: "Recovery Kit",
					content: RecoveryKitPage,
					onNext: () => this.unregisterListener(),
					isBackButtonEnabled: () => false,
				},
			],
			viewModel: this.wizardViewModel,
		} satisfies WizardAttrs<SignupViewModel>)
	}
}
