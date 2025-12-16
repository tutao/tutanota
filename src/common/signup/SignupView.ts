import m, { Vnode } from "mithril"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import { InfoLink, lang, MaybeTranslation, Translation, TranslationKey } from "../misc/LanguageViewModel.js"
import { windowFacade } from "../misc/WindowFacade.js"
import { LoginViewModel } from "../login/LoginViewModel.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { renderInfoLinks } from "../gui/RenderLoginInfoLinks.js"
import { createWizard, WizardAttrs } from "../gui/base/wizard/Wizard"
import { px } from "../gui/size"
import { NewAccountData, ReferralData, SubscriptionParameters } from "../subscription/UpgradeSubscriptionWizard"
import stream from "mithril/stream"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider, SubscriptionPrice } from "../subscription/utils/PriceUtils"
import { AvailablePlanType, getDefaultPaymentMethod, InvoiceData, PaymentData, PlanType, SubscriptionType } from "../api/common/TutanotaConstants"
import { canSubscribeToPlan, queryAppStoreSubscriptionOwnership, UpgradeType } from "../subscription/utils/SubscriptionUtils"
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
import { AccountingInfo, Customer } from "../api/entities/sys/TypeRefs"
import { PowSolution } from "../api/common/pow-worker"
import { PlanSelectorPage } from "./PlanSelectorPage"
import { SignupFormPage } from "./SignupFormPage"
import { InvoiceAndPaymentDataPageNew } from "./InvoiceAndPaymentDataPageNew"
import { SignupOrderConfirmationPage } from "./SignupOrderConfirmationPage"
import { SignupRecoveryKitPage } from "./SignupRecoveryKitPage"
import { SimplifiedCreditCardViewModel } from "../subscription/SimplifiedCreditCardInputModel"
import { IconMessageBox, InfoMessaggeBoxAttrs } from "../gui/base/ColumnEmptyMessageBox"
import { theme } from "../gui/theme"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { Country } from "../api/common/CountryList"

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
	public ccViewModel: SimplifiedCreditCardViewModel = new SimplifiedCreditCardViewModel(lang)
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

	public updatePrice() {
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

	private SignupWizard = createWizard<SignupViewModel>()

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
					? m(
							".flex-grow.flex.col.justify-center",
							/** FIXME:
							 * - not showing a message at all may be preferrable because most of the
							 * time, it's not shown long enough to read (but links should still be at the bottom)
							 * - the pop-in of the wizard is quite jarring once the init is done,
							 * compared to our previous slide-in. we should consider some kind of
							 * animation.
							 */
							m(IconMessageBox, {
								icon: BootIcons.Progress,
								message: "pleaseWait_msg",
								color: theme.on_surface_variant,
							} satisfies InfoMessaggeBoxAttrs),
						)
					: m(this.SignupWizard, {
							steps: [
								// FIXME: Just for styling purpose
								// {
								// 	title: "Order Confirmation",
								// 	content: SignupOrderConfirmationPage,
								// 	onNext: () => console.log("another next action"),
								// },
								{
									title: "Select Plan",
									content: PlanSelectorPage,
									onNext: () => console.log("another next action"),
									isBackButtonEnabled: () => false,
									showProgress: () => false,
								},
								{
									title: "Create Account",
									content: SignupFormPage,
									onNext: () => console.log("another next action"),
								},
								{
									title: "Payment",
									content: InvoiceAndPaymentDataPageNew,
									onNext: () => console.log("another next action"),
									isEnabled: (ctx) => ctx.viewModel.targetPlanType !== PlanType.Free,
								},
								{
									title: "Order Confirmation",
									content: SignupOrderConfirmationPage,
									onNext: () => console.log("another next action"),
									isEnabled: (ctx) => ctx.viewModel.targetPlanType !== PlanType.Free,
								},
								{
									title: "Recovery Kit",
									content: SignupRecoveryKitPage,
									onNext: () => console.log("another next action"),
								},
							],
							viewModel: this.wizardViewModel,
						} satisfies WizardAttrs<SignupViewModel>),
				renderInfoLinks(),
			],
		)
	}
}
