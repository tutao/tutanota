import o from "@tutao/otest"
import { evaluateRatingEligibility, isEventHappyMoment, RatingDisallowReason } from "../../../src/common/ratings/InAppRatingUtils.js"
import { DeviceConfig } from "../../../src/common/misc/DeviceConfig.js"
import { object, verify, when } from "testdouble"
import { CommonLocator, initCommonLocator } from "../../../src/common/api/main/CommonLocator.js"
import { UserController } from "../../../src/common/api/main/UserController.js"

o.spec("InAppRatingUtilsTest", () => {
	let deviceConfigMock: DeviceConfig = object()
	let locatorMock: CommonLocator = object()

	const now = new Date("2024-10-27T12:34:00Z")

	o.beforeEach(() => {
		deviceConfigMock = object()
		locatorMock = object()

		initCommonLocator(locatorMock)
		when(deviceConfigMock.getRetryRatingPromptAfter()).thenReturn(null)
		when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(null)
		when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(now.getTime()))
		when(locatorMock.logins.getUserController()).thenReturn(userControllerMock)
		when(locatorMock.logins.getUserController().loadCustomerInfo()).thenResolve({ creationTime: now })
	})

	const userControllerMock: UserController = object({
		// @ts-ignore
		async loadCustomerInfo() {},
	})

	o.spec("evaluateRatingEligibility", () => {
		o("platform requirement", async () => {
			// Arrange
			const isApp = false

			// Act
			const res = await evaluateRatingEligibility(now, deviceConfigMock, isApp)

			// Assert
			o(res).satisfies((disallowReasons) => ({
				pass: disallowReasons.includes(RatingDisallowReason.UNSUPPORTED_PLATFORM),
				message: "Ratings are only available in the Tuta iOS and Android apps",
			}))
		})

		o("previous rating", async () => {
			// Arrange
			const lastRatingPromptedDate = new Date("2024-06-06T06:06:06Z") // some months ago

			when(deviceConfigMock.getRetryRatingPromptAfter()).thenReturn(null)
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(lastRatingPromptedDate)

			// Act
			const res = await evaluateRatingEligibility(now, deviceConfigMock, true)

			// Assert
			o(res).satisfies((disallowReasons) => ({
				pass: disallowReasons.includes(RatingDisallowReason.LAST_RATING_TOO_YOUNG),
				message: "Rating prompt was shown less than a year ago",
			}))
		})

		o("app installation date", async () => {
			// Arrange
			const date = new Date("2024-10-24T12:34:00Z") // 3 days ago
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(date.getTime()))

			// Act
			const res = await evaluateRatingEligibility(now, deviceConfigMock, true)

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
			const res = await evaluateRatingEligibility(now, deviceConfigMock, true)

			// Assert
			o(res).satisfies((disallowReasons) => ({
				pass:
					disallowReasons.includes(RatingDisallowReason.ACCOUNT_TOO_YOUNG) &&
					!disallowReasons.includes(RatingDisallowReason.APP_INSTALLATION_TOO_YOUNG),
				message: "Customer account is too young",
			}))
		})

		o("retry timer has not elapsed", async () => {
			// Arrange
			const customerCreationDate = new Date("2024-09-26T12:34:00Z") // 1 month, 1 day ago
			const appInstallationDate = new Date("2024-08-23T12:34:00Z") // 2 months ago
			const retryRatingPromptAfter = new Date("2024-10-28T14:34:00Z") // in a day

			when(deviceConfigMock.getRetryRatingPromptAfter()).thenReturn(retryRatingPromptAfter)
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(appInstallationDate.getTime()))
			when(locatorMock.logins.getUserController().loadCustomerInfo()).thenResolve({ creationTime: customerCreationDate })

			// Act
			const res = await evaluateRatingEligibility(now, deviceConfigMock, true)

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
