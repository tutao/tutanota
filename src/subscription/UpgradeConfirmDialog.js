// @flow
import m from "mithril"
import {Dialog, DialogType} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {TextField} from "../gui/base/TextField"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Button, ButtonType} from "../gui/base/Button"
import {getPaymentMethodName} from "./PriceUtils"

export function openUpgradeConfirmDialog(subscriptionOptions: SubscriptionOptions, invoiceData: InvoiceData): Promise<boolean> {
	let orderField = new TextField("bookingOrder_label")
		.setValue("Tutanota Premium" + (subscriptionOptions.proUpgrade ? " (Pro)" : ""))
		.setDisabled()

	let subscriptionField = new TextField("subscription_label")
		.setValue((subscriptionOptions.paymentInterval == 12 ? lang.get("yearly_label") : lang.get("monthly_label")) + ", " + lang.get("automaticRenewal_label"))
		.setDisabled()

	let priceField = new TextField("price_label")
		.setValue(subscriptionOptions.price + " " + (subscriptionOptions.paymentInterval == 12 ? lang.get("perYear_label") : lang.get("perMonth_label")))
		.setDisabled()

	let paymentMethodField = new TextField("paymentMethod_label")
		.setValue(getPaymentMethodName(invoiceData.paymentMethod))
		.setDisabled()

	return Promise.fromCallback(cb => {
		let actionBar = new DialogHeaderBar()
		actionBar.setMiddle(() => lang.get("bookingSummary_label"))
		actionBar.addLeft(new Button("cancel_action", () => {
			dialog.close()
			cb(null, false)
		}).setType(ButtonType.Secondary))
		actionBar.addRight(new Button("buy_action", () => {
			dialog.close()
			cb(null, true)
		}).setType(ButtonType.Primary))

		let dialog = new Dialog(DialogType.EditSmall, {
			view: (): Children => [
				m(".dialog-header.plr-l", m(actionBar)),
				m(".dialog-contentButtonsTop.plr-l.pb", m("", [
					m(orderField),
					m(subscriptionField),
					m(priceField),
					m(paymentMethodField),
				]))
			]
		})
		dialog.show()
	})
}
