import m, { Children, Component, Vnode } from "mithril"
import { BaseButton } from "../gui/base/buttons/BaseButton"
import { lang } from "../misc/LanguageViewModel"
import { PayPalLogo } from "../gui/base/icons/Icons"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { LazyLoaded } from "@tutao/tutanota-utils"
import { AccountingInfo } from "../api/entities/sys/TypeRefs"

interface PaypalButtonAttrs {
	payPalRequestUrl: LazyLoaded<string>
	accountingInfo: AccountingInfo
}

export class PaypalButton implements Component<PaypalButtonAttrs> {
	view({ attrs: { payPalRequestUrl, accountingInfo } }: Vnode<PaypalButtonAttrs>): Children {
		return [
			m(
				".flex-center",
				{
					style: {
						"margin-top": "50px",
					},
				},
				m(BaseButton, {
					label: lang.makeTranslation("PayPal", "PayPal"),
					icon: m(".payment-logo.flex", m.trust(PayPalLogo)),
					class: "border border-radius bg-white button-height plr",
					onclick: () => {
						if (payPalRequestUrl.isLoaded()) {
							window.open(payPalRequestUrl.getLoaded())
						} else {
							showProgressDialog("payPalRedirect_msg", payPalRequestUrl.getAsync()).then((url) => window.open(url))
						}
					},
				}),
			),
			m(
				".small.pt.center",
				accountingInfo.paypalBillingAgreement != null
					? lang.get("paymentDataPayPalFinished_msg", {
							"{accountAddress}": accountingInfo.paymentMethodInfo ?? "",
						})
					: lang.get("paymentDataPayPalLogin_msg"),
			),
		]
	}
}
