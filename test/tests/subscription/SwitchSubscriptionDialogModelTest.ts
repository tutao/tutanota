import type { Booking, PriceData, PriceServiceReturn } from "../../../src/api/entities/sys/TypeRefs.js"
import {
	createAccountingInfo,
	createBooking,
	createBookingItem,
	createCustomer,
	createCustomerInfo,
	createPriceData,
	createPriceItemData,
	createPriceServiceReturn,
} from "../../../src/api/entities/sys/TypeRefs.js"
import { AccountType, BookingItemFeatureType, PlanName } from "../../../src/api/common/TutanotaConstants.js"
import { downcast } from "@tutao/tutanota-utils"
import { BookingFacade } from "../../../src/api/worker/facades/lazy/BookingFacade.js"
import { SubscriptionConfig } from "../../../src/subscription/FeatureListProvider"
import { getCurrentCount } from "../../../src/subscription/SubscriptionUtils.js"

const SUBSCRIPTION_CONFIG = {
	Free: {
		nbrOfAliases: 0,
		orderNbrOfAliases: 0,
		storageGb: 1,
		orderStorageGb: 0,
		sharing: false,
		business: false,
		whitelabel: false,
	},
	Premium: {
		nbrOfAliases: 5,
		orderNbrOfAliases: 0,
		storageGb: 1,
		orderStorageGb: 0,
		sharing: false,
		business: false,
		whitelabel: false,
	},
	PremiumBusiness: {
		nbrOfAliases: 5,
		orderNbrOfAliases: 0,
		storageGb: 1,
		orderStorageGb: 0,
		sharing: false,
		business: true,
		whitelabel: false,
	},
	Teams: {
		nbrOfAliases: 5,
		orderNbrOfAliases: 0,
		storageGb: 10,
		orderStorageGb: 10,
		sharing: true,
		business: false,
		whitelabel: false,
	},
	TeamsBusiness: {
		nbrOfAliases: 5,
		orderNbrOfAliases: 0,
		storageGb: 10,
		orderStorageGb: 10,
		sharing: true,
		business: true,
		whitelabel: false,
	},
	Pro: {
		nbrOfAliases: 20,
		orderNbrOfAliases: 20,
		storageGb: 10,
		orderStorageGb: 10,
		sharing: true,
		business: true,
		whitelabel: true,
	},
	Revolutionary: {
		nbrOfAliases: 15,
		orderNbrOfAliases: 0,
		storageGb: 20,
		orderStorageGb: 0,
		sharing: true,
		business: false,
		whitelabel: false,
	},
	Legend: {
		nbrOfAliases: 30,
		orderNbrOfAliases: 0,
		storageGb: 500,
		orderStorageGb: 0,
		sharing: true,
		business: false,
		whitelabel: false,
	},
	Essential: {
		nbrOfAliases: 15,
		orderNbrOfAliases: 0,
		storageGb: 50,
		orderStorageGb: 0,
		sharing: true,
		business: true,
		whitelabel: false,
	},
	Advanced: {
		nbrOfAliases: 30,
		orderNbrOfAliases: 0,
		storageGb: 500,
		orderStorageGb: 0,
		sharing: true,
		business: true,
		whitelabel: false,
	},
	Unlimited: {
		nbrOfAliases: 30,
		orderNbrOfAliases: 0,
		storageGb: 1000,
		orderStorageGb: 0,
		sharing: true,
		business: true,
		whitelabel: true,
	},
} as { [K in PlanName]: SubscriptionConfig }

function createPremiumCustomerInstances() {
	const customer = createCustomer({
		businessUse: false,
		type: AccountType.PREMIUM,
	})
	const customerInfo = createCustomerInfo({
		includedEmailAliases: "5",
		includedStorageCapacity: "1",
	})
	const accountingInfo = createAccountingInfo({
		paymentInterval: "12",
	})
	const lastBooking = createBooking({ paymentInterval: "1" })

	// always create user booking
	lastBooking.items.push(
		createBookingItem({
			featureType: BookingItemFeatureType.LegacyUsers,
			currentCount: "1",
			maxCount: "1",
			price: "1.20",
		}),
	)
	return { customer, customerInfo, accountingInfo, lastBooking }
}

