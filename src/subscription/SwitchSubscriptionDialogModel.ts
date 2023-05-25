import { PlanType } from "../api/common/TutanotaConstants"
import type { AccountingInfo, Customer } from "../api/entities/sys/TypeRefs.js"
import { asPaymentInterval, PaymentInterval } from "./PriceUtils"

export type CurrentPlanInfo = {
	businessUse: boolean
	planType: PlanType
	paymentInterval: PaymentInterval
}

export class SwitchSubscriptionDialogModel {
	currentPlanInfo: CurrentPlanInfo

	constructor(private readonly customer: Customer, private readonly accountingInfo: AccountingInfo, private readonly planType: PlanType) {
		this.currentPlanInfo = this._initCurrentPlanInfo()
	}

	_initCurrentPlanInfo(): CurrentPlanInfo {
		const paymentInterval: PaymentInterval = asPaymentInterval(this.accountingInfo.paymentInterval)
		return {
			businessUse: this.customer.businessUse,
			planType: this.planType,
			paymentInterval,
		}
	}
}
