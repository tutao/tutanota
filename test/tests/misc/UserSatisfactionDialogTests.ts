import o from "@tutao/otest"
import { evaluateRatingEligibility, isEventHappyMoment, RatingDisallowReason } from "../../../src/common/ratings/UserSatisfactionUtils.js"
import { DeviceConfig } from "../../../src/common/misc/DeviceConfig.js"
import { object, verify, when } from "testdouble"
import { CommonLocator, initCommonLocator } from "../../../src/common/api/main/CommonLocator.js"
import { UserController } from "../../../src/common/api/main/UserController.js"
import { PlanType } from "../../../src/common/api/common/TutanotaConstants.js"
import { isApp } from "../../../src/common/api/common/Env.js"

o.spec("UserSatisfactionDialog", () => {
	let deviceConfigMock: DeviceConfig = object()
	let locatorMock: CommonLocator = object()

	const now = new Date("2024-10-27T12:34:00Z")

	o.beforeEach(() => {
		deviceConfigMock = object()
		locatorMock = object()

		initCommonLocator(locatorMock)
		when(deviceConfigMock.getNextEvaluationDate()).thenReturn(null)
		when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(null)
		when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(now.getTime()))
		when(locatorMock.logins.getUserController()).thenReturn(userControllerMock)
		when(locatorMock.logins.getUserController().loadCustomerInfo()).thenResolve({ creationTime: now })
		when(locatorMock.logins.getUserController().getPlanType()).thenResolve(PlanType.Free)
	})

	const userControllerMock: UserController = object({
		// @ts-ignore
		async loadCustomerInfo() {},
		// @ts-ignore
		async loadCustomer() {},
		// @ts-ignore
		async getPlanType() {},
	})

	o.spec("evaluateRatingEligibility", () => {
		o("app installation date", async () => {
			// Arrange
			const date = new Date("2024-10-24T12:34:00Z") // 3 days ago
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(date.getTime()))

			// Act
			const res = await evaluateRatingEligibility(now, deviceConfigMock, isApp())

			// Assert
			o(res).satisfies((disallowReasons) => ({
				pass: disallowReasons.includes(RatingDisallowReason.APP_INSTALLATION_TOO_YOUNG),
				message: "App installation date is too young",
			}))
		})

		o("customer account age", async () => {
			// Arrange
			const customerCreationDate = new Date("2024-10-26T12:34:00Z") // 1 day ago
			const appInstallationDate = new Date("2024-08-23T12:34:00Z") // 2 months ago
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(appInstallationDate.getTime()))
			when(locatorMock.logins.getUserController().loadCustomerInfo()).thenResolve({ creationTime: customerCreationDate })

			// Act
			const res = await evaluateRatingEligibility(now, deviceConfigMock, isApp())

			// Assert
			o(res).satisfies((disallowReasons) => ({
				pass:
					disallowReasons.includes(RatingDisallowReason.ACCOUNT_TOO_YOUNG) &&
					!disallowReasons.includes(RatingDisallowReason.APP_INSTALLATION_TOO_YOUNG),
				message: "Customer account is too young",
			}))
		})

		o("business user", async () => {
			// Arrange
			const customerCreationDate = new Date("2024-09-26T12:34:00Z") // 1 month ago
			const appInstallationDate = new Date("2024-08-23T12:34:00Z") // 2 months ago
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(appInstallationDate.getTime()))
			when(locatorMock.logins.getUserController().loadCustomerInfo()).thenResolve({ creationTime: customerCreationDate })
			when(locatorMock.logins.getUserController().getPlanType()).thenResolve(PlanType.PremiumBusiness)

			// Act
			const res = await evaluateRatingEligibility(now, deviceConfigMock, isApp())

			// Assert
			o(res).satisfies((disallowReasons) => ({
				pass: disallowReasons.includes(RatingDisallowReason.BUSINESS_USER),
				message: "Customer is a business user.",
			}))
		})

		o("retry timer has not elapsed", async () => {
			// Arrange
			const customerCreationDate = new Date("2024-09-26T12:34:00Z") // 1 month, 1 day ago
			const appInstallationDate = new Date("2024-08-23T12:34:00Z") // 2 months ago
			const retryRatingPromptAfter = new Date("2024-10-28T14:34:00Z") // in a day

			when(deviceConfigMock.getNextEvaluationDate()).thenReturn(retryRatingPromptAfter)
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(appInstallationDate.getTime()))
			when(locatorMock.logins.getUserController().loadCustomerInfo()).thenResolve({ creationTime: customerCreationDate })

			// Act
			const res = await evaluateRatingEligibility(now, deviceConfigMock, isApp())

			// Assert
			verify(locatorMock.logins.getUserController().loadCustomerInfo(), { times: 1 })
			o(res).satisfies((disallowReasons) => ({
				pass: disallowReasons.includes(RatingDisallowReason.RATING_DISMISSED),
				message: "Retry timer has not elapsed",
			}))
		})
	})

	o.spec("isEventHappyMoment", () => {
		o("Should trigger when three activities reached and retry timer has elapsed", () => {
			// Arrange
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(null)
			when(deviceConfigMock.getEvents()).thenReturn([
				new Date("2024-10-11T11:12:04Z"),
				new Date("2024-10-10T11:12:04Z"),
				new Date("2024-10-09T11:12:04Z"),
			])

			// Act
			const res = isEventHappyMoment(now, deviceConfigMock)

			// Assert
			o(res).equals(true)
		})

		o("Should trigger if there are at least 3 events/emails created and no previous prompt", () => {
			// Arrange
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(null)
			when(deviceConfigMock.getEvents()).thenReturn([
				new Date("2024-10-11T11:12:04Z"),
				new Date("2024-10-10T11:12:04Z"),
				new Date("2024-10-09T11:12:04Z"),
			])

			// Act
			const res = isEventHappyMoment(now, deviceConfigMock)

			// Assert
			verify(deviceConfigMock.getEvents(), { times: 1 })
			o(res).equals(true)
		})

		o("Should not trigger if there are at least 3 events/emails created and no previous prompt", () => {
			// Arrange
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(new Date("2024-02-11T11:12:04Z"))
			when(deviceConfigMock.getEvents()).thenReturn([
				new Date("2024-10-11T11:12:04Z"),
				new Date("2024-10-10T11:12:04Z"),
				new Date("2024-10-09T11:12:04Z"),
			])

			// Act
			const res = isEventHappyMoment(now, deviceConfigMock)

			// Assert
			verify(deviceConfigMock.getEvents(), { times: 1 })
			o(res).equals(false)
		})

		o("Should trigger if there are at least 10 recent activities in the last 28 days", () => {
			// Arrange
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(new Date("2022-10-11T11:12:04Z"))
			when(deviceConfigMock.getEvents()).thenReturn([
				new Date("2024-10-11T11:12:04Z"),
				new Date("2024-10-10T11:12:04Z"),
				new Date("2024-10-09T11:12:04Z"),
				new Date("2024-10-08T11:12:04Z"),
				new Date("2024-10-07T11:12:04Z"),
				new Date("2024-10-06T11:12:04Z"),
				new Date("2024-10-05T11:12:04Z"),
				new Date("2024-10-04T11:12:04Z"),
				new Date("2024-10-03T11:12:04Z"),
				new Date("2024-10-02T11:12:04Z"),
			])

			// Act
			const res = isEventHappyMoment(now, deviceConfigMock)

			// Assert
			o(res).equals(true)
		})

		o("Should not trigger if there are less than 10 recent activities in the last 28 days", () => {
			// Arrange
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(new Date("2022-10-11T11:12:04Z"))
			when(deviceConfigMock.getEvents()).thenReturn([
				new Date("2024-10-11T11:12:04Z"),
				new Date("2024-10-10T11:12:04Z"),
				new Date("2024-10-09T11:12:04Z"),
				new Date("2024-10-08T11:12:04Z"),
				new Date("2024-10-07T11:12:04Z"),
				new Date("2024-10-06T11:12:04Z"),
				new Date("2024-10-05T11:12:04Z"),
				new Date("2024-10-04T11:12:04Z"),
				new Date("2024-10-03T11:12:04Z"),
				new Date("2024-09-28T11:12:04Z"),
			])

			// Act
			const res = isEventHappyMoment(now, deviceConfigMock)

			// Assert
			o(res).equals(false)
		})

		o("Should not trigger if less than 3 events/emails created", () => {
			// Arrange
			const events = [new Date("2024-10-11T11:12:04Z"), new Date("2024-10-10T11:12:04Z")]
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(null)
			when(deviceConfigMock.getEvents()).thenReturn(events)

			// Act
			const res = isEventHappyMoment(now, deviceConfigMock)

			// Assert
			o(res).equals(false)
		})
	})
})
