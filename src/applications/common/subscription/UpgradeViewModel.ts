import type { AccountingInfo, Customer } from "@tutao/entities/sys"
import { filterInt } from "@tutao/utils"
import { AvailablePlanType, NewPaidPlans, PlanType } from "../../../entities/sys/Utils"
import stream from "mithril/stream"
import type { LoginController } from "../api/main/LoginController"
import { locator } from "../api/main/CommonLocator"
import { SelectedSubscriptionOptions, UpgradePriceType } from "./FeatureListProvider"
import type { PlanSelectionModel } from "./PlanSelectionModel"
import type { PaymentDetailsModel } from "./PaymentDetailsModel"
import type { OrderConfirmationModel } from "./OrderConfirmationModel"
import { SimplifiedCreditCardViewModel } from "./SimplifiedCreditCardInputModel"
import type { InvoiceData } from "./utils/PaymentUtils"
import { Country, getByAbbreviation } from "../gui/CountryList"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter"
import { lang, Translation } from "../../../ui/utils/LanguageViewModel"
import { isPersonalPlanAvailable } from "./utils/PlanSelectorUtils"
import { asPaymentInterval, OfferPrice, PriceAndConfigProvider } from "./utils/PriceUtils"
import { getDefaultPaymentMethod, getPaymentMethodType, PaymentData, UpgradeType } from "./utils/SubscriptionUtils"
import { SignupFlowUsageTestController } from "./usagetest/UpgradeSubscriptionWizardUsageTestUtils"

export class UpgradeViewModel implements PlanSelectionModel, PaymentDetailsModel, OrderConfirmationModel {
	readonly upgradeType = UpgradeType.Initial
	readonly personalPlansAvailable: boolean
	readonly options: SelectedSubscriptionOptions
	readonly globalCampaignName: string | null
	readonly bonusMonthForYearlyPlans: number
	readonly firstMonthForFreeOfferActive: boolean
	readonly ccViewModel = new SimplifiedCreditCardViewModel(lang)
	invoiceData: InvoiceData
	paymentData: PaymentData
	price: OfferPrice | null = null
	nextYearPrice: OfferPrice | null = null
	targetPlanType = SignupFlowUsageTestController.getUsageTestVariant() === 1 ? PlanType.Revolutionary : PlanType.Legend

	static async create(logins: LoginController, acceptedPlans: readonly AvailablePlanType[] = NewPaidPlans, msg?: Translation): Promise<UpgradeViewModel> {
		SignupFlowUsageTestController.invalidateUsageTest()
		const userController = logins.getUserController()
		const [customer, accountingInfo, currentPlan, planPrices] = await Promise.all([
			userController.reloadCustomer(),
			userController.loadAccountingInfo(),
			userController.getPlanType(),
			PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null),
		])
		return new UpgradeViewModel(planPrices, accountingInfo, currentPlan, customer, acceptedPlans, msg)
	}

	constructor(
		public readonly planPrices: PriceAndConfigProvider,
		public accountingInfo: AccountingInfo,
		public readonly currentPlan: PlanType,
		public readonly customer: Customer,
		public readonly acceptedPlans: readonly AvailablePlanType[] = NewPaidPlans,
		public readonly messageBoxMessage?: Translation,
	) {
		const prices = planPrices.getRawPricingData()
		this.personalPlansAvailable = isPersonalPlanAvailable(acceptedPlans)
		this.options = {
			businessUse: stream(!this.personalPlansAvailable || prices.business),
			paymentInterval: stream(asPaymentInterval(accountingInfo.paymentInterval)),
		}
		this.globalCampaignName = prices.globalCampaignName
		const bonusMonths = filterInt(prices.bonusMonthsForYearlyPlan)
		this.bonusMonthForYearlyPlans = Number.isNaN(bonusMonths) ? 0 : bonusMonths
		this.firstMonthForFreeOfferActive = prices.firstMonthForFreeForYearlyPlan
		this.invoiceData = {
			invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
			country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
			vatNumber: accountingInfo.invoiceVatIdNo,
		}
		this.paymentData = { paymentMethod: getPaymentMethodType(accountingInfo) ?? getDefaultPaymentMethod(), creditCardData: null }
	}

	updatePrice(): void {
		this.price = this.planPrices.getSubscriptionPriceWithCurrency(this.options.paymentInterval(), UpgradePriceType.PlanActualPrice, this.targetPlanType)
		const nextYear = this.planPrices.getSubscriptionPriceWithCurrency(
			this.options.paymentInterval(),
			UpgradePriceType.PlanNextYearsPrice,
			this.targetPlanType,
		)
		this.nextYearPrice = this.price.rawPrice !== nextYear.rawPrice ? nextYear : null
	}

	updateInvoiceCountry(country: Country): void {
		this.invoiceData.country = country
		this.accountingInfo.paypalBillingAgreement = null
	}
}
