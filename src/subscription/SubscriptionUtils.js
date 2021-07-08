//@flow
import m from "mithril"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {BookingItemFeatureTypeEnum} from "../api/common/TutanotaConstants"
import {AccountType, BookingItemFeatureType, Const, FeatureType} from "../api/common/TutanotaConstants"
import {getCurrentCount} from "./PriceUtils"
import {PreconditionFailedError} from "../api/common/error/RestError"
import type {PlanPrices} from "../api/entities/sys/PlanPrices"
import type {Customer} from "../api/entities/sys/Customer"
import type {CustomerInfo} from "../api/entities/sys/CustomerInfo"
import type {Booking} from "../api/entities/sys/Booking"
import {createBookingServiceData} from "../api/entities/sys/BookingServiceData"
import {serviceRequestVoid} from "../api/main/Entity"
import {SysService} from "../api/entities/sys/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {Dialog} from "../gui/base/Dialog"
import type {DialogHeaderBarAttrs} from "../gui/base/DialogHeaderBar"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import {ButtonType} from "../gui/base/ButtonN"
import {ProgrammingError} from "../api/common/error/ProgrammingError"

export type SubscriptionOptions = {
	businessUse: Stream<boolean>,
	paymentInterval: Stream<number>
}

export const SubscriptionType = Object.freeze({
	Free: 'Free',
	Premium: 'Premium',
	PremiumBusiness: 'PremiumBusiness',
	Teams: 'Teams',
	TeamsBusiness: 'TeamsBusiness',
	Pro: 'Pro'
})
export type SubscriptionTypeEnum = $Values<typeof SubscriptionType>;

export const UpgradeType = {
	Signup: 'Signup', // during signup
	Initial: 'Initial', // when logged in into Free account
	Switch: 'Switch' // switching in paid account
}
export type UpgradeTypeEnum = $Values<typeof UpgradeType>;

export type SubscriptionConfig = {|
	nbrOfAliases: number,
	orderNbrOfAliases: number,
	storageGb: number,
	orderStorageGb: number,
	sharing: boolean,
	business: boolean,
	whitelabel: boolean,
|}

export const subscriptions: {[SubscriptionTypeEnum]: SubscriptionConfig} = {}
subscriptions[SubscriptionType.Free] = {
	nbrOfAliases: 0,
	orderNbrOfAliases: 0,
	storageGb: 1,
	orderStorageGb: 0,
	sharing: false,
	business: false,
	whitelabel: false
}
subscriptions[SubscriptionType.Premium] = {
	nbrOfAliases: 5,
	orderNbrOfAliases: 0,
	storageGb: 1,
	orderStorageGb: 0,
	sharing: false,
	business: false,
	whitelabel: false
}
subscriptions[SubscriptionType.PremiumBusiness] = {
	nbrOfAliases: 5,
	orderNbrOfAliases: 0,
	storageGb: 1,
	orderStorageGb: 0,
	sharing: false,
	business: true,
	whitelabel: false
}
subscriptions[SubscriptionType.Teams] = {
	nbrOfAliases: 5,
	orderNbrOfAliases: 0,
	storageGb: 10,
	orderStorageGb: 10,
	sharing: true,
	business: false,
	whitelabel: false
}
subscriptions[SubscriptionType.TeamsBusiness] = {
	nbrOfAliases: 5,
	orderNbrOfAliases: 0,
	storageGb: 10,
	orderStorageGb: 10,
	sharing: true,
	business: true,
	whitelabel: false
}
subscriptions[SubscriptionType.Pro] = {
	nbrOfAliases: 20,
	orderNbrOfAliases: 20,
	storageGb: 10,
	orderStorageGb: 10,
	sharing: true,
	business: true,
	whitelabel: true
}

const descendingSubscriptionOrder = [
	SubscriptionType.Pro,
	SubscriptionType.TeamsBusiness,
	SubscriptionType.Teams,
	SubscriptionType.PremiumBusiness,
	SubscriptionType.Premium,
]

/**
 * Returns true if the targetSubscription plan is considered to be a lower (~ cheaper) subscription plan
 * Is based on the order of business and non-business subscriptions as defined in descendingSubscriptionOrder
 */
