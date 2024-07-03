import o from "@tutao/otest"
import { NewPaidPlans, PlanType } from "../../../src/common/api/common/TutanotaConstants.js"
import { IServiceExecutor } from "../../../src/common/api/common/ServiceRequest.js"
import { createUpgradePriceServiceMock, PLAN_PRICES } from "./priceTestUtils.js"
import { clone } from "@tutao/tutanota-utils"

import { getAvailableMatchingPlans } from "../../../src/common/subscription/SubscriptionUtils.js"

o.spec("SubscriptionUtilsTest", function () {
	let serviceExecutor: IServiceExecutor
	o.beforeEach(async function () {
		serviceExecutor = createUpgradePriceServiceMock(clone(PLAN_PRICES))
	})

	o.spec("getAvailableMatchingPlans", function () {
		o("no filter returns all plans", async function () {
			o(await getAvailableMatchingPlans(serviceExecutor, () => true)).deepEquals(NewPaidPlans)
		})
		o("filter for whitelabel", async function () {
			o(await getAvailableMatchingPlans(serviceExecutor, (configuration) => configuration.whitelabel)).deepEquals([PlanType.Unlimited])
		})
	})
})
