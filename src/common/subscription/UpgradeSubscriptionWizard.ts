import type { Hex } from "@tutao/tutanota-utils"
import { defer } from "@tutao/tutanota-utils"
import { AccountingInfo, Customer } from "../api/entities/sys/TypeRefs.js"
import {
	AvailablePlans,
	AvailablePlanType,
	getDefaultPaymentMethod,
	getPaymentMethodType,
	InvoiceData,
	NewPaidPlans,
	PaymentData,
	PlanType,
	SubscriptionType,
} from "../api/common/TutanotaConstants"
import { getByAbbreviation } from "../api/common/CountryList"
import stream from "mithril/stream"
import { InfoLink, lang, MaybeTranslation, Translation, TranslationKey } from "../misc/LanguageViewModel"
import { createWizardDialog, wizardPageWrapper } from "../gui/base/WizardDialog.js"
import { InvoiceAndPaymentDataPage, InvoiceAndPaymentDataPageAttrs } from "./InvoiceAndPaymentDataPage"
import { UpgradeCongratulationsPage, UpgradeCongratulationsPageAttrs } from "./UpgradeCongratulationsPage.js"
import { SignupPage, SignupPageAttrs } from "./SignupPage"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import { locator } from "../api/main/CommonLocator"
import { StorageBehavior } from "../misc/UsageTestModel"
import { FeatureListProvider, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { queryAppStoreSubscriptionOwnership, UpgradeType } from "./utils/SubscriptionUtils"
import { UpgradeConfirmSubscriptionPage, UpgradeConfirmSubscriptionPageAttrs } from "./UpgradeConfirmSubscriptionPage.js"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider, SubscriptionPrice } from "./utils/PriceUtils"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter.js"
import { LoginController } from "../api/main/LoginController.js"
import { MobilePaymentSubscriptionOwnership } from "../native/common/generatedipc/MobilePaymentSubscriptionOwnership.js"
import { DialogType } from "../gui/base/Dialog.js"
import { SubscriptionPage, SubscriptionPageAttrs } from "./SubscriptionPage.js"
import { styles } from "../gui/styles.js"
import { stringToSubscriptionType } from "../misc/LoginUtils.js"
import { ReferralType, SignupFlowUsageTestController } from "./usagetest/UpgradeSubscriptionWizardUsageTestUtils.js"
import { windowFacade } from "../misc/WindowFacade"
import { isPersonalPlanAvailable } from "./utils/PlanSelectorUtils"

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
}

export async function showUpgradeWizard({
	logins,
	isCalledBySatisfactionDialog = false,
	acceptedPlans = NewPaidPlans,
	msg,
}: {
	logins: LoginController
	isCalledBySatisfactionDialog?: boolean
	acceptedPlans?: readonly AvailablePlanType[]
	msg?: Translation
}): Promise<void> {
	SignupFlowUsageTestController.invalidateUsageTest() // Invalidates the "signup.flow" usage test, because upgrades and signups should not be mixed in this usage test.
	const [customer, accountingInfo] = await Promise.all([logins.getUserController().loadCustomer(), logins.getUserController().loadAccountingInfo()])

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
		targetPlanType: PlanType.Revolutionary,
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
	}

	let { pageClass: planPageClass, attrs: planPageAttrs } = initPlansPages(upgradeData)
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
	})
	wizardBuilder.dialog.show()
	return deferred.promise
}

export function getPlanSelectorTest() {
	const test = locator.usageTestController.getTest(`signup.paywall.${styles.isMobileLayout() ? "mobile" : "desktop"}`)
	test.recordTime = true
	return test
}

export async function loadSignupWizard(
	subscriptionParameters: SubscriptionParameters | null,
	registrationDataId: string | null,
	referralData: null | ReferralData,
	acceptedPlans: readonly AvailablePlanType[] = AvailablePlans,
): Promise<void> {
	const usageTestModel = locator.usageTestModel

	usageTestModel.setStorageBehavior(StorageBehavior.Ephemeral)
	locator.usageTestController.setTests(await usageTestModel.loadActiveUsageTests())

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(registrationDataId, locator.serviceExecutor, referralData?.code ?? null)
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

	const subscriptionType = stringToSubscriptionType(subscriptionParameters?.type ?? "private")
	const paymentInterval = asPaymentInterval(subscriptionParameters?.interval ?? PaymentInterval.Yearly)

	const signupData: UpgradeSubscriptionData = {
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

	const invoiceAttrs = new InvoiceAndPaymentDataPageAttrs(signupData)
	const confirmSubscriptionAttrs = new UpgradeConfirmSubscriptionPageAttrs(signupData)
	const plansPage = initPlansPages(signupData)
	const wizardPages = [
		wizardPageWrapper(plansPage.pageClass, plansPage.attrs),
		wizardPageWrapper(SignupPage, new SignupPageAttrs(signupData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, invoiceAttrs), // this page will login the user after signing up with newaccount data
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, confirmSubscriptionAttrs), // this page will login the user if they are not login for iOS payment through AppStore
		wizardPageWrapper(UpgradeCongratulationsPage, new UpgradeCongratulationsPageAttrs(signupData)),
	]

	if (isIOSApp()) {
		wizardPages.splice(2, 1) // do not show this page on AppStore payment since we are only able to show this single payment method on iOS
	}

	const wizardBuilder = createWizardDialog({
		data: signupData,
		pages: wizardPages,
		closeAction: async () => {
			if (locator.logins.isUserLoggedIn()) {
				// this ensures that all created sessions during signup process are closed
				// either by clicking on `cancel`, closing the window, or confirm on the UpgradeCongratulationsPage
				await locator.logins.logout(false)
			}

			// ensure that we reload the client in order to reset any state of the client that has been set when creating a session during signup.
			if (signupData.newAccountData) {
				await windowFacade.reload({
					noAutoLogin: false,
				})
			}
		},
		dialogType: DialogType.EditLarge,
	})

	// for signup specifically, we only want the invoice and payment page as well as the confirmation page to show up if signing up for a paid account (and the user did not go back to the first page!)
	invoiceAttrs.setEnabledFunction(() => signupData.targetPlanType !== PlanType.Free && wizardBuilder.attrs.currentPage !== wizardPages[0])
	confirmSubscriptionAttrs.setEnabledFunction(() => signupData.targetPlanType !== PlanType.Free && wizardBuilder.attrs.currentPage !== wizardPages[0])

	wizardBuilder.dialog.show()
}

function initPlansPages(signupData: UpgradeSubscriptionData): {
	pageClass: Class<SubscriptionPage>
	attrs: SubscriptionPageAttrs
} {
	let referralConversion: ReferralType = "not_referred"
	if (signupData.referralData && signupData.referralData.isCalledBySatisfactionDialog) referralConversion = "satisfactiondialog_referral"
	else if (signupData.referralData && !signupData.referralData.isCalledBySatisfactionDialog) referralConversion = "organic_referral"
	SignupFlowUsageTestController.initSignupFlowUsageTest(referralConversion)
	return { pageClass: SubscriptionPage, attrs: new SubscriptionPageAttrs(signupData) }
}
