import o from "@tutao/otest"
import { MailAddressNameChanger, MailAddressTableModel } from "../../../../src/common/settings/mailaddress/MailAddressTableModel.js"
import { EntityClient } from "../../../../src/common/api/common/EntityClient.js"
import { matchers, object, when } from "testdouble"
import { MailAddressFacade } from "../../../../src/common/api/worker/facades/lazy/MailAddressFacade.js"
import { LoginController } from "../../../../src/common/api/main/LoginController.js"
import { EventController } from "../../../../src/common/api/main/EventController.js"
import { GroupInfo, MailAddressAliasTypeRef } from "../../../../src/common/api/entities/sys/TypeRefs.js"
import { LimitReachedError } from "../../../../src/common/api/common/error/RestError.js"
import { createUpgradePriceServiceMock, PLAN_PRICES } from "../../subscription/priceTestUtils.js"
import { clone, noOp } from "@tutao/tutanota-utils"
import { PlanType } from "../../../../src/common/api/common/TutanotaConstants.js"
import { UpgradeRequiredError } from "../../../../src/common/api/main/UpgradeRequiredError.js"
import { UserError } from "../../../../src/common/api/main/UserError.js"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { createTestEntity } from "../../TestUtils.js"

o.spec("MailAddressTableModel", function () {
	let model: MailAddressTableModel
	let nameChanger: MailAddressNameChanger
	let mailAddressFacade: MailAddressFacade
	let entityClient: EntityClient
	let userGroupInfo: GroupInfo

	o.beforeEach(function () {
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
			noOp,
		)
	})

	o("suggest buying plans with more mail addresses - some new paid plans provide more aliases", async function () {
		when(mailAddressFacade.addMailAlias(matchers.anything(), matchers.anything())).thenReject(new LimitReachedError("limit reached"))
		const alias1 = createTestEntity(MailAddressAliasTypeRef)
		userGroupInfo.mailAddressAliases = Array(15).fill(alias1)
		const error = await assertThrows(UpgradeRequiredError, () => model.addAlias("overthelimit@tuta.com", "Over, the Limit"))
		o(error.constructor.name).equals(UpgradeRequiredError.name)
		o(error.plans).deepEquals([PlanType.Legend, PlanType.Advanced, PlanType.Unlimited])
	})

	o("suggest buying plans with more mail addresses - no other plans available", async function () {
		when(mailAddressFacade.addMailAlias(matchers.anything(), matchers.anything())).thenReject(new LimitReachedError("limit reached"))
		const alias1 = createTestEntity(MailAddressAliasTypeRef)
		userGroupInfo.mailAddressAliases = Array(30).fill(alias1)
		await o(() => model.addAlias("overthelimit@tuta.com", "Over, the Limit")).asyncThrows(UserError)
	})

	o("suggest buying plans with more mail addresses - inactive email aliases", async function () {
		when(mailAddressFacade.addMailAlias(matchers.anything(), matchers.anything())).thenReject(new LimitReachedError("limit reached"))
		const alias1 = createTestEntity(MailAddressAliasTypeRef, { enabled: false })
		userGroupInfo.mailAddressAliases = Array(30).fill(alias1)
		await o(() => model.addAlias("overthelimit@tuta.com", "Over, the Limit")).asyncThrows(UserError)
	})
})
