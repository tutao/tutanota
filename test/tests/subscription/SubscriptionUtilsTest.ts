import o from "ospec"
import { NewPaidPlans, PlanType } from "../../../src/api/common/TutanotaConstants.js"
import { getAvailableMatchingPlans } from "../../../src/subscription/SubscriptionUtils.js"
import { IServiceExecutor } from "../../../src/api/common/ServiceRequest.js"
import { createUpgradePriceServiceMock, PLAN_PRICES } from "./priceTestUtils.js"
import { clone } from "@tutao/tutanota-utils"

o.spec("SubscriptionUtilsTest", function () {
	let serviceExecutor: IServiceExecutor
	o.beforeEach(async function () {
		serviceExecutor = createUpgradePriceServiceMock(clone(PLAN_PRICES))
	})

	o.spec("getAvailableMatchingPlans", async function () {
		o("no filter returns all plans", async function () {
			o(await getAvailableMatchingPlans(serviceExecutor, () => true)).deepEquals(NewPaidPlans)
		})
		o("filter for whitelabel", async function () {
			o(await getAvailableMatchingPlans(serviceExecutor, (configuration) => configuration.whitelabel)).deepEquals([PlanType.Unlimited])
		})
	})
})
