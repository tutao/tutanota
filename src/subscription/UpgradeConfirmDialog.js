// @flow
import m from "mithril"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {TextField} from "../gui/base/TextField"
import {DialogHeaderBar} from "../gui/base/DialogHeaderBar"
import {Button, ButtonType} from "../gui/base/Button"
import {getPaymentMethodName} from "./PriceUtils"
import {HabReminderImage} from "../gui/base/icons/Icons"

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

		let confirmButton = new Button("buy_action", () => {
			dialog.close()
			cb(null, true)
		}).setType(ButtonType.Login)

		let dialog = Dialog.largeDialog(actionBar, {
			//let dialog = new Dialog(DialogType.EditSmall, {
			view: () => [
				m(".center.h4.pt", lang.get("upgradeConfirm_msg")),
				m(".flex-space-around.flex-wrap", [
					m(".flex-grow-shrink-half.plr-l", [
						m(orderField),
						m(subscriptionField),
						m(priceField),
						m(paymentMethodField),
					]),
					m(".flex-grow-shrink-half.plr-l.flex-center.items-end",
						m("img[src=" + HabReminderImage + "].pt", {style: {width: "200px"}}))
				]),
				m(".flex-center.full-width.pt-l", m("", {style: {width: "260px"}}, m(confirmButton)))]
		})
		dialog.show()
	})
}