export function isDowngrade(targetSubscription: SubscriptionTypeEnum, currentSubscription: SubscriptionTypeEnum): boolean {
	return descendingSubscriptionOrder.indexOf(targetSubscription) > descendingSubscriptionOrder.indexOf(currentSubscription)
}

export type SubscriptionActionButtons = {|
	Free: MComponent<mixed>,
	Premium: MComponent<mixed>,
	PremiumBusiness: MComponent<mixed>,
	Teams: MComponent<mixed>,
	TeamsBusiness: MComponent<mixed>,
	Pro: MComponent<mixed>,
|}

export function getActionButtonBySubscription(actionButtons: SubscriptionActionButtons, subscription: SubscriptionTypeEnum): MComponent<mixed> {
	switch (subscription) {
		case SubscriptionType.Free:
			return actionButtons.Free
		case SubscriptionType.Premium:
			return actionButtons.Premium
		case SubscriptionType.PremiumBusiness:
			return actionButtons.PremiumBusiness
		case SubscriptionType.Teams:
			return actionButtons.Teams
		case SubscriptionType.TeamsBusiness:
			return actionButtons.TeamsBusiness
		case SubscriptionType.Pro:
			return actionButtons.Pro
		default:
			throw new ProgrammingError("Plan is not valid")
	}
}

export type SubscriptionPlanPrices = {|
	Premium: PlanPrices,
	PremiumBusiness: PlanPrices,
	Teams: PlanPrices,
	TeamsBusiness: PlanPrices,
	Pro: PlanPrices,
|}

export type SubscriptionData = {
	options: SubscriptionOptions,
	planPrices: SubscriptionPlanPrices
}

export const UpgradePriceType = Object.freeze({
	PlanReferencePrice: "0",
	PlanActualPrice: "1",
	PlanNextYearsPrice: "2",
	AdditionalUserPrice: "3",
	ContactFormPrice: "4",
})
export type UpgradePriceTypeEnum = $Values<typeof UpgradePriceType>;

export function getPlanPrices(prices: SubscriptionPlanPrices, subscription: SubscriptionTypeEnum,): ?PlanPrices {
	switch (subscription) {
		case SubscriptionType.Free:
			return null
		case SubscriptionType.Premium:
			return prices.Premium
		case SubscriptionType.PremiumBusiness:
			return prices.PremiumBusiness
		case SubscriptionType.Teams:
			return prices.Teams
		case SubscriptionType.TeamsBusiness:
			return prices.TeamsBusiness
		case SubscriptionType.Pro:
			return prices.Pro
		default:
			throw new ProgrammingError("Plan is not valid")
	}
}

/**
 * @returns the corresponding subscription for business customer (Premium -> PremiumBusiness etc.)
 */
export function getBusinessUsageSubscriptionType(subscription: SubscriptionTypeEnum): SubscriptionTypeEnum {
	switch (subscription) {
		case SubscriptionType.Free:
			throw new ProgrammingError("there is no business counterpart for free")
		case SubscriptionType.Premium:
			return SubscriptionType.PremiumBusiness
		case SubscriptionType.Teams:
			return SubscriptionType.TeamsBusiness
		default:
			return subscription
	}
}

/**
 * @returns {string|SubscriptionTypeEnum} the name to show to the user for the current subscription (PremiumBusiness -> Premium etc.)
 */
export function getDisplayNameOfSubscriptionType(subscription: SubscriptionTypeEnum): string {
	switch (subscription) {
		case SubscriptionType.PremiumBusiness:
			return SubscriptionType.Premium
		case SubscriptionType.TeamsBusiness:
			return SubscriptionType.Teams
		default:
			return subscription
	}
}

/**
 * Returns the available storage capacity for the customer in GB
 */
export function getTotalStorageCapacity(customer: Customer, customerInfo: CustomerInfo, lastBooking: ?Booking): number {
	let freeStorageCapacity = getIncludedStorageCapacity(customerInfo)
	if (customer.type === AccountType.PREMIUM) {
		return Math.max(freeStorageCapacity, getCurrentCount(BookingItemFeatureType.Storage, lastBooking))
	} else {
		return freeStorageCapacity
	}
}

export function getIncludedStorageCapacity(customerInfo: CustomerInfo): number {
	return Math.max(Number(customerInfo.includedStorageCapacity), Number(customerInfo.promotionStorageCapacity))
}

