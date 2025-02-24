import { DeviceConfig } from "../misc/DeviceConfig.js"
import { DateTime } from "luxon"
import { locator } from "../api/main/CommonLocator.js"
import { isAndroidApp } from "../api/common/Env.js"
import { Stage } from "@tutao/tutanota-usagetests"

export function createEvent(deviceConfig: DeviceConfig): void {
	const retentionPeriod: number = 30
	let events = deviceConfig.getEvents().filter((event) => isWithinLastNDays(new Date(), event, retentionPeriod))
	events.push(new Date())
	deviceConfig.writeEvents(events)
}

export function isWithinLastNDays(now: Date, date: Date, days: number) {
	return DateTime.fromJSDate(now).diff(DateTime.fromJSDate(date), "days").days < days
}

export enum RatingCheckResult {
	RATING_ALLOWED,
	UNSUPPORTED_PLATFORM,
	LAST_RATING_TOO_YOUNG,
	APP_INSTALLATION_TOO_YOUNG,
	ACCOUNT_TOO_YOUNG,
	RATING_DISMISSED,
}

/**
 * Determines if we are allowed to ask the user for their rating.
 * It is possible that the user delayed his choice or if we already asked them within the past year.
 *
 * 1. The app must be running on an iOS device.
 * 2. The app installation date and customer creation date must both be at least 7 days in the past.
 * 3. The dialog must not have been shown within the last year (When the dialog is dismissed with the cancel button it is not considered being shown).
 * 4. The retry prompt timer (if set) must have expired.
 */
export async function getRatingAllowed(now: Date, deviceConfig: DeviceConfig, isApp: boolean): Promise<RatingCheckResult> {
	if (!isApp) {
		return RatingCheckResult.UNSUPPORTED_PLATFORM
	}

	const lastRatingPromptedDate: Date | null = deviceConfig.getLastRatingPromptedDate()

	if (lastRatingPromptedDate != null && DateTime.fromJSDate(now).diff(DateTime.fromJSDate(lastRatingPromptedDate), "years").years < 1) {
		return RatingCheckResult.LAST_RATING_TOO_YOUNG
	}

	const appInstallationDate = await locator.systemFacade.getInstallationDate().then((rawDate) => new Date(Number(rawDate)))
	if (isWithinLastNDays(now, appInstallationDate, 7)) {
		return RatingCheckResult.APP_INSTALLATION_TOO_YOUNG
	}

	const customerCreationDate = (await locator.logins.getUserController().loadCustomerInfo()).creationTime
	if (isWithinLastNDays(now, customerCreationDate, 7)) {
		return RatingCheckResult.ACCOUNT_TOO_YOUNG
	}

	const retryRatingPromptAfter = deviceConfig.getRetryRatingPromptAfter()
	if (retryRatingPromptAfter != null && now.getTime() < retryRatingPromptAfter.getTime()) {
		return RatingCheckResult.RATING_DISMISSED
	}

	return RatingCheckResult.RATING_ALLOWED
}

/**
 * Determines if the user is experiencing a "happy moment".
 *
 * At least one of the following activity-based conditions must be satisfied:
 *    - The user has created at least 3 events/emails, and no previous prompt was shown.
 *    - The user has performed at least 10 activities (events/emails) in the last 28 days.
 *
 * @returns {boolean} A promise that resolves to `true` if the user is in a "happy moment".
 */
export function isEventHappyMoment(now: Date, deviceConfig: DeviceConfig): boolean {
	//region Trigger 1: Check for minimum 3 events/emails created
	const lastRatingPromptedDate: Date | null = deviceConfig.getLastRatingPromptedDate()

	const events: Date[] = deviceConfig.getEvents()
	if (events.length >= 3 && lastRatingPromptedDate == null) {
		return true
	}
	//endregion

	//region Trigger 2: Check for at least 10 activities in the last 28 days
	const twentyEightDaysAgo = DateTime.fromJSDate(now).minus({ days: 28 }).toMillis()
	const recentActivityCount = events.filter((event) => new Date(event).getTime() >= twentyEightDaysAgo).length

	if (recentActivityCount >= 10) {
		return true
	}
	//endregion
	return false
}

export type TriggerType = "Mail" | "Calendar" | "Upgrade"
export type EvaluationButtonType = "LoveIt" | "NeedsWork" | "NotNow"
export type RatingButtonType = "RateUs" | "MaybeLater"

enum RatingUsageTestStage {
	TRIGGER,
	EVALUATION,
	RATING,
}

export function getRatingUsageTestStage(stage: RatingUsageTestStage): Stage {
	const test = locator.usageTestController.getTest(isAndroidApp() ? "rating.android" : "rating.ios")
	return test.getStage(stage)
}

export function completeTriggerStage(triggerType: TriggerType) {
	const stage = getRatingUsageTestStage(RatingUsageTestStage.TRIGGER)

	stage.setMetric({
		name: "triggerType",
		value: triggerType,
	})
	void stage.complete()
}

export function completeEvaluationStage(triggerType: TriggerType, buttonType: EvaluationButtonType) {
	const stage = getRatingUsageTestStage(RatingUsageTestStage.EVALUATION)

	stage.setMetric({
		name: "button",
		value: buttonType + "_" + triggerType,
	})
	void stage.complete()
}

export function completeRatingStage(triggerType: TriggerType, buttonType: RatingButtonType) {
	const stage = getRatingUsageTestStage(RatingUsageTestStage.RATING)

	stage.setMetric({
		name: "button",
		value: buttonType + "_" + triggerType,
	})
	void stage.complete()
}
