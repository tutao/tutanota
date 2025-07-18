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
import { UpgradeSubscriptionPage, UpgradeSubscriptionPageAttrs } from "./UpgradeSubscriptionPage"
import m from "mithril"
import stream from "mithril/stream"
import { InfoLink, lang, MaybeTranslation, TranslationKey } from "../misc/LanguageViewModel"
import { createWizardDialog, wizardPageWrapper } from "../gui/base/WizardDialog.js"
import { InvoiceAndPaymentDataPage, InvoiceAndPaymentDataPageAttrs } from "./InvoiceAndPaymentDataPage"
import { UpgradeCongratulationsPage, UpgradeCongratulationsPageAttrs } from "./UpgradeCongratulationsPage.js"
import { SignupPage, SignupPageAttrs } from "./SignupPage"
import { assertMainOrNode, isIOSApp } from "../api/common/Env"
import { locator } from "../api/main/CommonLocator"
import { StorageBehavior } from "../misc/UsageTestModel"
import { FeatureListProvider, SelectedSubscriptionOptions } from "./FeatureListProvider"
import { queryAppStoreSubscriptionOwnership, UpgradeType } from "./SubscriptionUtils"
import { UpgradeConfirmSubscriptionPage } from "./UpgradeConfirmSubscriptionPage.js"
import { asPaymentInterval, PaymentInterval, PriceAndConfigProvider, SubscriptionPrice } from "./PriceUtils"
import { formatNameAndAddress } from "../api/common/utils/CommonFormatter.js"
import { LoginController } from "../api/main/LoginController.js"
import { MobilePaymentSubscriptionOwnership } from "../native/common/generatedipc/MobilePaymentSubscriptionOwnership.js"
import { DialogType } from "../gui/base/Dialog.js"
import { VariantCSubscriptionPage, VariantCSubscriptionPageAttrs } from "./VariantCSubscriptionPage.js"
import { styles } from "../gui/styles.js"
import { stringToSubscriptionType } from "../misc/LoginUtils.js"

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
export type UpgradeSubscriptionData = {
	options: SelectedSubscriptionOptions
	invoiceData: InvoiceData
	paymentData: PaymentData
	type: PlanType
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
	referralCode: string | null
	multipleUsersAllowed: boolean
	acceptedPlans: readonly AvailablePlanType[]
	msg: MaybeTranslation | null
	firstMonthForFreeOfferActive: boolean
}

