// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import stream from "mithril/stream/stream.js"
import {TextField} from "../gui/base/TextField"
import {BookingItemFeatureType, AccountType} from "../api/common/TutanotaConstants"
import {worker} from "../api/main/WorkerClient"
import {neverNull} from "../api/common/utils/Utils"
import {formatPrice} from "../misc/Formatter"

export type SubscriptionOptions = {
	businessUse:boolean,
	paymentInterval: number
}

export function openSubscriptionOptionsDialog(): Promise<?SubscriptionOptions> {
	let businessUse = stream(false)
	let businessInput = new DropDownSelector("businessUse_label",
		null,
		[{name: lang.get("businessUse_label"), value: true}, {name: lang.get("privateUse_label"), value: false}],
		businessUse, // Private
		250).setSelectionChangedHandler(v => {
		businessUse(v)
	})

	const labelHelpConstantPart = lang.get("amountDueBeginOfSubscriptionPeriod_msg");
	const priceHelperText = () => {
		const prefix = lang.get(businessUse() ? "priceExcludesTaxes_msg" : "priceIncludesTaxes_msg")
		const suffix = lang.get(period() == 12 ? "twoMonthsForFreeIncluded_msg" : "twoMonthsForFreeYearly_msg")
		return prefix + " " + labelHelpConstantPart + " " + suffix
	}

	const priceLabel = new TextField("bookingPrice_label", priceHelperText).setValue(" ")
	let period = stream(12)

	worker.getPrice(BookingItemFeatureType.Users, 1, false, period(), AccountType.PREMIUM, businessUse())
		.then(response => priceLabel.setValue(formatPrice(Number(neverNull(response.futurePriceNextPeriod).price), true)))

	let subscriptionInput = new DropDownSelector("subscription_label",
		() => lang.get("renewedSubscriptionInfo_msg"),
		[{name: lang.get("yearly_label"), value: 12}, {name: lang.get("monthly_label"), value: 1}],
		period,
		250).setSelectionChangedHandler(v => {
		period(v)
		worker.getPrice(BookingItemFeatureType.Users, 1, false, period(), AccountType.PREMIUM, businessUse())
			.then(response => {
				priceLabel.setValue(formatPrice(Number(neverNull(response.futurePriceNextPeriod).price), true))
				//m.redraw()
			})
	})

	return Promise.fromCallback((callback) => {
		let paymentDataDialog = Dialog.smallActionDialog(lang.get("adminPayment_action"), {
			view: () => m(".text-break.pt", [
				m(businessInput),
				m(subscriptionInput),
				m(priceLabel)
			])
		}, () => {
			paymentDataDialog.close()
			callback(null, {businessUse: businessUse(), period: period()})
		}, true, "next_action", () => {
			paymentDataDialog.close()
			callback(null, null)
		})
	})
}
