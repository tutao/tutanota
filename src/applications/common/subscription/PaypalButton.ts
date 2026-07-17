import m, { Children, Component, Vnode } from "mithril"
import { BaseButton } from "../../../ui/base/buttons/BaseButton"
import { lang } from "../../../ui/utils/LanguageViewModel"
import { PayPalLogo } from "../../../ui/base/icons/Icons"
import { ClickHandler } from "../../../ui/base/GuiUtils"
import { noOp, promiseMap } from "@tutao/utils"

import { locator } from "../api/main/CommonLocator"
import stream from "mithril/stream"
import { UpgradeSubscriptionData } from "./UpgradeSubscriptionWizard"
import { EntityEventsListener, isUpdateForTypeRef, OnEntityUpdateReceivedPriority } from "../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { AccountingInfoTypeRef } from "@tutao/entities/sys"
import { idToElementId } from "@tutao/meta"

export interface PaypalButtonAttrs {
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
		this._entityEventListener = {
			onEntityUpdatesReceived: (updates) => {
				return promiseMap(updates, (update) => {
					if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
						return locator.entityClient.load(AccountingInfoTypeRef, idToElementId(update.instanceId)).then((newAccountingInfo) => {
							attrs.data.accountingInfo = newAccountingInfo
							this._isPaypalLinked(newAccountingInfo.paypalBillingAgreement != null)
							if (this._isPaypalLinked()) attrs.oncomplete?.()
							m.redraw()
						})
					}
				}).then(noOp)
			},
			priority: OnEntityUpdateReceivedPriority.NORMAL,
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
					icon: m(".flex", m.trust(PayPalLogo)),
					class: "border border-radius bg-white button-height plr-16",
					onclick,
				}),
			),
			m(
				".small.pt-16.center",
				this._isPaypalLinked()
					? lang.get("paymentDataPayPalFinished_msg", {
							"{accountAddress}": accountingInfo?.paymentMethodInfo ?? "",
						})
					: lang.get("paymentDataPayPalLogin_msg"),
			),
		]
	}
}
