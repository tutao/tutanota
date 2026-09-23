import m from "mithril"
import { EnvProvider, PaymentSetup } from "@tutao/app-env"
import { InfoLink, lang, Translation, TranslationKey } from "../../../../ui/utils/LanguageViewModel.js"
import { NewAccountData, ReferralData } from "../../subscription/UpgradeSubscriptionWizard"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider, SubscriptionPrice } from "../../subscription/utils/PriceUtils"
import {
	canSubscribeToPlan,
	getDefaultPaymentMethod,
	PaymentData,
	queryExternalSubscriptionOwnership,
	UpgradeType,
} from "../../subscription/utils/SubscriptionUtils"
import { locator } from "../../api/main/CommonLocator"
import {
	getAvailablePlansFromSubscriptionParameters,
	getBusinessOnly,
	getReferralCodeFromParams,
	getRegistrationDataIdFromParams,
	getSubscriptionParameters,
	getWebsiteLangFromParams,
	stringToSubscriptionType,
} from "../../misc/LoginUtils"
import { FeatureListProvider, SelectedSubscriptionOptions, UpgradePriceType } from "../../subscription/FeatureListProvider"
import { MobilePaymentSubscriptionOwnership } from "@tutao/native-bridge/generatedIpc/enums"
import { PowSolution } from "../../api/common/pow-worker"
import { SimplifiedCreditCardViewModel } from "../../subscription/SimplifiedCreditCardInputModel"
import { filterInt } from "@tutao/utils"
import { AccountingInfo, Customer } from "@tutao/entities/sys"
import { AvailablePlanType, PlanType, SubscriptionType } from "../../../../entities/sys/Utils"
import { getPreselectedPlanType } from "../../subscription/SubscriptionPage"
import { InvoiceData } from "../../subscription/utils/PaymentUtils"
import { Country } from "../../gui/CountryList"
import { NotFoundError } from "@tutao/rest-client/error"

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
	public messageBoxMessage?: Translation | null
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
		let priceDataProvider: PriceAndConfigProvider
		try {
			priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(
				this.registrationDataId,
				locator.serviceExecutor,
				this.referralData?.code ?? null,
			)
		} catch (e) {
			if (e instanceof NotFoundError && this.registrationDataId != null) {
				this.registrationDataId = null
				priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, this.referralData?.code ?? null)
			} else {
				throw e
			}
		}
		const prices = priceDataProvider.getRawPricingData()
		this.globalCampaignName = prices.globalCampaignName
		const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig()
		const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig)
		this.options.businessUse(prices.business)

		this.priceInfoTextId = priceDataProvider.getPriceInfoMessage()
		this.planPrices = priceDataProvider
		this.featureListProvider = featureListProvider
		this.messageBoxMessage = await this.resolveMessageBox()
		this.firstMonthForFreeOfferActive = prices.firstMonthForFreeForYearlyPlan
		const bonusMonths = filterInt(prices.bonusMonthsForYearlyPlan)
		this.bonusMonthForYearlyPlans = Number.isNaN(bonusMonths) ? 0 : bonusMonths
		this._isInitialized = true
	}

	private async resolveMessageBox(): Promise<Translation | null> {
		if (EnvProvider.get().getPaymentSetup() !== PaymentSetup.Default) {
			this.options.businessUse(false)
			const appstoreSubscriptionOwnership = await queryExternalSubscriptionOwnership(null)
			// if we are on iOS/google play we only show other plans if there's no subscription for this Apple ID/Google ID.
			if (appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) {
				this.acceptedPlans = this.acceptedPlans.filter((plan) => plan === PlanType.Free)
			}
			if (appstoreSubscriptionOwnership !== MobilePaymentSubscriptionOwnership.NoSubscription) {
				return lang.getTranslation("storeMultiSubscriptionError_msg", { "{AppStorePayment}": InfoLink.AppStorePayment })
			}
		}
		return null
	}
}
