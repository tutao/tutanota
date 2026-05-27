import { showEventsImportDialog } from "./CalendarImporterDialog"
import { CalendarInfoBase } from "../../../calendar-app/calendar/model/CalendarModel"
import { OperationHandle } from "../../api/main/OperationProgressTracker"
import { ImportError } from "../../api/common/error/ImportError"
import { showInfoSnackbar } from "../../../../ui/base/SnackBar"
import { lang, TranslationKey } from "../../../../ui/utils/LanguageViewModel"
import { showProgressDialog } from "../../../../ui/dialogs/ProgressDialog"
import { EventImportRejectionReason } from "../import/CalendarImporter"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { ParsedEventAlarmTuple } from "../../../calendar-app/calendar/export/CalendarParser"
import { Dialog } from "../../../../ui/base/Dialog"
import { TranslationKeyType } from "../../../../ui/utils/TranslationKey"

/**
 * Provides the ability to initiate import-related user interactions.
 */
export class ImportInteractionHandler {
	showEmptyFileMessage() {
		return showInfoSnackbar("emptyIcsFile_msg")
	}

	async doActionWithProgressDialog<T>(message: TranslationKey, action: Promise<T>, operation: OperationHandle): Promise<T> {
		return await showProgressDialog(message, action, operation.progress).finally(() => operation.done())
	}

	/**
	 * Prompts the user to get confirmation to continue the importing procces.
	 *
	 * We will show sequential dialogs stating the number of events and the reason why it is going to be skipped.
	 *
	 * @param rejectedEvents
	 * @param importedParsedEvents
	 */
	async confirmPartialImport(rejectedEvents: Map<EventImportRejectionReason, Array<CalendarEvent>>, importedParsedEvents: ParsedEventAlarmTuple[]) {
		const acceptSkippingIcsDuplicates = await this.partialImportConfirmation(
			rejectedEvents.get(EventImportRejectionReason.DuplicateInIcs) ?? [],
			"importEventIcsDuplicate_msg",
			importedParsedEvents.length,
		)
		if (!acceptSkippingIcsDuplicates) {
			return false
		}

		const acceptSkippingExistingDuplicates = await this.partialImportConfirmation(
			rejectedEvents.get(EventImportRejectionReason.Duplicate) ?? [],
			"importEventExistingUid_msg",
			importedParsedEvents.length,
		)
		if (!acceptSkippingExistingDuplicates) {
			return false
		}

		const acceptSkippingInvalideDates = await this.partialImportConfirmation(
			rejectedEvents.get(EventImportRejectionReason.InvalidDate) ?? [],
			"importInvalidDatesInEvent_msg",
			importedParsedEvents.length,
		)
		if (!acceptSkippingInvalideDates) {
			return false
		}

		const acceptSkippingInversedDates = await this.partialImportConfirmation(
			rejectedEvents.get(EventImportRejectionReason.Inversed) ?? [],
			"importEndNotAfterStartInEvent_msg",
			importedParsedEvents.length,
		)
		if (!acceptSkippingInversedDates) {
			return false
		}

		const acceptSkippingPre1970 = await this.partialImportConfirmation(
			rejectedEvents.get(EventImportRejectionReason.Pre1970) ?? [],
			"importPre1970StartInEvent_msg",
			importedParsedEvents.length,
		)
		if (!acceptSkippingPre1970) {
			return false
		}

		if (Array.from(rejectedEvents.values()).flat().length === importedParsedEvents.length) {
			showInfoSnackbar("noImportableEvents_msg")
			return false
		}

		return true
	}

	showImportSummaryDialog(
		dialogLabel: TranslationKey,
		calendarEvents: CalendarEvent[],
		onConfirmAction: (dialog: Dialog) => unknown,
		calendarInfo: CalendarInfoBase,
	) {
		return showEventsImportDialog(calendarEvents, onConfirmAction, dialogLabel, calendarInfo)
	}

	/**
	 * show an error dialog detailing the reason and amount for events that failed to import
	 */
	private async partialImportConfirmation(skippedEvents: CalendarEvent[], confirmationText: TranslationKeyType, total: number): Promise<boolean> {
		return (
			skippedEvents.length === 0 ||
			(await Dialog.confirm(
				lang.makeTranslation(
					"confirm_msg",
					lang.get(confirmationText, {
						"{amount}": skippedEvents.length + "",
						"{total}": total + "",
					}),
				),
			))
		)
	}

	async showImportEventsError(e: ImportError, calendarEvents: CalendarEvent[]) {
		return Dialog.message(
			lang.getTranslation("importEventsError_msg", {
				"{amount}": e.numFailed,
				"{total}": calendarEvents.length.toString(),
			}),
		)
	}
}
