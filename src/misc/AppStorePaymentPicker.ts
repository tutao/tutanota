import { UsageTest, UsageTestController } from "@tutao/tutanota-usagetests"
import { PaymentMethodType } from "../api/common/TutanotaConstants.js"
import { StorageBehavior, UsageTestModel } from "./UsageTestModel.js"
import { locator } from "../api/main/MainLocator.js"
import { LazyLoaded, lazy } from "@tutao/tutanota-utils"

export class AppStorePaymentPicker {
	private appStorePaymentUsageTest: lazy<UsageTest> = () => {
		return locator.usageTestController.getTest("payment.appstore")
	}

	async shouldEnableAppStorePayment(currentPaymentMethod: PaymentMethodType | null): Promise<boolean> {
		// Prevent users with AppStorePayment from losing the ability to modify their plan
		if (currentPaymentMethod === PaymentMethodType.AppStore) {
			return true
		}

		const appStorePaymentUsageTest = this.appStorePaymentUsageTest()
		const shouldEnable = appStorePaymentUsageTest.getVariant({
			[0]: () => false,
			[1]: () => true,
		})

		if (shouldEnable) {
			await appStorePaymentUsageTest.getStage(0).complete()
		}

		return shouldEnable
	}

	async markSubscribedStageAsComplete() {
		const appStorePaymentUsageTest = this.appStorePaymentUsageTest()
		await appStorePaymentUsageTest.getStage(1).complete()
	}
}
