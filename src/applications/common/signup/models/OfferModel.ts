import { ProgrammingError } from "@tutao/app-env"
import { OfferPrice, PaymentInterval } from "../../subscription/utils/PriceUtils"
import { PlanType } from "../../../../entities/sys/Utils"

export type Offer = {
	offerId: string
	paymentInterval: PaymentInterval
	isBusinessPlan: boolean
	planType: PlanType
	thisIntervalPrice: OfferPrice
	nextIntervalPrice: OfferPrice
	bonusMonthsForFirstYear: number
	firstMonthForFree: boolean
}

// contains the prices, plans, campaigns, bonuses and discounts for the given upgrade operation.
export class OfferModel {
	private readonly offers = new Map<string, Offer>()
	private selectedOfferId: string | null = null

	constructor() {}
	/**
	 * return true if we don't have an offer satisfying the requirements, e.g. when requesting a feature that's only
	 * available on business plans in situations where no business plans can be booked
	 */
	isEmpty(): boolean {
		return this.offers.size === 0
	}

	setSelectedOffer(offerId: string) {
		if (this.offers.has(offerId)) {
			throw new ProgrammingError("can't select offer that does not exist: " + offerId)
		}
		this.selectedOfferId = offerId
	}

	getSelectedOffer(): Offer | null {
		if (this.selectedOfferId == null) {
			return null
		}
		const offerId = this.offers.get(this.selectedOfferId)
		if (offerId == null) {
			return null
		}
		return { ...offerId }
	}

	/** return a list of copies of the active offers **/
	getOffers(): ReadonlyArray<Offer> {
		return Array.from(this.offers.values()).map((o) => ({ ...o }))
	}
}
