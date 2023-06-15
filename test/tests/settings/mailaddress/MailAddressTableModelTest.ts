import o from "ospec"
import { MailAddressNameChanger, MailAddressTableModel } from "../../../../src/settings/mailaddress/MailAddressTableModel.js"
import { EntityClient } from "../../../../src/api/common/EntityClient.js"
import { matchers, object, when } from "testdouble"
import { MailAddressFacade } from "../../../../src/api/worker/facades/lazy/MailAddressFacade.js"
import { LoginController } from "../../../../src/api/main/LoginController.js"
import { EventController } from "../../../../src/api/main/EventController.js"
import { createMailAddressAlias, GroupInfo, PlanPrices, UpgradePriceServiceReturn } from "../../../../src/api/entities/sys/TypeRefs.js"
import { IServiceExecutor } from "../../../../src/api/common/ServiceRequest.js"
import { LimitReachedError } from "../../../../src/api/common/error/RestError.js"
import { createUpgradePriceServiceMock, PLAN_PRICES } from "../../subscription/priceTestUtils.js"
import { clone } from "@tutao/tutanota-utils"
import { PlanType } from "../../../../src/api/common/TutanotaConstants.js"
import { UpgradeRequiredError } from "../../../../src/api/main/UpgradeRequiredError.js"
import { UserError } from "../../../../src/api/main/UserError.js"
import { UpgradePriceService } from "../../../../src/api/entities/sys/Services.js"

o.spec("MailAddressTableModel", function () {
	let model: MailAddressTableModel
	let nameChanger: MailAddressNameChanger
	let mailAddressFacade: MailAddressFacade
	let entityClient: EntityClient
	let userGroupInfo: GroupInfo

	o.beforeEach(async function () {
		nameChanger = object<MailAddressNameChanger>()
		mailAddressFacade = object<MailAddressFacade>()

		const priceServiceMock = createUpgradePriceServiceMock(clone(PLAN_PRICES))
		entityClient = object<EntityClient>()
		userGroupInfo = object<GroupInfo>()
		model = new MailAddressTableModel(
			entityClient,
			priceServiceMock,
			mailAddressFacade,
			object<LoginController>(),
			object<EventController>(),
			userGroupInfo,
			nameChanger,
		)
	})

	o("suggest buying plans with more mail addresses - some new paid plans provide more aliases", async function () {
		when(mailAddressFacade.addMailAlias(matchers.anything(), matchers.anything())).thenReject(new LimitReachedError("limit reached"))
		const alias1 = createMailAddressAlias()
		userGroupInfo.mailAddressAliases = Array(15).fill(alias1)
		try {
			await model.addAlias("overthelimit@tutanota.com", "Over, the Limit")
			o(true).equals(false)("should have thrown")
		} catch (error) {
			o(error.constructor.name).equals(UpgradeRequiredError.name)
			o(error.plans).deepEquals([PlanType.Legend, PlanType.Advanced, PlanType.Unlimited])
		}
	})

	o("suggest buying plans with more mail addresses - no other plans available", async function () {
		when(mailAddressFacade.addMailAlias(matchers.anything(), matchers.anything())).thenReject(new LimitReachedError("limit reached"))
		const alias1 = createMailAddressAlias()
		userGroupInfo.mailAddressAliases = Array(30).fill(alias1)
		try {
			await model.addAlias("overthelimit@tutanota.com", "Over, the Limit")
			o(true).equals(false)("should have thrown")
		} catch (error) {
			o(error.constructor.name).equals(UserError.name)
		}
	})

	o("suggest buying plans with more mail addresses - inactive email aliases", async function () {
		when(mailAddressFacade.addMailAlias(matchers.anything(), matchers.anything())).thenReject(new LimitReachedError("limit reached"))
		const alias1 = createMailAddressAlias({ enabled: false })
		userGroupInfo.mailAddressAliases = Array(30).fill(alias1)
		try {
			await model.addAlias("overthelimit@tutanota.com", "Over, the Limit")
			o(true).equals(false)("should have thrown")
		} catch (error) {
			o(error.constructor.name).equals(UserError.name)
		}
	})
})