export function getTotalAliases(customer: Customer, customerInfo: CustomerInfo, lastBooking: ?Booking): number {
	let freeAliases = getIncludedAliases(customerInfo)
	if (customer.type === AccountType.PREMIUM) {
		return Math.max(freeAliases, getCurrentCount(BookingItemFeatureType.Alias, lastBooking))
	} else {
		return freeAliases
	}
}

export function getNbrOfUsers(lastBooking: ?Booking): number {
	return getCurrentCount(BookingItemFeatureType.Users, lastBooking)
}

export function getNbrOfContactForms(lastBooking: ?Booking): number {
	return getCurrentCount(BookingItemFeatureType.ContactForm, lastBooking)
}

export function isWhitelabelActive(lastBooking: ?Booking): boolean {
	return getCurrentCount(BookingItemFeatureType.Whitelabel, lastBooking) !== 0
}

export function isSharingActive(lastBooking: ?Booking): boolean {
	return getCurrentCount(BookingItemFeatureType.Sharing, lastBooking) !== 0
}

export function isBusinessFeatureActive(lastBooking: ?Booking): boolean {
	return getCurrentCount(BookingItemFeatureType.Business, lastBooking) !== 0
}

export function getIncludedAliases(customerInfo: CustomerInfo): number {
	return Math.max(Number(customerInfo.includedEmailAliases), Number(customerInfo.promotionEmailAliases))
}

export function isBusinessSubscription(subscription: SubscriptionTypeEnum): boolean {
	switch (subscription) {
		case SubscriptionType.PremiumBusiness:
		case SubscriptionType.TeamsBusiness:
		case SubscriptionType.Pro:
			return true
		default:
			return false
	}
}

export function getSubscriptionType(lastBooking: ?Booking, customer: Customer, customerInfo: CustomerInfo): SubscriptionTypeEnum {
	if (customer.type !== AccountType.PREMIUM) {
		return SubscriptionType.Free
	}
	const currentSubscription = {
		nbrOfAliases: getTotalAliases(customer, customerInfo, lastBooking),
		orderNbrOfAliases: getTotalAliases(customer, customerInfo, lastBooking), // dummy value
		storageGb: getTotalStorageCapacity(customer, customerInfo, lastBooking),
		orderStorageGb: getTotalStorageCapacity(customer, customerInfo, lastBooking), // dummy value
		sharing: isSharingActive(lastBooking),
		business: isBusinessFeatureActive(lastBooking),
		whitelabel: isWhitelabelActive(lastBooking),
	}
	const foundPlan = descendingSubscriptionOrder.find((plan) => hasAllFeaturesInPlan(currentSubscription, subscriptions[plan]))
	return foundPlan || SubscriptionType.Premium
}

export function hasAllFeaturesInPlan(currentSubscription: SubscriptionConfig, planSubscription: SubscriptionConfig): boolean {
	return !(currentSubscription.nbrOfAliases < planSubscription.nbrOfAliases
		|| currentSubscription.storageGb < planSubscription.storageGb
		|| !currentSubscription.sharing && planSubscription.sharing
		|| !currentSubscription.whitelabel && planSubscription.whitelabel
		|| !currentSubscription.business && planSubscription.business);
}

export function getPreconditionFailedPaymentMsg(data: ?string): TranslationKey {
	switch (data) {
		case "paypal.change":
			return "payChangeError_msg"
		case "paypal.confirm_again":
			return "payPaypalConfirmAgainError_msg"
		case "paypal.other_source":
			return "payPaypalChangeSourceError_msg"
		case "card.contact_bank":
			return "payCardContactBankError_msg"
		case "card.insufficient_funds":
			return "payCardInsufficientFundsError_msg"
		case "card.expired_card":
			return "payCardExpiredError_msg"
		case "card.change":
			return "payChangeError_msg"
		case "card.3ds2_needed":
			return "creditCardPaymentErrorVerificationNeeded_msg"
		case "card.3ds2_pending":
			return "creditCardPendingVerification_msg"
		case "card.3ds2_failed":
			return "creditCardVerificationFailed_msg"
		case "card.cvv_invalid":
			return "creditCardCVVInvalid_msg"
		case "card.number_invalid":
			return "creditCardNumberInvalid_msg"
		case "card.date_invalid":
			return "creditCardExprationDateInvalid_msg"
		default:
			return "payContactUsError_msg"
	}
}