export async function showUpgradeWizard(
	logins: LoginController,
	acceptedPlans: readonly AvailablePlanType[] = NewPaidPlans,
	msg?: MaybeTranslation,
): Promise<void> {
	const [customer, accountingInfo] = await Promise.all([logins.getUserController().loadCustomer(), logins.getUserController().loadAccountingInfo()])

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(null, locator.serviceExecutor, null)

	const prices = priceDataProvider.getRawPricingData()
	const domainConfig = locator.domainConfigProvider().getCurrentDomainConfig()
	const featureListProvider = await FeatureListProvider.getInitializedInstance(domainConfig)
	const upgradeData: UpgradeSubscriptionData = {
		options: {
			businessUse: stream(prices.business),
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
		type: PlanType.Revolutionary,
		nextYearPrice: null,
		accountingInfo: accountingInfo,
		customer: customer,
		newAccountData: null,
		registrationDataId: null,
		priceInfoTextId: priceDataProvider.getPriceInfoMessage(),
		upgradeType: UpgradeType.Initial,
		// Free used to be always selected here for current plan, but resulted in it displaying "free" as current plan for legacy users
		currentPlan: logins.getUserController().isFreeAccount() ? PlanType.Free : null,
		subscriptionParameters: null,
		planPrices: priceDataProvider,
		featureListProvider: featureListProvider,
		referralCode: null,
		multipleUsersAllowed: false,
		acceptedPlans,
		msg: msg != null ? msg : null,
		firstMonthForFreeOfferActive: prices.firstMonthForFreeForYearlyPlan,
	}

	const wizardPages = [
		wizardPageWrapper(UpgradeSubscriptionPage, new UpgradeSubscriptionPageAttrs(upgradeData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, new InvoiceAndPaymentDataPageAttrs(upgradeData)),
	]
	if (isIOSApp()) {
		wizardPages.splice(1, 1) // do not show this page on AppStore payment since we are only able to show this single payment method on iOS
	}

	const deferred = defer<void>()
	const wizardBuilder = createWizardDialog(
		upgradeData,
		wizardPages,
		async () => {
			deferred.resolve()
		},
		DialogType.EditLarge,
	)
	wizardBuilder.dialog.show()
	return deferred.promise
}

export function getPlanSelectorTest() {
	const test = locator.usageTestController.getTest(`signup.paywall.${styles.isMobileLayout() ? "mobile" : "desktop"}`)
	test.recordTime = true
	return test
}

export function resolvePlanSelectorVariant(variant: number) {
	switch (variant) {
		case 1:
			return "A"
		case 2:
			return "B"
		case 3:
			return "C"
		default:
			throw new Error("Encountered invalid variant. Expected 1, 2 or 3.")
	}
}

export async function loadSignupWizard(
	subscriptionParameters: SubscriptionParameters | null,
	registrationDataId: string | null,
	referralCode: string | null,
	acceptedPlans: readonly AvailablePlanType[] = AvailablePlans,
): Promise<void> {
	const usageTestModel = locator.usageTestModel

	usageTestModel.setStorageBehavior(StorageBehavior.Ephemeral)
	locator.usageTestController.setTests(await usageTestModel.loadActiveUsageTests())

	const priceDataProvider = await PriceAndConfigProvider.getInitializedInstance(registrationDataId, locator.serviceExecutor, referralCode)
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
		type: PlanType.Free,
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
		referralCode,
		multipleUsersAllowed: false,
		acceptedPlans,
		msg: message,
		firstMonthForFreeOfferActive: prices.firstMonthForFreeForYearlyPlan,
	}

	const invoiceAttrs = new InvoiceAndPaymentDataPageAttrs(signupData)
	const plansPage = initPlansPages(signupData)
	const wizardPages = [
		wizardPageWrapper(plansPage.pageClass, plansPage.attrs),
		wizardPageWrapper(SignupPage, new SignupPageAttrs(signupData)),
		wizardPageWrapper(InvoiceAndPaymentDataPage, invoiceAttrs), // this page will login the user after signing up with newaccount data
		wizardPageWrapper(UpgradeConfirmSubscriptionPage, invoiceAttrs), // this page will login the user if they are not login for iOS payment through AppStore
		wizardPageWrapper(UpgradeCongratulationsPage, new UpgradeCongratulationsPageAttrs(signupData)),
	]

	if (isIOSApp()) {
		wizardPages.splice(2, 1) // do not show this page on AppStore payment since we are only able to show this single payment method on iOS
	}

	const wizardBuilder = createWizardDialog(
		signupData,
		wizardPages,
		async () => {
			if (locator.logins.isUserLoggedIn()) {
				// this ensures that all created sessions during signup process are closed
				// either by clicking on `cancel`, closing the window, or confirm on the UpgradeCongratulationsPage
				await locator.logins.logout(false)
			}

			if (signupData.newAccountData) {
				m.route.set("/login", {
					noAutoLogin: true,
					loginWith: signupData.newAccountData.mailAddress,
				})
			} else {
				m.route.set("/login", {
					noAutoLogin: true,
				})
			}
		},
		DialogType.EditLarge,
	)

	// for signup specifically, we only want the invoice and payment page as well as the confirmation page to show up if signing up for a paid account (and the user did not go back to the first page!)
	invoiceAttrs.setEnabledFunction(() => signupData.type !== PlanType.Free && wizardBuilder.attrs.currentPage !== wizardPages[0])

	wizardBuilder.dialog.show()
}

function initPlansPages(signupData: UpgradeSubscriptionData): {
	pageClass: Class<UpgradeSubscriptionPage> | Class<VariantCSubscriptionPage>
	attrs: UpgradeSubscriptionPageAttrs | VariantCSubscriptionPageAttrs
} {
	const pricingData = signupData.planPrices.getRawPricingData()
	const firstYearDiscount = Number(pricingData.legendaryPrices.firstYearDiscount)
	const bonusMonth = Number(pricingData.bonusMonthsForYearlyPlan)
	const hasDiscount =
		pricingData.legendaryPrices.monthlyPrice !== pricingData.legendaryPrices.monthlyReferencePrice ||
		pricingData.revolutionaryPrices.monthlyPrice !== pricingData.revolutionaryPrices.monthlyReferencePrice
	const hasMessage = !!pricingData.messageTextId

	// Any type of discounts other than global first year discount use old subscription page.
	if (!pricingData.hasGlobalFirstYearDiscount && (firstYearDiscount !== 0 || bonusMonth !== 0 || hasDiscount || hasMessage)) {
		return { pageClass: UpgradeSubscriptionPage, attrs: new UpgradeSubscriptionPageAttrs(signupData) }
	} else {
		return { pageClass: VariantCSubscriptionPage, attrs: new VariantCSubscriptionPageAttrs(signupData) }
	}
}
