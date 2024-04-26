/* generated file, don't edit. */

import { MobilePaymentsFacade } from "./MobilePaymentsFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class MobilePaymentsFacadeSendDispatcher implements MobilePaymentsFacade {
	constructor(private readonly transport: NativeInterface) {}
	async requestSubscriptionToPlan(...args: Parameters<MobilePaymentsFacade["requestSubscriptionToPlan"]>) {
		return this.transport.invokeNative("ipc", ["MobilePaymentsFacade", "requestSubscriptionToPlan", ...args])
	}
	async getPlanPrice(...args: Parameters<MobilePaymentsFacade["getPlanPrice"]>) {
		return this.transport.invokeNative("ipc", ["MobilePaymentsFacade", "getPlanPrice", ...args])
	}
	async getCurrentPlanPrice(...args: Parameters<MobilePaymentsFacade["getCurrentPlanPrice"]>) {
		return this.transport.invokeNative("ipc", ["MobilePaymentsFacade", "getCurrentPlanPrice", ...args])
	}
}
