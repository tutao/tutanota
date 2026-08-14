/* generated file, don't edit. */

import { MobilePaymentsFacade } from "@tutao/native-bridge/generatedIpc/types"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class MobilePaymentsFacadeSendDispatcher implements MobilePaymentsFacade {
	constructor(private readonly transport: NativeInterface) {}
	async requestSubscriptionToPlan(...args: Parameters<MobilePaymentsFacade["requestSubscriptionToPlan"]>) {
		return this.transport.invokeNative("ipc", ["MobilePaymentsFacade", "requestSubscriptionToPlan", ...args])
	}
	async getPlanPrices(...args: Parameters<MobilePaymentsFacade["getPlanPrices"]>) {
		return this.transport.invokeNative("ipc", ["MobilePaymentsFacade", "getPlanPrices", ...args])
	}
	async showSubscriptionConfigView(...args: Parameters<MobilePaymentsFacade["showSubscriptionConfigView"]>) {
		return this.transport.invokeNative("ipc", ["MobilePaymentsFacade", "showSubscriptionConfigView", ...args])
	}
	async queryExternalSubscriptionOwnership(...args: Parameters<MobilePaymentsFacade["queryExternalSubscriptionOwnership"]>) {
		return this.transport.invokeNative("ipc", ["MobilePaymentsFacade", "queryExternalSubscriptionOwnership", ...args])
	}
	async isExternalSubscriptionRenewalEnabled(...args: Parameters<MobilePaymentsFacade["isExternalSubscriptionRenewalEnabled"]>) {
		return this.transport.invokeNative("ipc", ["MobilePaymentsFacade", "isExternalSubscriptionRenewalEnabled", ...args])
	}
}