function createbookingMock(lastBooking: Booking): BookingFacade {
	return downcast({
		getPrice(type: BookingItemFeatureType, count: number, reactivate: boolean): Promise<PriceServiceReturn> {
			const currentPriceData = getPriceData(lastBooking)
			const futureBooking = JSON.parse(JSON.stringify(lastBooking))
			setBookingItem(futureBooking, type, count)
			const futurePriceData = getPriceData(futureBooking)
			return Promise.resolve(
				createPriceServiceReturn({
					currentPriceNextPeriod: currentPriceData,
					currentPriceThisPeriod: currentPriceData,
					futurePriceNextPeriod: futurePriceData,
				}),
			)
		},
	})
}

function setBookingItem(booking: Booking, featureType: BookingItemFeatureType, count: number) {
	const featureItem = booking.items.find((item) => item.featureType === featureType)

	if (featureItem) {
		featureItem.currentCount = String(count)
		featureItem.maxCount = String(count)
		featureItem.price = getFeatureTypePrice(featureType, count)
	} else {
		booking.items.push(
			createBookingItem({
				featureType: featureType,
				currentCount: String(count),
				maxCount: String(count),
				price: getFeatureTypePrice(featureType, count),
			}),
		)
	}
}

function getPriceData(booking: Booking): PriceData {
	const currentTotalPrice = booking.items.reduce((total, item) => {
		const featureType: BookingItemFeatureType = downcast(item.featureType)
		const singleType = isSingleType(featureType)
		const count = Number(item.currentCount)
		const itemPrice = Number(item.price)

		if (count === 0) {
			return total
		} else if (
			featureType === BookingItemFeatureType.Sharing ||
			featureType === BookingItemFeatureType.Business ||
			featureType === BookingItemFeatureType.Whitelabel
		) {
			const userCount = getCurrentCount(BookingItemFeatureType.LegacyUsers, booking)
			return total + itemPrice * userCount
		} else if (singleType) {
			return total + itemPrice * count
		} else {
			// package price
			return total + itemPrice
		}
	}, 0)
	return createPriceData({
		price: String(currentTotalPrice),
		items: booking.items.map((item) => {
			return createPriceItemData({
				count: item.currentCount,
				featureType: item.featureType,
				price: item.price,
				singleType: isSingleType(downcast(item.featureType)),
			})
		}),
		paymentInterval: booking.paymentInterval,
	})
}

function isSingleType(featureType: BookingItemFeatureType): boolean {
	switch (featureType) {
		case BookingItemFeatureType.LegacyUsers:
		case BookingItemFeatureType.Sharing:
		case BookingItemFeatureType.Business:
		case BookingItemFeatureType.Whitelabel:
		case BookingItemFeatureType.ContactForm:
			return true

		case BookingItemFeatureType.Alias:
		case BookingItemFeatureType.Storage:
			return false

		default:
			throw new Error("invalid feature type: " + featureType)
	}
}

function getFeatureTypePrice(featureType: BookingItemFeatureType, count: number): NumberString {
	switch (featureType) {
		case BookingItemFeatureType.LegacyUsers:
			return "1.20"

		case BookingItemFeatureType.Alias:
			if (count === 0) {
				return "0"
			} else if (count === 20) {
				return "1.20"
			} else if (count === 40) {
				return "2.40"
			} else if (count === 100) {
				return "4.80"
			} else {
				throw new Error("invalid alias count: " + count)
			}

		case BookingItemFeatureType.Storage: {
			if (count === 0) {
				return "0"
			} else if (count === 10) {
				return "2.40"
			} else if (count === 100) {
				return "12"
			} else if (count === 1000) {
				return "60"
			} else {
				throw new Error("invalid storage count: " + count)
			}
		}

		case BookingItemFeatureType.Sharing:
			return count === 1 ? "1.20" : "0"

		case BookingItemFeatureType.Business:
			return count === 1 ? "1.20" : "0"

		case BookingItemFeatureType.Whitelabel:
			return count === 1 ? "1.20" : "0"

		case BookingItemFeatureType.ContactForm:
			return "24.0"

		default:
			throw new Error("invalid feature type: " + featureType)
	}
}
