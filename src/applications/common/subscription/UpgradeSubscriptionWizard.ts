import { defer } from "@tutao/utils"
import { assertMainOrNode, InvoiceData, isIOSApp, UpgradePromptType } from "@tutao/app-env"
import stream from "mithril/stream"
import { Translation, TranslationKey } from "../../../ui/utils/LanguageViewModel"
import { createWizardDialog, wizardPageWrapper } from "../../../ui/base/WizardDialog.js"
import { InvoiceAndPaymentDataPage, InvoiceAndPaymentDataPageAttrs } from "./InvoiceAndPaymentDataPage"
import { locator } from "../api/main/CommonLocator"
import { FeatureListProvider, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { getDefaultPaymentMethod, getPaymentMethodType, PaymentData, UpgradePromptTypeByName, UpgradeType } from "./utils/SubscriptionUtils"
import { UpgradeConfirmSubscriptionPage, UpgradeConfirmSubscriptionPageAttrs } from "./UpgradeConfirmSubscriptionPage.js"
import { asPaymentInterval, PriceAndConfigProvider, SubscriptionPrice } from "./utils/PriceUtils"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter.js"
import { LoginController } from "../api/main/LoginController.js"
import { Dialog, DialogType } from "../../../ui/base/Dialog.js"
import { SubscriptionPage, SubscriptionPageAttrs } from "./SubscriptionPage.js"
import { styles } from "../../../ui/styles.js"
import { SignupFlowUsageTestController } from "./usagetest/UpgradeSubscriptionWizardUsageTestUtils.js"
import { isPersonalPlanAvailable } from "./utils/PlanSelectorUtils"
import { PowSolution } from "../api/common/pow-worker"
import { windowFacade } from "../misc/WindowFacade"
import type { UsageTest } from "@tutao/usagetests"
import { AccountingInfo, Customer } from "@tutao/entities/sys"
import { AvailablePlanType, NewPaidPlans, PlanType } from "../../../entities/sys/Utils"
import { getByAbbreviation } from "../gui/CountryList"

import { isFreeSignupOnly } from "../misc/LoginUtils"

assertMainOrNode()
export type SubscriptionParameters = {
	subscription: string | null
	type: string | null
	interval: string | null // typed as string because m.parseQueryString returns an object with strings
}

export type NewAccountData = {
	mailAddress: string
	recoverCode: Hex
	password: string
}
export type ReferralData = { code: string; isCalledBySatisfactionDialog: boolean }

export type UpgradeSubscriptionData = {
	options: SelectedSubscriptionOptions
	invoiceData: InvoiceData
	paymentData: PaymentData
	targetPlanType: PlanType
	price: SubscriptionPrice | null
	nextYearPrice: SubscriptionPrice | null
	accountingInfo: AccountingInfo | null
	// not initially set for signup but loaded in InvoiceAndPaymentDataPage
	customer: Customer | null
	// not initially set for signup but loaded in InvoiceAndPaymentDataPage
	newAccountData: NewAccountData | null
	registrationDataId: string | null
	priceInfoTextId: TranslationKey | null
	upgradeType: UpgradeType
	planPrices: PriceAndConfigProvider
	currentPlan: PlanType | null
	subscriptionParameters: SubscriptionParameters | null
	featureListProvider: FeatureListProvider
	referralData: null | ReferralData
	multipleUsersAllowed: boolean
	acceptedPlans: readonly AvailablePlanType[]
	msg: Translation | null
	firstMonthForFreeOfferActive: boolean
	isCalledBySatisfactionDialog: boolean
	registrationCode?: string
	powChallengeSolutionPromise?: Promise<PowSolution>
	emailInputStore?: string
	passwordInputStore?: string
	upgradeUsageTest: UsageTest | null
	upgradePromptType: UpgradePromptType | null
}

export async function showUpgradeWizard({
	upgradePromptType,
	logins,
	isCalledBySatisfactionDialog = false,
	acceptedPlans = NewPaidPlans,
	msg,
}: {
	upgradePromptType: UpgradePromptType | null
	logins: LoginController
	isCalledBySatisfactionDialog?: boolean
	acceptedPlans?: readonly AvailablePlanType[]
	msg?: Translation
}): Promise<void> {
	/* Temporarely restricting to free only to get accepted by Google Play Store */
	if (isFreeSignupOnly()) {
		Dialog.message("notAvailableInApp_msg")
		return
	}

	SignupFlowUsageTestController.invalidateUsageTest() // Invalidates the "signup.flow" usage test, because upgrades and signups should not be mixed in this usage test.

	let upgradeUsageTest: UsageTest | null = null
	if (logins.getUserController().isFreeAccount() && upgradePromptType != null) {
		upgradeUsageTest = locator.usageTestController.getTest("upgrade.paywall.upgradePaywallTypeAndResult")

		const stage = upgradeUsageTest.getStage(0)
		stage.setMetric({
			name: "upgradePromptType",
			value: UpgradePromptTypeByName[upgradePromptType],
		})
		await stage.complete()
	}

	const [customer, accountingInfo] = await Promise.all([logins.getUserController().reloadCustomer(), logins.getUserController().loadAccountingInfo()])

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)

	const prices = priceDataProvider.getRawPricingData()
	const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig()
	const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig)
	const upgradeData: UpgradeSubscriptionData = {
		options: {
			businessUse: stream(!isPersonalPlanAvailable(acceptedPlans) ? true : prices.business),
			paymentInterval: stream(asPaymentInterval(accountingInfo.paymentInterval)),
		},
		invoiceData: {
			invoiceAddress: formatNameAndAddress(accountingInfo.invoiceName, accountingInfo.invoiceAddress),
			country: accountingInfo.invoiceCountry ? getByAbbreviation(accountingInfo.invoiceCountry) : null,
			vatNumber: accountingInfo.invoiceVatIdNo, // only for EU countries otherwise empty
		},
		paymentData: {
			paymentMethod: getPaymentMethodType(accountingInfo) || (await getDefaultPaymentMethod()),
			creditCardData: null,
		},
		price: null,
		targetPlanType: SignupFlowUsageTestController.getUsageTestVariant() === 1 ? PlanType.Revolutionary : PlanType.Legend,
		nextYearPrice: null,
		accountingInfo: accountingInfo,
		customer: customer,
		newAccountData: null,
		registrationDataId: null,
		priceInfoTextId: priceDataProvider.getPriceInfoMessage(),
		upgradeType: UpgradeType.Initial,
		currentPlan: await logins.getUserController().getPlanType(),
		subscriptionParameters: null,
		planPrices: priceDataProvider,
		featureListProvider: featureListProvider,
		referralData: null,
		multipleUsersAllowed: false,
		acceptedPlans,
		msg: msg ?? null,
		firstMonthForFreeOfferActive: prices.firstMonthForFreeForYearlyPlan,
		isCalledBySatisfactionDialog,
		upgradeUsageTest,
		upgradePromptType,
	}

	let { pageClass: planPageClass, attrs: planPageAttrs } = { pageClass: SubscriptionPage, attrs: new SubscriptionPageAttrs(upgradeData) }
	const wizardPages = [
		wizardPageWrapper(planPageClass, planPageAttrs),
		wizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, new UpgradeConfirmSubscriptionPageAttrs(upgradeData)),
	]
	if (isIOSApp()) {
		wizardPages.splice(1, 1) // do not show this page on AppStore payment since we are only able to show this single payment method on iOS
	}

	const deferred = defer<void>()
	const wizardBuilder = createWizardDialog({
		data: upgradeData,
		pages: wizardPages,
		closeAction: async () => {
			deferred.resolve()
		},
		dialogType: DialogType.EditLarge,
		windowFacade,
	})
	wizardBuilder.dialog.show()
	return deferred.promise
}

export function getPlanSelectorTest() {
	const test = locator.usageTestController.getTest(`signup.paywall.${styles.isMobileLayout() ? "mobile" : "desktop"}`)
	test.recordTime = true
	return test
}
