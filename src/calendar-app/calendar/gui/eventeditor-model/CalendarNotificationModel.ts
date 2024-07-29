import { SendMailModel } from "../../../../common/mailFunctionality/SendMailModel.js"
import { CalendarNotificationSender } from "../../view/CalendarNotificationSender.js"
import { LoginController } from "../../../../common/api/main/LoginController.js"
import { CalendarEvent } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import { ProgrammingError } from "../../../../common/api/common/error/ProgrammingError.js"
import { AccountType, CalendarAttendeeStatus } from "../../../../common/api/common/TutanotaConstants.js"
import { clone } from "@tutao/tutanota-utils"
import { TooManyRequestsError } from "../../../../common/api/common/error/RestError.js"
import { UserError } from "../../../../common/api/main/UserError.js"
import { getNonOrganizerAttendees } from "./CalendarEventModel.js"
import { UpgradeRequiredError } from "../../../../common/api/main/UpgradeRequiredError.js"

/** all the people that may be interested in changes to an event get stored in these models.
 * if one of them is null, it's because there is no one that needs that kind of update.
 * */
export type CalendarNotificationSendModels = {
	inviteModel: SendMailModel | null
	updateModel: SendMailModel | null
	cancelModel: SendMailModel | null
	responseModel: SendMailModel | null
}

/** contains the logic to distribute the necessary updates to whom it may concern
 *  and checks the preconditions
 * */
export class CalendarNotificationModel {
	constructor(private readonly notificationSender: CalendarNotificationSender, private readonly loginController: LoginController) {}

	/**
	 * send all notifications required for the new event, determined by the contents of the sendModels parameter.
	 *
	 * will modify the attendee list of newEvent if invites/cancellations are sent.
	 */
	async send(event: CalendarEvent, recurrenceIds: Array<Date>, sendModels: CalendarNotificationSendModels): Promise<void> {
		if (sendModels.updateModel == null && sendModels.cancelModel == null && sendModels.inviteModel == null && sendModels.responseModel == null) {
			return
		}
		if (
			// sending responses is OK for free users.
			(sendModels.updateModel != null || sendModels.cancelModel != null || sendModels.inviteModel != null) &&
			!(await hasPlanWithInvites(this.loginController))
		) {
			const { getAvailablePlansWithCalendarInvites } = await import("../../../../common/subscription/SubscriptionUtils.js")
			throw new UpgradeRequiredError("upgradeRequired_msg", await getAvailablePlansWithCalendarInvites())
		}
		// we need to exclude the exclusions that are only there because of altered instances specifically
		// so google calendar handles our invitations
		const recurrenceTimes = recurrenceIds.map((date) => date.getTime())
		const originalExclusions = event.repeatRule?.excludedDates ?? []
		const filteredExclusions = originalExclusions.filter(({ date }) => !recurrenceTimes.includes(date.getTime()))
		if (event.repeatRule != null) event.repeatRule.excludedDates = filteredExclusions

		try {
			const invitePromise = sendModels.inviteModel != null ? this.sendInvites(event, sendModels.inviteModel) : Promise.resolve()
			const cancelPromise = sendModels.cancelModel != null ? this.sendCancellation(event, sendModels.cancelModel) : Promise.resolve()
			const updatePromise = sendModels.updateModel != null ? this.sendUpdates(event, sendModels.updateModel) : Promise.resolve()
			const responsePromise = sendModels.responseModel != null ? this.respondToOrganizer(event, sendModels.responseModel) : Promise.resolve()
			await Promise.all([invitePromise, cancelPromise, updatePromise, responsePromise])
		} finally {
			if (event.repeatRule != null) event.repeatRule.excludedDates = originalExclusions
		}
	}

	/**
	 * invite all new attendees for an event and set their status from "ADDED" to "NEEDS_ACTION"
	 * @param event will be modified if invites are sent.
	 * @param inviteModel
	 * @private
	 */
	private async sendInvites(event: CalendarEvent, inviteModel: SendMailModel): Promise<void> {
		if (event.organizer == null || inviteModel?.allRecipients().length === 0) {
			throw new ProgrammingError("event has no organizer or no invitable attendees, can't send invites.")
		}
		const newAttendees = getNonOrganizerAttendees(event).filter((a) => a.status === CalendarAttendeeStatus.ADDED)
		await inviteModel.waitForResolvedRecipients()
		if (event.invitedConfidentially != null) {
			inviteModel.setConfidential(event.invitedConfidentially)
		}
		await this.notificationSender.sendInvite(event, inviteModel)
		for (const attendee of newAttendees) {
			if (attendee.status === CalendarAttendeeStatus.ADDED) {
				attendee.status = CalendarAttendeeStatus.NEEDS_ACTION
			}
		}
	}

	private async sendCancellation(event: CalendarEvent, cancelModel: SendMailModel): Promise<void> {
		const updatedEvent = clone(event)

		try {
			if (event.invitedConfidentially != null) {
				cancelModel.setConfidential(event.invitedConfidentially)
			}
			await this.notificationSender.sendCancellation(updatedEvent, cancelModel)
		} catch (e) {
			if (e instanceof TooManyRequestsError) {
				throw new UserError("mailAddressDelay_msg") // This will be caught and open error dialog
			} else {
				throw e
			}
		}
	}

	private async sendUpdates(event: CalendarEvent, updateModel: SendMailModel): Promise<void> {
		await updateModel.waitForResolvedRecipients()
		if (event.invitedConfidentially != null) {
			updateModel.setConfidential(event.invitedConfidentially)
		}
		await this.notificationSender.sendUpdate(event, updateModel)
	}

	/**
	 * send a response mail to the organizer as stated on the original event. calling this for an event that is not an invite or
	 * does not contain address as an attendee or that has no organizer is an error.
	 * @param newEvent the event to send the update for, this should be identical to existingEvent except for the own status.
	 * @param responseModel
	 * @private
	 */
	private async respondToOrganizer(newEvent: CalendarEvent, responseModel: SendMailModel): Promise<void> {
		await responseModel.waitForResolvedRecipients()
		if (newEvent.invitedConfidentially != null) {
			responseModel.setConfidential(newEvent.invitedConfidentially)
		}

		await this.notificationSender.sendResponse(newEvent, responseModel)
		responseModel.dispose()
	}
}

/** determine if we should show the "sending invites is not available for your plan, please upgrade" dialog
 * to the currently logged in user.
 */
export async function hasPlanWithInvites(loginController: LoginController): Promise<boolean> {
	const userController = loginController.getUserController()
	const { user } = userController
	if (user.accountType === AccountType.FREE || user.accountType === AccountType.EXTERNAL) {
		return false
	}

	const customer = await loginController.getUserController().loadCustomer()

	return (await userController.getPlanConfig()).eventInvites
}
