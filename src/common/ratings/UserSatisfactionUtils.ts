import { deviceConfig, DeviceConfig } from "../misc/DeviceConfig.js"
import { DateTime } from "luxon"
import { locator } from "../api/main/CommonLocator.js"
import { isAndroidApp, isApp, isBrowser, isDesktop } from "../api/common/Env.js"
import { Stage } from "@tutao/tutanota-usagetests"
import { AvailablePlanType, LegacyBusinessPlans, NewBusinessPlans, PlanType, PlanTypeToName } from "../api/common/TutanotaConstants.js"
import { isEmpty } from "@tutao/tutanota-utils"
import { showUserSatisfactionDialog } from "./UserSatisfactionDialog.js"

export function createEvent(deviceConfig: DeviceConfig): void {
	const retentionPeriod: number = 30
	const events = deviceConfig.getEvents().filter((event) => isWithinLastNDays(new Date(), event, retentionPeriod))
	events.push(new Date())
	deviceConfig.writeEvents(events)
}

export function isWithinLastNDays(now: Date, date: Date, days: number) {
	return DateTime.fromJSDate(now).diff(DateTime.fromJSDate(date), "days").days < days
}

export enum RatingDisallowReason {
	APP_INSTALLATION_TOO_YOUNG = 2,
	ACCOUNT_TOO_YOUNG = 3,
	RATING_DISMISSED = 4,
	BUSINESS_USER = 5,
	NOT_INTERNAL_USER = 6,
}

/**
 * Determines if we are allowed to ask the user for their rating.
 * It is possible that the user delayed their choice or if we already asked them within the past year.
 *
 * 1. The app must be running on a supported platform.
 * 2. The app installation date and customer creation date must both be at least 7 days in the past.
 * 3. The dialog must not have been shown within the last year (When the dialog is dismissed with the cancel button it is not considered being shown).
 * 4. The retry prompt timer (if set) must have expired.
 * 5. The current user must not be a business user.
 * 6. The current user must not be an external user.
 *
 * @returns A list of reasons why the rating prompt is disallowed. If the list is empty, it is allowed to ask the user for their rating.
 */
export async function evaluateRatingEligibility(now: Date, deviceConfig: DeviceConfig, isApp: boolean): Promise<RatingDisallowReason[]> {
	const disallowReasons: RatingDisallowReason[] = []

	if (!locator.logins.isInternalUserLoggedIn()) {
		return [RatingDisallowReason.NOT_INTERNAL_USER]
	}

	let appInstallationDate: Date | undefined
	if (isApp) {
		// we use a native implementation here because at least iOS has restrictions on how often we can show rating dialogs.
		// this rate limit is based on the actual installation date and not the date of first use (which deviceConfig would give us)
		appInstallationDate = await locator.systemFacade.getInstallationDate().then((rawDate) => new Date(Number(rawDate)))
	} else {
		appInstallationDate = deviceConfig.getInstallationDate()
	}

	if (appInstallationDate && isWithinLastNDays(now, appInstallationDate, 7)) {
		disallowReasons.push(RatingDisallowReason.APP_INSTALLATION_TOO_YOUNG)
	}

	const customerCreationDate = (await locator.logins.getUserController().loadCustomerInfo()).creationTime
	if (isWithinLastNDays(now, customerCreationDate, 7)) {
		disallowReasons.push(RatingDisallowReason.ACCOUNT_TOO_YOUNG)
	}

	const nextEvaluationDate = deviceConfig.getNextEvaluationDate()
	if (nextEvaluationDate != null && now.getTime() < nextEvaluationDate?.getTime()) {
		disallowReasons.push(RatingDisallowReason.RATING_DISMISSED)
	}

	const currentPlanType = await locator.logins.getUserController().getPlanType()
	if (LegacyBusinessPlans.includes(currentPlanType) || NewBusinessPlans.includes(currentPlanType as AvailablePlanType)) {
		disallowReasons.push(RatingDisallowReason.BUSINESS_USER)
	}

	return disallowReasons
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

export async function showUserSatisfactionDialogAfterUpgrade(currentPlan: PlanType, newPlan: PlanType) {
	if (newPlan === currentPlan) return Promise.resolve()

	if (currentPlan === PlanType.Free || (currentPlan === PlanType.Revolutionary && newPlan === PlanType.Legend)) {
		// We show the rating dialog after a successful upgrade. The account age and app installation age are not checked here.
		const disallowReasons = (await evaluateRatingEligibility(new Date(), deviceConfig, isApp())).filter(
			(r) => r !== RatingDisallowReason.APP_INSTALLATION_TOO_YOUNG && r !== RatingDisallowReason.ACCOUNT_TOO_YOUNG,
		)
		if (isEmpty(disallowReasons)) {
			setTimeout(() => showUserSatisfactionDialog("Upgrade"), 2000)
		}
	}
}

/*
## Stages:

- Trigger stage (Android & iOS)
	Stage number: 0
	What caused the "happy moment". Sending an email, creating a calendar event or doing an
	account upgrade
- Evaluation stage (Android & iOS)
	Stage number: 1
	We ask the user how they like the apps (Tuta Mail and Tuta Calendar)
	We track whether they like the product or if they think they could use improvement
- Rating stage (only for Android)
	Stage number: 2
	We track whether the user is willing to leave a rating on Google Play, or prefers to not do it now.
- Support Tuta stage (Android & iOS)
	Stage number:
		- 2 on iOS
		- 3 on Android
	The user enters this stage when they already left a rating within the last year.
	We track how and if the user would like to support Tuta.
 */

export type TriggerType = "Mail" | "Calendar" | "Upgrade"
type EvaluationButtonType = "LoveIt" | "NeedsWork" | "NotNow"
type RatingButtonType = "RateUs" | "MaybeLater"
export type SupportTutaButtonType = "Upgrade" | "Donate" | "Refer"

export function completeTriggerStage(triggerType: TriggerType) {
	const stage = getStage(0)

	stage.setMetric({
		name: "triggerType",
		value: triggerType,
	})
	void stage.complete()
}

export function completeEvaluationStage(triggerType: TriggerType, buttonType: EvaluationButtonType) {
	const stage = getStage(1)

	stage.setMetric({
		name: "button",
		value: buttonType + "_" + triggerType,
	})
	void stage.complete()
}

export function completeRatingStage(triggerType: TriggerType, buttonType: RatingButtonType) {
	if (!isApp()) return
	const stage = getStage(2)

	stage.setMetric({
		name: "button",
		value: buttonType + "_" + triggerType,
	})
	void stage.complete()
}

export function completeSupportTutaStage(buttonType: SupportTutaButtonType, planType: PlanType) {
	const stage = getStage(isAndroidApp() ? 3 : 2) // 3 for android, 2 for ios or web
	stage.setMetric({
		name: "button",
		value: buttonType + "_" + PlanTypeToName[planType],
	})
	void stage.complete()
}

export function completeUpgradeStage(oldPlan: PlanType, newPlan: PlanType) {
	const stage = getStage(isAndroidApp() ? 4 : 3)
	stage.setMetric({
		name: "plan",
		value: PlanTypeToName[oldPlan] + "_to_" + PlanTypeToName[newPlan],
	})
	void stage.complete()
}

function getStage(stageNumber: number): Stage {
	let testName
	if (!isApp() && isDesktop()) {
		testName = "rating.desktop"
	} else if (!isApp() && isBrowser()) {
		testName = "rating.web"
	} else if (isAndroidApp()) {
		testName = "rating.android"
	} else {
		testName = "rating.ios"
	}

	const test = locator.usageTestController.getTest(testName)
	return test.getStage(stageNumber)
}
