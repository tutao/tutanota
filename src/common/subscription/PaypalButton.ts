import m, { Children, Component, Vnode } from "mithril"
import { BaseButton } from "../gui/base/buttons/BaseButton"
import { lang } from "../misc/LanguageViewModel"
import { PayPalLogo } from "../gui/base/icons/Icons"
import { AccountingInfo } from "../api/entities/sys/TypeRefs"
import { ClickHandler } from "../gui/base/GuiUtils"

interface PaypalButtonAttrs {
	accountingInfo: AccountingInfo | null
	onclick: ClickHandler
}

export class PaypalButton implements Component<PaypalButtonAttrs> {
	view({ attrs: { accountingInfo, onclick } }: Vnode<PaypalButtonAttrs>): Children {
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
					onclick,
				}),
			),
			m(
				".small.pt.center",
				accountingInfo?.paypalBillingAgreement != null
					? lang.get("paymentDataPayPalFinished_msg", {
							"{accountAddress}": accountingInfo.paymentMethodInfo ?? "",
						})
					: lang.get("paymentDataPayPalLogin_msg"),
			),
		]
	}
}
