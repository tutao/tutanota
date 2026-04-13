import m, { Children, Component, Vnode } from "mithril"
import { BaseButton } from "../gui/base/buttons/BaseButton"
import { lang } from "../misc/LanguageViewModel"
import { PayPalLogo } from "../gui/base/icons/Icons"
import { ClickHandler } from "../gui/base/GuiUtils"
import { noOp, promiseMap } from "@tutao/utils"

import { locator } from "../api/main/CommonLocator"
import { SignupViewModel } from "../signup/SignupView"
import { component_size, px } from "../gui/size"
import { entityUpdateUtils, sysTypeRefs } from "@tutao/typeRefs"

export interface PaypalButtonNewAttrs {
	data: Pick<SignupViewModel, "accountingInfo">
	onclick: ClickHandler
	oncomplete?: () => void
	disabled?: boolean
}

export class PaypalButtonNew implements Component<PaypalButtonNewAttrs> {
	private entityEventListener: entityUpdateUtils.EntityEventsListener
	private isPaypalLinked = false

	constructor({ attrs }: Vnode<PaypalButtonNewAttrs>) {
		const { accountingInfo } = attrs.data
		this.isPaypalLinked = accountingInfo?.paypalBillingAgreement != null
		this.entityEventListener = {
			onEntityUpdatesReceived: (updates) => {
				return promiseMap(updates, (update) => {
					if (entityUpdateUtils.isUpdateForTypeRef(sysTypeRefs.AccountingInfoTypeRef, update)) {
						return locator.entityClient.load(sysTypeRefs.AccountingInfoTypeRef, update.instanceId).then((newAccountingInfo) => {
							attrs.data.accountingInfo = newAccountingInfo
							this.isPaypalLinked = newAccountingInfo.paypalBillingAgreement != null
							if (this.isPaypalLinked) attrs.oncomplete?.()
							m.redraw()
						})
					}
				}).then(noOp)
			},
			priority: entityUpdateUtils.OnEntityUpdateReceivedPriority.NORMAL,
		}
	}

	onremove() {
		locator.eventController.removeEntityListener(this.entityEventListener)
	}

	oncreate() {
		locator.eventController.addEntityListener(this.entityEventListener)
	}

	view({ attrs: { data, onclick, disabled } }: Vnode<PaypalButtonNewAttrs>): Children {
		return [
			m(
				".flex-center.justify-center",
				m(BaseButton, {
					label: lang.makeTranslation("PayPal", "PayPal"),
					text: m(".flex.gap-8.items-center.justify-center", [
						m("span", { style: { color: "#253B80" } }, "Redirect to"),
						m(".flex.p-8.rel", { style: { top: px(2) } }, m.trust(PayPalLogo)),
					]),
					class: "border border-radius button-height plr-16",
					style: {
						height: px(component_size.button_height_lg),
						"border-color": "#FFD140",
						"background-color": "#FFD140",
						"min-width": "100%",
						opacity: disabled ? "0.6" : "initial",
						pointerEvents: disabled ? "none" : "auto",
						filter: disabled ? "grayscale(0.8)" : "initial",
					},
					disabled,
					onclick,
				}),
			),
		]
	}
}
