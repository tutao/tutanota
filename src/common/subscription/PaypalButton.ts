import m, { Children, Component, Vnode } from "mithril"
import { BaseButton } from "../gui/base/buttons/BaseButton"
import { lang } from "../misc/LanguageViewModel"
import { PayPalLogo } from "../gui/base/icons/Icons"
import { AccountingInfoTypeRef } from "../api/entities/sys/TypeRefs"
import { ClickHandler } from "../gui/base/GuiUtils"
import { noOp, promiseMap } from "@tutao/tutanota-utils"
import { isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils"
import { locator } from "../api/main/CommonLocator"
import { EntityEventsListener } from "../api/main/EventController"
import stream from "mithril/stream"
import { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"

interface PaypalButtonAttrs {
	data: Pick<UpgradeSubscriptionData, "accountingInfo">
	onclick: ClickHandler
	oncomplete?: () => void
}

export class PaypalButton implements Component<PaypalButtonAttrs> {
	private _entityEventListener: EntityEventsListener
	private _isPaypalLinked = stream(false)

	constructor({ attrs }: Vnode<PaypalButtonAttrs>) {
		const { accountingInfo } = attrs.data
		this._isPaypalLinked(accountingInfo?.paypalBillingAgreement != null)
		this._entityEventListener = (updates) => {
			return promiseMap(updates, (update) => {
				if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
					return locator.entityClient.load(AccountingInfoTypeRef, update.instanceId).then((newAccountingInfo) => {
						attrs.data.accountingInfo = newAccountingInfo
						this._isPaypalLinked(newAccountingInfo.paypalBillingAgreement != null)
						if (this._isPaypalLinked()) attrs.oncomplete?.()
						m.redraw()
					})
				}
			}).then(noOp)
		}
	}

	onremove() {
		locator.eventController.removeEntityListener(this._entityEventListener)
	}

	oncreate() {
		locator.eventController.addEntityListener(this._entityEventListener)
	}

	view({ attrs: { data, onclick } }: Vnode<PaypalButtonAttrs>): Children {
		const { accountingInfo } = data
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
				this._isPaypalLinked()
					? lang.get("paymentDataPayPalFinished_msg", {
							"{accountAddress}": accountingInfo?.paymentMethodInfo ?? "",
						})
					: lang.get("paymentDataPayPalLogin_msg"),
			),
		]
	}
}
