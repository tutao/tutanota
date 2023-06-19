import type { TranslationKey } from "../misc/LanguageViewModel"
import { AccountType, BookingItemFeatureType, getClientType, PlanType } from "../api/common/TutanotaConstants"
import type { Customer, CustomerInfo, PlanConfiguration } from "../api/entities/sys/TypeRefs.js"
import { Booking, createPaymentDataServiceGetData } from "../api/entities/sys/TypeRefs.js"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { locator } from "../api/main/MainLocator"
import { PaymentDataService } from "../api/entities/sys/Services"

export const enum UpgradeType {
	Signup = "Signup",
	// during signup
	Initial = "Initial",
	// when logged into Free account
	Switch = "Switch", // switching in paid account
}

export function getCurrentCount(featureType: BookingItemFeatureType, booking: Booking | null): number {
	if (booking) {
		let bookingItem = booking.items.find((item) => item.featureType === featureType)
		return bookingItem ? Number(bookingItem.currentCount) : 0
	} else {
		return 0
	}
}

/**
 * Returns the available storage capacity for the customer in GB
 */
export function getTotalStorageCapacityPerCustomer(customer: Customer, customerInfo: CustomerInfo, lastBooking: Booking | null): number {
	let freeStorageCapacity = getIncludedStorageCapacityPerCustomer(customerInfo)

	if (customer.type === AccountType.PREMIUM) {
		return Math.max(freeStorageCapacity, getCurrentCount(BookingItemFeatureType.Storage, lastBooking))
	} else {
		return freeStorageCapacity
	}
}

function getIncludedStorageCapacityPerCustomer(customerInfo: CustomerInfo): number {
	return Math.max(Number(customerInfo.includedStorageCapacity), Number(customerInfo.promotionStorageCapacity))
}

export function isWhitelabelActive(lastBooking: Booking | null, planConfig: PlanConfiguration): boolean {
	return getCurrentCount(BookingItemFeatureType.Whitelabel, lastBooking) !== 0 || planConfig.whitelabel
}

export function isSharingActive(lastBooking: Booking | null, planConfig: PlanConfiguration): boolean {
	return getCurrentCount(BookingItemFeatureType.Sharing, lastBooking) !== 0 || planConfig.sharing
}

export function isBusinessFeatureActive(lastBooking: Booking | null, planConfig: PlanConfiguration): boolean {
	return getCurrentCount(BookingItemFeatureType.Business, lastBooking) !== 0 || planConfig.business
}

export type PaymentErrorCode =
	| "paypal.change"
	| "paypal.confirm_again"
	| "paypal.other_source"
	| "card.contact_bank"
	| "card.insufficient_funds"
	| "card.expired_card"
	| "card.change"
	| "card.3ds2_needed"
	| "card.3ds2_pending"
	| "card.3ds2_failed"
	| "card.cvv_invalid"
	| "card.number_invalid"
	| "card.date_invalid"

export function getPreconditionFailedPaymentMsg(data: string | null): TranslationKey {
	// the type is mostly there to keep multiple locations that switch over these in sync
	switch (data as PaymentErrorCode) {
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

export function getLazyLoadedPayPalUrl(): LazyLoaded<string> {
	return new LazyLoaded(() => {
		const clientType = getClientType()
		return locator.serviceExecutor
			.get(
				PaymentDataService,
				createPaymentDataServiceGetData({
					clientType,
				}),
			)
			.then((result) => {
				return result.loginUrl
			})
	})
}

/**
 * only to be invoked for PlanTypes where isNewPlan returns true
 */
export function toFeatureType(type: PlanType): BookingItemFeatureType {
	switch (type) {
		case PlanType.Revolutionary:
			return BookingItemFeatureType.Revolutionary
		case PlanType.Legend:
			return BookingItemFeatureType.Legend
		case PlanType.Essential:
			return BookingItemFeatureType.Essential
		case PlanType.Advanced:
			return BookingItemFeatureType.Advanced
		case PlanType.Unlimited:
			return BookingItemFeatureType.Unlimited
		case PlanType.Premium:
			return BookingItemFeatureType.LegacyUsers
		default:
			throw new Error(`can't convert ${type} to BookingItemFeatureType`)
	}
}
