import o from "@tutao/otest"
import { getRatingAllowed, isEventHappyMoment, RatingCheckResult } from "../../../src/common/ratings/InAppRatingUtils.js"
import { DeviceConfig } from "../../../src/common/misc/DeviceConfig.js"
import { object, verify, when } from "testdouble"
import { CommonLocator, initCommonLocator } from "../../../src/common/api/main/CommonLocator.js"
import { UserController } from "../../../src/common/api/main/UserController.js"

o.spec("InAppRatingUtilsTest", () => {
	let deviceConfigMock: DeviceConfig = object()
	let locatorMock: CommonLocator = object()

	o.beforeEach(() => {
		deviceConfigMock = object()
		locatorMock = object()
		initCommonLocator(locatorMock)
	})

	const now = new Date("2024-10-27T12:34:00Z")

	const userControllerMock: UserController = object({
		// @ts-ignore
		async loadCustomerInfo() {},
	})

	o.spec("getRatingAllowed", () => {
		o("Should not trigger if the app is not on iOS", async () => {
			// Arrange
			const appInstallationDate = new Date("2024-10-11T11:12:04Z")

			when(deviceConfigMock.getRetryRatingPromptAfter()).thenReturn(null)
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(null)
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(appInstallationDate.getTime()))

			// Act
			const res = await getRatingAllowed(now, deviceConfigMock, false)

			// Assert
			o(res).equals(RatingCheckResult.UNSUPPORTED_PLATFORM)
		})

		o("Should not trigger if the rating dialog was shown less than a year ago", async () => {
			// Arrange
			const appInstallationDate = new Date("2024-10-11T11:12:04Z")

			when(deviceConfigMock.getRetryRatingPromptAfter()).thenReturn(null)
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(new Date("2024-06-06T06:06:06Z"))
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(appInstallationDate.getTime()))

			// Act
			const res = await getRatingAllowed(now, deviceConfigMock, true)

			// Assert
			o(res).equals(RatingCheckResult.LAST_RATING_TOO_YOUNG)
		})

		o("Should not trigger if the app was installed less than 7 days ago", async () => {
			// Arrange
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(null)
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(new Date("2024-10-23T11:12:04Z").getTime()))

			// Act
			const res = await getRatingAllowed(now, deviceConfigMock, true)

			// Assert
			o(res).equals(RatingCheckResult.APP_INSTALLATION_TOO_YOUNG)
		})

		o("Should not trigger if the customer account was created less than 7 days ago", async () => {
			// Arrange
			const appInstallationDate = new Date("2024-10-11T11:12:04Z") // The app is installed long enough ago.
			const customerCreationDate = new Date("2024-10-23T11:12:04Z")

			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(null)
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(appInstallationDate.getTime()))
			when(locatorMock.logins.getUserController()).thenReturn(userControllerMock)
			when(locatorMock.logins.getUserController().loadCustomerInfo()).thenResolve({ creationTime: customerCreationDate })

			// Act
			const res = await getRatingAllowed(now, deviceConfigMock, true)

			// Assert
			o(res).equals(RatingCheckResult.ACCOUNT_TOO_YOUNG)
		})

		o("Should not trigger if the retry prompt timer has not elapsed", async () => {
			// Arrange
			const appInstallationDate = new Date("2024-10-11T11:12:04Z")
			const customerCreationDate = new Date("2024-10-11T11:12:04Z")

			when(deviceConfigMock.getRetryRatingPromptAfter()).thenReturn(new Date("2024-11-27T14:34:00Z"))
			when(deviceConfigMock.getLastRatingPromptedDate()).thenReturn(null)
			when(locatorMock.systemFacade.getInstallationDate()).thenResolve(String(appInstallationDate.getTime()))
			when(locatorMock.logins.getUserController()).thenReturn(userControllerMock)
			when(locatorMock.logins.getUserController().loadCustomerInfo()).thenResolve({ creationTime: customerCreationDate })

			// Act
			const res = await getRatingAllowed(now, deviceConfigMock, true)

			// Assert
			verify(locatorMock.logins.getUserController().loadCustomerInfo(), { times: 1 })
			o(res).equals(RatingCheckResult.RATING_DISMISSED)
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
