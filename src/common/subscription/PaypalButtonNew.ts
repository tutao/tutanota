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
import { SignupViewModel } from "../signup/SignupView"
import { component_size, px } from "../gui/size"

export interface PaypalButtonNewAttrs {
	data: Pick<SignupViewModel, "accountingInfo">
	onclick: ClickHandler
	oncomplete?: () => void
	disabled?: boolean
}

export class PaypalButtonNew implements Component<PaypalButtonNewAttrs> {
	private entityEventListener: EntityEventsListener
	private isPaypalLinked = false

	constructor({ attrs }: Vnode<PaypalButtonNewAttrs>) {
		const { accountingInfo } = attrs.data
		this.isPaypalLinked = accountingInfo?.paypalBillingAgreement != null
		this.entityEventListener = (updates) => {
			return promiseMap(updates, (update) => {
				if (isUpdateForTypeRef(AccountingInfoTypeRef, update)) {
					return locator.entityClient.load(AccountingInfoTypeRef, update.instanceId).then((newAccountingInfo) => {
						attrs.data.accountingInfo = newAccountingInfo
						this.isPaypalLinked = newAccountingInfo.paypalBillingAgreement != null
						if (this.isPaypalLinked) attrs.oncomplete?.()
						m.redraw()
					})
				}
			}).then(noOp)
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