const BookingFailureReason = Object.freeze({
	TOO_MANY_DOMAINS: "bookingservice.too_many_domains",
	BUSINESS_USE: "bookingservice.business_use",
	TOO_MANY_ALIASES: "bookingservice.too_many_aliases",
	TOO_MUCH_STORAGE_USED: "bookingservice.too_much_storage_used",
	SHARED_GROUP_ACTIVE: "bookingservice.shared_group_active",
	WHITELABEL_DOMAIN_ACTIVE: "bookingservice.whitelabel_domain_active",
	BALANCE_INSUFFICIENT: "balance.insufficient",
	HAS_TEMPLATE_GROUP: "bookingservice.has_template_group",
})
export type BookingFailureReasonEnum = $Values<typeof BookingFailureReason>


/**
 * @returns True if it failed, false otherwise
 */
export function bookItem(featureType: BookingItemFeatureTypeEnum, amount: number): Promise<boolean> {
	const bookingData = createBookingServiceData({
		amount: amount.toString(),
		featureType,
		date: Const.CURRENT_DATE
	})
	return serviceRequestVoid(SysService.BookingService, HttpMethod.POST, bookingData)
		.return(false)
		.catch(PreconditionFailedError, error => {
			// error handling for cancelling a feature.
			switch (error.data) {
				case BookingFailureReason.BALANCE_INSUFFICIENT:
					return Dialog.error("insufficientBalanceError_msg").return(true)
				case BookingFailureReason.TOO_MANY_DOMAINS:
					return Dialog.error("tooManyCustomDomains_msg").return(true)
				case BookingFailureReason.BUSINESS_USE:
					return Dialog.error("featureRequiredForBusinessUse_msg").return(true)
				case BookingFailureReason.HAS_TEMPLATE_GROUP:
					return Dialog.error("deleteTemplateGroups_msg").return(true)
				default:
					return Dialog.error(getBookingItemErrorMsg(featureType)).return(true)
			}
		})
}

export function buyAliases(amount: number): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Alias, amount)
}

export function buyStorage(amount: number): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Storage, amount);
}

/**
 * @returns True if it failed, false otherwise
 */
export function buyWhitelabel(enable: boolean): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Whitelabel, enable ? 1 : 0)
}

/**
 * @returns True if it failed, false otherwise
 */
export function buySharing(enable: boolean): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Sharing, enable ? 1 : 0)
}

/**
 * @returns True if it failed, false otherwise
 */
export function buyBusiness(enable: boolean): Promise<boolean> {
	return bookItem(BookingItemFeatureType.Business, enable ? 1 : 0)
}

export function showServiceTerms(section: "terms" | "privacy" | "giftCards") {
	import("./terms.js")
		.then(terms => {
			let dialog: Dialog
			let visibleLang = lang.code.startsWith("de") ? "de" : "en"
			let sanitizedTerms: string
			let headerBarAttrs: DialogHeaderBarAttrs = {
				left: [
					{
						label: () => "EN/DE",
						click: () => {
							visibleLang = visibleLang === "de" ? "en" : "de"
							sanitizedTerms = htmlSanitizer.sanitize(terms[section + "_" + visibleLang], {blockExternalContent: false}).text
							m.redraw()
						},
						type: ButtonType.Secondary
					}
				],
				right: [{label: 'ok_action', click: () => dialog.close(), type: ButtonType.Primary}]
			}

			sanitizedTerms = htmlSanitizer.sanitize(terms[section + "_" + visibleLang], {blockExternalContent: false}).text
			dialog = Dialog.largeDialog(headerBarAttrs, {
				view: () => m(".text-break", m.trust(sanitizedTerms))
			}).show()
		})
}

function getBookingItemErrorMsg(feature: BookingItemFeatureTypeEnum): TranslationKey {
	switch (feature) {
		case BookingItemFeatureType.Alias:
			return "emailAliasesTooManyActivatedForBooking_msg"
		case BookingItemFeatureType.Storage:
			return "storageCapacityTooManyUsedForBooking_msg"
		case BookingItemFeatureType.Whitelabel:
			return "whitelabelDomainExisting_msg"
		case BookingItemFeatureType.Sharing:
			return "unknownError_msg"
		default:
			return "unknownError_msg"
	}
}

