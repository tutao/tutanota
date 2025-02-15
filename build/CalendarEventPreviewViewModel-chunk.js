import "./dist-chunk.js";
import { ProgrammingError } from "./ProgrammingError-chunk.js";
import "./Env-chunk.js";
import "./ClientDetector-chunk.js";
import { mithril_default } from "./mithril-chunk.js";
import { clone } from "./dist2-chunk.js";
import "./WhitelabelCustomizations-chunk.js";
import "./LanguageViewModel-chunk.js";
import "./styles-chunk.js";
import "./theme-chunk.js";
import "./TutanotaConstants-chunk.js";
import "./KeyManager-chunk.js";
import "./WindowFacade-chunk.js";
import "./RootView-chunk.js";
import "./size-chunk.js";
import "./HtmlUtils-chunk.js";
import "./luxon-chunk.js";
import "./EntityUtils-chunk.js";
import "./TypeModels-chunk.js";
import "./TypeRefs-chunk.js";
import "./CommonCalendarUtils-chunk.js";
import "./TypeModels2-chunk.js";
import "./TypeRefs2-chunk.js";
import "./ParserCombinator-chunk.js";
import { calendarEventHasMoreThanOneOccurrencesLeft } from "./CalendarUtils-chunk.js";
import "./ImportExportUtils-chunk.js";
import "./FormatValidator-chunk.js";
import "./stream-chunk.js";
import "./DeviceConfig-chunk.js";
import "./Logger-chunk.js";
import "./ErrorHandler-chunk.js";
import "./EntityFunctions-chunk.js";
import "./TypeModels3-chunk.js";
import "./ModelInfo-chunk.js";
import "./ErrorUtils-chunk.js";
import { NotFoundError } from "./RestError-chunk.js";
import "./SetupMultipleError-chunk.js";
import "./OutOfSyncError-chunk.js";
import "./CancelledError-chunk.js";
import "./SuspensionError-chunk.js";
import "./LoginIncompleteError-chunk.js";
import "./CryptoError-chunk.js";
import "./RecipientsNotFoundError-chunk.js";
import "./DbError-chunk.js";
import "./QuotaExceededError-chunk.js";
import "./DeviceStorageUnavailableError-chunk.js";
import "./MailBodyTooLargeError-chunk.js";
import "./ImportError-chunk.js";
import "./WebauthnError-chunk.js";
import "./PermissionError-chunk.js";
import "./EntityUpdateUtils-chunk.js";
import "./SessionType-chunk.js";
import "./Services-chunk.js";
import "./EntityClient-chunk.js";
import "./dist3-chunk.js";
import "./BirthdayUtils-chunk.js";
import "./Services2-chunk.js";
import "./GroupUtils-chunk.js";
import "./Button-chunk.js";
import "./Icons-chunk.js";
import "./DialogHeaderBar-chunk.js";
import "./CountryList-chunk.js";
import "./Dialog-chunk.js";
import "./Icon-chunk.js";
import "./AriaUtils-chunk.js";
import "./IconButton-chunk.js";
import "./CalendarEventWhenModel-chunk.js";
import "./Formatter-chunk.js";
import "./ProgressMonitor-chunk.js";
import "./Notifications-chunk.js";
import "./CalendarFacade-chunk.js";
import "./CalendarModel-chunk.js";
import "./GroupUtils2-chunk.js";
import "./CommonLocator-chunk.js";
import "./UserError-chunk.js";
import "./MailAddressParser-chunk.js";
import "./BlobUtils-chunk.js";
import "./FileUtils-chunk.js";
import "./ProgressDialog-chunk.js";
import "./SharedMailUtils-chunk.js";
import "./PasswordUtils-chunk.js";
import "./Recipient-chunk.js";
import "./ContactUtils-chunk.js";
import "./RecipientsModel-chunk.js";
import { CalendarOperation, EventSaveResult, EventType, getNonOrganizerAttendees } from "./CalendarGuiUtils-chunk.js";
import "./UpgradeRequiredError-chunk.js";
import "./ColorPickerModel-chunk.js";
import "./BannerButton-chunk.js";
import "./SubscriptionDialogs-chunk.js";
import "./ExternalLink-chunk.js";
import "./EventPreviewView-chunk.js";
import "./ToggleButton-chunk.js";
import { EventEditorDialog } from "./CalendarEventEditDialog-chunk.js";
import "./DatePicker-chunk.js";
import "./MailRecipientsTextField-chunk.js";
import "./ColumnEmptyMessageBox-chunk.js";
import "./DateParser-chunk.js";
import "./NavButton-chunk.js";
import "./InfoBanner-chunk.js";
import "./SnackBar-chunk.js";
import "./Credentials-chunk.js";
import "./NotificationOverlay-chunk.js";
import "./Checkbox-chunk.js";
import "./Expander-chunk.js";
import "./ClipboardUtils-chunk.js";
import "./Services4-chunk.js";
import "./BubbleButton-chunk.js";
import "./ErrorReporter-chunk.js";
import "./PasswordField-chunk.js";
import "./PasswordRequestDialog-chunk.js";
import "./ErrorHandlerImpl-chunk.js";
import "./InAppRatingDialog-chunk.js";

//#region src/calendar-app/calendar/gui/eventpopup/CalendarEventPreviewViewModel.ts
var CalendarEventPreviewViewModel = class {
	canEdit;
	canDelete;
	canSendUpdates;
	/** for editing, an event that has only one non-deleted instance is still considered repeating
	* because we might reschedule that instance and then unexclude some deleted instances.
	*
	* the ability to edit a single instance also depends on the event type:
	*    * OWN -> I can do what I want
	*    * SHARED_RW -> can edit single instance as if it was my own (since single instance editing locks attendees anyway)
	*    * SHARED_RO, LOCKED, EXTERNAL -> cannot edit at all
	*    * INVITE -> we're not the organizer, we can only set our own attendance globally and send it back to the organizer.
	*          probably the best reason to make single-instance attendee editing possible asap.
	*/
	isRepeatingForEditing;
	sanitizedDescription = null;
	processing = false;
	_ownAttendee;
	/**
	*
	* @param calendarEvent the event to display in the popup
	* @param calendarModel the calendar model where the event can be updated/deleted
	* @param eventType
	* @param hasBusinessFeature if the current user is allowed to do certain operations.
	* @param ownAttendee will be cloned to have a copy that's not influencing the actual event but can be changed to quickly update the UI
	* @param lazyIndexEntry async function to resolve the progenitor of the shown event
	* @param eventModelFactory
	* @param uiUpdateCallback
	*/
	constructor(calendarEvent, calendarModel, eventType, hasBusinessFeature, ownAttendee, lazyIndexEntry, eventModelFactory, uiUpdateCallback = mithril_default.redraw) {
		this.calendarEvent = calendarEvent;
		this.calendarModel = calendarModel;
		this.eventType = eventType;
		this.hasBusinessFeature = hasBusinessFeature;
		this.lazyIndexEntry = lazyIndexEntry;
		this.eventModelFactory = eventModelFactory;
		this.uiUpdateCallback = uiUpdateCallback;
		this._ownAttendee = clone(ownAttendee);
		if (this.calendarEvent._ownerGroup == null) {
			this.canEdit = false;
			this.canDelete = false;
			this.canSendUpdates = false;
		} else {
			this.canEdit = this.eventType === EventType.OWN || this.eventType === EventType.SHARED_RW || this.eventType === EventType.LOCKED || this.eventType === EventType.INVITE;
			this.canDelete = this.canEdit || this.eventType === EventType.INVITE;
			this.canSendUpdates = hasBusinessFeature && this.eventType === EventType.OWN && getNonOrganizerAttendees(calendarEvent).length > 0;
		}
		this.isRepeatingForEditing = (calendarEvent.repeatRule != null || calendarEvent.recurrenceId != null) && (eventType === EventType.OWN || eventType === EventType.SHARED_RW);
	}
	/** for deleting, an event that has only one non-deleted instance behaves as if it wasn't repeating
	* because deleting the last instance is the same as deleting the whole event from the pov of the user.
	*/
	async isRepeatingForDeleting() {
		const index = await this.lazyIndexEntry();
		if (index == null) return false;
		return calendarEventHasMoreThanOneOccurrencesLeft(index);
	}
	get ownAttendee() {
		return this._ownAttendee;
	}
	/** return an object enabling us to set and display the participation correctly if this is an event we're invited to, null otherwise.
	* note that the Promise<unknown> type on setParticipation prevents us from leaking errors when consumers call it and try to catch errors without
	* awaiting it (they get an async call without await warning) */
	getParticipationSetterAndThen(action) {
		if (this.ownAttendee == null || this.eventType !== EventType.INVITE) return null;
		return {
			ownAttendee: this.ownAttendee,
			setParticipation: async (status) => {
				await this.setOwnAttendance(status);
				action();
			}
		};
	}
	async setOwnAttendance(status) {
		if (this.calendarEvent.organizer == null || this.ownAttendee == null || this.processing || this._ownAttendee?.status === status) return;
		const oldStatus = this.ownAttendee.status;
		this.processing = true;
		try {
			this.ownAttendee.status = status;
			this.uiUpdateCallback();
			const model = await this.eventModelFactory(CalendarOperation.EditAll);
			if (model) {
				model.editModels.whoModel.setOwnAttendance(status);
				model.editModels.whoModel.isConfidential = this.calendarEvent.invitedConfidentially ?? false;
				await model.apply();
			} else this.ownAttendee.status = oldStatus;
		} catch (e) {
			this.ownAttendee.status = oldStatus;
			throw e;
		} finally {
			this.processing = false;
		}
	}
	/** add an exclusion for this event instances start time on the original event.
	* if this is a rescheduled instance, we will just delete the event because the progenitor already
	* has an exclusion for this time.
	* */
	async deleteSingle() {
		try {
			const model = await this.eventModelFactory(CalendarOperation.DeleteThis);
			await model?.apply();
		} catch (e) {
			if (!(e instanceof NotFoundError)) throw e;
		}
	}
	async deleteAll() {
		try {
			const model = await this.eventModelFactory(CalendarOperation.DeleteAll);
			await model?.apply();
		} catch (e) {
			if (!(e instanceof NotFoundError)) throw e;
		}
	}
	async editSingle() {
		const model = await this.eventModelFactory(CalendarOperation.EditThis);
		if (model == null) return;
		try {
			const eventEditor = new EventEditorDialog();
			return await eventEditor.showExistingCalendarEventEditDialog(model, {
				uid: this.calendarEvent.uid,
				sequence: this.calendarEvent.sequence,
				recurrenceId: this.calendarEvent.startTime
			});
		} catch (err) {
			if (err instanceof NotFoundError) console.log("occurrence not found when clicking on the event");
else throw err;
		}
		throw new ProgrammingError("not implemented");
	}
	async editAll() {
		const model = await this.eventModelFactory(CalendarOperation.EditAll);
		if (model == null) return;
		try {
			const eventEditor = new EventEditorDialog();
			return await eventEditor.showExistingCalendarEventEditDialog(model, {
				uid: this.calendarEvent.uid,
				sequence: this.calendarEvent.sequence,
				recurrenceId: null
			});
		} catch (err) {
			if (err instanceof NotFoundError) console.log("calendar event not found when clicking on the event");
else throw err;
		}
	}
	async sendUpdates() {
		const model = await this.eventModelFactory(CalendarOperation.EditAll);
		if (model == null) return EventSaveResult.Failed;
		try {
			model.editModels.whoModel.shouldSendUpdates = true;
			await model.apply();
			return EventSaveResult.Saved;
		} finally {
			model.editModels.whoModel.shouldSendUpdates = false;
		}
	}
	async sanitizeDescription() {
		const { htmlSanitizer } = await import("./HtmlSanitizer2-chunk.js");
		this.sanitizedDescription = htmlSanitizer.sanitizeHTML(this.calendarEvent.description, { blockExternalContent: true }).html;
	}
	getSanitizedDescription() {
		return this.sanitizedDescription;
	}
};

//#endregion
export { CalendarEventPreviewViewModel };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FsZW5kYXJFdmVudFByZXZpZXdWaWV3TW9kZWwtY2h1bmsuanMiLCJuYW1lcyI6WyJjYWxlbmRhckV2ZW50OiBSZWFkb25seTxDYWxlbmRhckV2ZW50PiIsImNhbGVuZGFyTW9kZWw6IENhbGVuZGFyTW9kZWwiLCJldmVudFR5cGU6IEV2ZW50VHlwZSIsImhhc0J1c2luZXNzRmVhdHVyZTogYm9vbGVhbiIsIm93bkF0dGVuZGVlOiBDYWxlbmRhckV2ZW50QXR0ZW5kZWUgfCBudWxsIiwibGF6eUluZGV4RW50cnk6ICgpID0+IFByb21pc2U8Q2FsZW5kYXJFdmVudFVpZEluZGV4RW50cnkgfCBudWxsPiIsImV2ZW50TW9kZWxGYWN0b3J5OiAobW9kZTogQ2FsZW5kYXJPcGVyYXRpb24pID0+IFByb21pc2U8Q2FsZW5kYXJFdmVudE1vZGVsIHwgbnVsbD4iLCJ1aVVwZGF0ZUNhbGxiYWNrOiAoKSA9PiB2b2lkIiwibSIsImFjdGlvbjogVGh1bmsiLCJzdGF0dXM6IENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMiXSwic291cmNlcyI6WyIuLi9zcmMvY2FsZW5kYXItYXBwL2NhbGVuZGFyL2d1aS9ldmVudHBvcHVwL0NhbGVuZGFyRXZlbnRQcmV2aWV3Vmlld01vZGVsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENhbGVuZGFyRXZlbnQsIENhbGVuZGFyRXZlbnRBdHRlbmRlZSB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IGNhbGVuZGFyRXZlbnRIYXNNb3JlVGhhbk9uZU9jY3VycmVuY2VzTGVmdCB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vY2FsZW5kYXIvZGF0ZS9DYWxlbmRhclV0aWxzLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRNb2RlbCwgQ2FsZW5kYXJPcGVyYXRpb24sIEV2ZW50U2F2ZVJlc3VsdCwgRXZlbnRUeXBlLCBnZXROb25Pcmdhbml6ZXJBdHRlbmRlZXMgfSBmcm9tIFwiLi4vZXZlbnRlZGl0b3ItbW9kZWwvQ2FsZW5kYXJFdmVudE1vZGVsLmpzXCJcbmltcG9ydCB7IE5vdEZvdW5kRXJyb3IgfSBmcm9tIFwiLi4vLi4vLi4vLi4vY29tbW9uL2FwaS9jb21tb24vZXJyb3IvUmVzdEVycm9yLmpzXCJcbmltcG9ydCB7IENhbGVuZGFyTW9kZWwgfSBmcm9tIFwiLi4vLi4vbW9kZWwvQ2FsZW5kYXJNb2RlbC5qc1wiXG5pbXBvcnQgeyBQcm9ncmFtbWluZ0Vycm9yIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvY29tbW9uL2Vycm9yL1Byb2dyYW1taW5nRXJyb3IuanNcIlxuaW1wb3J0IHsgQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cyB9IGZyb20gXCIuLi8uLi8uLi8uLi9jb21tb24vYXBpL2NvbW1vbi9UdXRhbm90YUNvbnN0YW50cy5qc1wiXG5pbXBvcnQgbSBmcm9tIFwibWl0aHJpbFwiXG5pbXBvcnQgeyBjbG9uZSwgVGh1bmsgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCJcbmltcG9ydCB7IENhbGVuZGFyRXZlbnRVaWRJbmRleEVudHJ5IH0gZnJvbSBcIi4uLy4uLy4uLy4uL2NvbW1vbi9hcGkvd29ya2VyL2ZhY2FkZXMvbGF6eS9DYWxlbmRhckZhY2FkZS5qc1wiXG5pbXBvcnQgeyBFdmVudEVkaXRvckRpYWxvZyB9IGZyb20gXCIuLi9ldmVudGVkaXRvci12aWV3L0NhbGVuZGFyRXZlbnRFZGl0RGlhbG9nLmpzXCJcblxuLyoqXG4gKiBtYWtlcyBkZWNpc2lvbnMgYWJvdXQgd2hpY2ggb3BlcmF0aW9ucyBhcmUgYXZhaWxhYmxlIGZyb20gdGhlIHBvcHVwIGFuZCBrbm93cyBob3cgdG8gaW1wbGVtZW50IHRoZW0gZGVwZW5kaW5nIG9uIHRoZSBldmVudCdzIHR5cGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBDYWxlbmRhckV2ZW50UHJldmlld1ZpZXdNb2RlbCB7XG5cdHJlYWRvbmx5IGNhbkVkaXQ6IGJvb2xlYW5cblx0cmVhZG9ubHkgY2FuRGVsZXRlOiBib29sZWFuXG5cdHJlYWRvbmx5IGNhblNlbmRVcGRhdGVzOiBib29sZWFuXG5cdC8qKiBmb3IgZWRpdGluZywgYW4gZXZlbnQgdGhhdCBoYXMgb25seSBvbmUgbm9uLWRlbGV0ZWQgaW5zdGFuY2UgaXMgc3RpbGwgY29uc2lkZXJlZCByZXBlYXRpbmdcblx0ICogYmVjYXVzZSB3ZSBtaWdodCByZXNjaGVkdWxlIHRoYXQgaW5zdGFuY2UgYW5kIHRoZW4gdW5leGNsdWRlIHNvbWUgZGVsZXRlZCBpbnN0YW5jZXMuXG5cdCAqXG5cdCAqIHRoZSBhYmlsaXR5IHRvIGVkaXQgYSBzaW5nbGUgaW5zdGFuY2UgYWxzbyBkZXBlbmRzIG9uIHRoZSBldmVudCB0eXBlOlxuXHQgKiAgICAqIE9XTiAtPiBJIGNhbiBkbyB3aGF0IEkgd2FudFxuXHQgKiAgICAqIFNIQVJFRF9SVyAtPiBjYW4gZWRpdCBzaW5nbGUgaW5zdGFuY2UgYXMgaWYgaXQgd2FzIG15IG93biAoc2luY2Ugc2luZ2xlIGluc3RhbmNlIGVkaXRpbmcgbG9ja3MgYXR0ZW5kZWVzIGFueXdheSlcblx0ICogICAgKiBTSEFSRURfUk8sIExPQ0tFRCwgRVhURVJOQUwgLT4gY2Fubm90IGVkaXQgYXQgYWxsXG5cdCAqICAgICogSU5WSVRFIC0+IHdlJ3JlIG5vdCB0aGUgb3JnYW5pemVyLCB3ZSBjYW4gb25seSBzZXQgb3VyIG93biBhdHRlbmRhbmNlIGdsb2JhbGx5IGFuZCBzZW5kIGl0IGJhY2sgdG8gdGhlIG9yZ2FuaXplci5cblx0ICogICAgICAgICAgcHJvYmFibHkgdGhlIGJlc3QgcmVhc29uIHRvIG1ha2Ugc2luZ2xlLWluc3RhbmNlIGF0dGVuZGVlIGVkaXRpbmcgcG9zc2libGUgYXNhcC5cblx0ICovXG5cdHJlYWRvbmx5IGlzUmVwZWF0aW5nRm9yRWRpdGluZzogYm9vbGVhblxuXG5cdHByaXZhdGUgc2FuaXRpemVkRGVzY3JpcHRpb246IHN0cmluZyB8IG51bGwgPSBudWxsXG5cblx0cHJpdmF0ZSBwcm9jZXNzaW5nOiBib29sZWFuID0gZmFsc2Vcblx0cHJpdmF0ZSByZWFkb25seSBfb3duQXR0ZW5kZWU6IENhbGVuZGFyRXZlbnRBdHRlbmRlZSB8IG51bGxcblxuXHQvKipcblx0ICpcblx0ICogQHBhcmFtIGNhbGVuZGFyRXZlbnQgdGhlIGV2ZW50IHRvIGRpc3BsYXkgaW4gdGhlIHBvcHVwXG5cdCAqIEBwYXJhbSBjYWxlbmRhck1vZGVsIHRoZSBjYWxlbmRhciBtb2RlbCB3aGVyZSB0aGUgZXZlbnQgY2FuIGJlIHVwZGF0ZWQvZGVsZXRlZFxuXHQgKiBAcGFyYW0gZXZlbnRUeXBlXG5cdCAqIEBwYXJhbSBoYXNCdXNpbmVzc0ZlYXR1cmUgaWYgdGhlIGN1cnJlbnQgdXNlciBpcyBhbGxvd2VkIHRvIGRvIGNlcnRhaW4gb3BlcmF0aW9ucy5cblx0ICogQHBhcmFtIG93bkF0dGVuZGVlIHdpbGwgYmUgY2xvbmVkIHRvIGhhdmUgYSBjb3B5IHRoYXQncyBub3QgaW5mbHVlbmNpbmcgdGhlIGFjdHVhbCBldmVudCBidXQgY2FuIGJlIGNoYW5nZWQgdG8gcXVpY2tseSB1cGRhdGUgdGhlIFVJXG5cdCAqIEBwYXJhbSBsYXp5SW5kZXhFbnRyeSBhc3luYyBmdW5jdGlvbiB0byByZXNvbHZlIHRoZSBwcm9nZW5pdG9yIG9mIHRoZSBzaG93biBldmVudFxuXHQgKiBAcGFyYW0gZXZlbnRNb2RlbEZhY3Rvcnlcblx0ICogQHBhcmFtIHVpVXBkYXRlQ2FsbGJhY2tcblx0ICovXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHJlYWRvbmx5IGNhbGVuZGFyRXZlbnQ6IFJlYWRvbmx5PENhbGVuZGFyRXZlbnQ+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgY2FsZW5kYXJNb2RlbDogQ2FsZW5kYXJNb2RlbCxcblx0XHRyZWFkb25seSBldmVudFR5cGU6IEV2ZW50VHlwZSxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGhhc0J1c2luZXNzRmVhdHVyZTogYm9vbGVhbixcblx0XHRvd25BdHRlbmRlZTogQ2FsZW5kYXJFdmVudEF0dGVuZGVlIHwgbnVsbCxcblx0XHRwcml2YXRlIHJlYWRvbmx5IGxhenlJbmRleEVudHJ5OiAoKSA9PiBQcm9taXNlPENhbGVuZGFyRXZlbnRVaWRJbmRleEVudHJ5IHwgbnVsbD4sXG5cdFx0cHJpdmF0ZSByZWFkb25seSBldmVudE1vZGVsRmFjdG9yeTogKG1vZGU6IENhbGVuZGFyT3BlcmF0aW9uKSA9PiBQcm9taXNlPENhbGVuZGFyRXZlbnRNb2RlbCB8IG51bGw+LFxuXHRcdHByaXZhdGUgcmVhZG9ubHkgdWlVcGRhdGVDYWxsYmFjazogKCkgPT4gdm9pZCA9IG0ucmVkcmF3LFxuXHQpIHtcblx0XHR0aGlzLl9vd25BdHRlbmRlZSA9IGNsb25lKG93bkF0dGVuZGVlKVxuXHRcdGlmICh0aGlzLmNhbGVuZGFyRXZlbnQuX293bmVyR3JvdXAgPT0gbnVsbCkge1xuXHRcdFx0dGhpcy5jYW5FZGl0ID0gZmFsc2Vcblx0XHRcdHRoaXMuY2FuRGVsZXRlID0gZmFsc2Vcblx0XHRcdHRoaXMuY2FuU2VuZFVwZGF0ZXMgPSBmYWxzZVxuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBwYXJ0aWFsbHkgZWRpdGFibGUgKGFkZGluZyBhbGFybXMpIGNvdW50cyBhcyBlZGl0YWJsZS5cblx0XHRcdHRoaXMuY2FuRWRpdCA9XG5cdFx0XHRcdHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuT1dOIHx8XG5cdFx0XHRcdHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuU0hBUkVEX1JXIHx8XG5cdFx0XHRcdHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuTE9DS0VEIHx8XG5cdFx0XHRcdHRoaXMuZXZlbnRUeXBlID09PSBFdmVudFR5cGUuSU5WSVRFXG5cdFx0XHR0aGlzLmNhbkRlbGV0ZSA9IHRoaXMuY2FuRWRpdCB8fCB0aGlzLmV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLklOVklURVxuXHRcdFx0dGhpcy5jYW5TZW5kVXBkYXRlcyA9IGhhc0J1c2luZXNzRmVhdHVyZSAmJiB0aGlzLmV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLk9XTiAmJiBnZXROb25Pcmdhbml6ZXJBdHRlbmRlZXMoY2FsZW5kYXJFdmVudCkubGVuZ3RoID4gMFxuXHRcdH1cblxuXHRcdHRoaXMuaXNSZXBlYXRpbmdGb3JFZGl0aW5nID1cblx0XHRcdChjYWxlbmRhckV2ZW50LnJlcGVhdFJ1bGUgIT0gbnVsbCB8fCBjYWxlbmRhckV2ZW50LnJlY3VycmVuY2VJZCAhPSBudWxsKSAmJiAoZXZlbnRUeXBlID09PSBFdmVudFR5cGUuT1dOIHx8IGV2ZW50VHlwZSA9PT0gRXZlbnRUeXBlLlNIQVJFRF9SVylcblx0fVxuXG5cdC8qKiBmb3IgZGVsZXRpbmcsIGFuIGV2ZW50IHRoYXQgaGFzIG9ubHkgb25lIG5vbi1kZWxldGVkIGluc3RhbmNlIGJlaGF2ZXMgYXMgaWYgaXQgd2Fzbid0IHJlcGVhdGluZ1xuXHQgKiBiZWNhdXNlIGRlbGV0aW5nIHRoZSBsYXN0IGluc3RhbmNlIGlzIHRoZSBzYW1lIGFzIGRlbGV0aW5nIHRoZSB3aG9sZSBldmVudCBmcm9tIHRoZSBwb3Ygb2YgdGhlIHVzZXIuXG5cdCAqL1xuXHRhc3luYyBpc1JlcGVhdGluZ0ZvckRlbGV0aW5nKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuXHRcdGNvbnN0IGluZGV4ID0gYXdhaXQgdGhpcy5sYXp5SW5kZXhFbnRyeSgpXG5cdFx0aWYgKGluZGV4ID09IG51bGwpIHJldHVybiBmYWxzZVxuXHRcdHJldHVybiBjYWxlbmRhckV2ZW50SGFzTW9yZVRoYW5PbmVPY2N1cnJlbmNlc0xlZnQoaW5kZXgpXG5cdH1cblxuXHRnZXQgb3duQXR0ZW5kZWUoKTogQ2FsZW5kYXJFdmVudEF0dGVuZGVlIHwgbnVsbCB7XG5cdFx0cmV0dXJuIHRoaXMuX293bkF0dGVuZGVlXG5cdH1cblxuXHQvKiogcmV0dXJuIGFuIG9iamVjdCBlbmFibGluZyB1cyB0byBzZXQgYW5kIGRpc3BsYXkgdGhlIHBhcnRpY2lwYXRpb24gY29ycmVjdGx5IGlmIHRoaXMgaXMgYW4gZXZlbnQgd2UncmUgaW52aXRlZCB0bywgbnVsbCBvdGhlcndpc2UuXG5cdCAqIG5vdGUgdGhhdCB0aGUgUHJvbWlzZTx1bmtub3duPiB0eXBlIG9uIHNldFBhcnRpY2lwYXRpb24gcHJldmVudHMgdXMgZnJvbSBsZWFraW5nIGVycm9ycyB3aGVuIGNvbnN1bWVycyBjYWxsIGl0IGFuZCB0cnkgdG8gY2F0Y2ggZXJyb3JzIHdpdGhvdXRcblx0ICogYXdhaXRpbmcgaXQgKHRoZXkgZ2V0IGFuIGFzeW5jIGNhbGwgd2l0aG91dCBhd2FpdCB3YXJuaW5nKSAqL1xuXHRnZXRQYXJ0aWNpcGF0aW9uU2V0dGVyQW5kVGhlbihhY3Rpb246IFRodW5rKTogbnVsbCB8IHtcblx0XHRvd25BdHRlbmRlZTogQ2FsZW5kYXJFdmVudEF0dGVuZGVlXG5cdFx0c2V0UGFydGljaXBhdGlvbjogKHN0YXR1czogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cykgPT4gUHJvbWlzZTx1bmtub3duPlxuXHR9IHtcblx0XHRpZiAodGhpcy5vd25BdHRlbmRlZSA9PSBudWxsIHx8IHRoaXMuZXZlbnRUeXBlICE9PSBFdmVudFR5cGUuSU5WSVRFKSByZXR1cm4gbnVsbFxuXHRcdHJldHVybiB7XG5cdFx0XHRvd25BdHRlbmRlZTogdGhpcy5vd25BdHRlbmRlZSxcblx0XHRcdHNldFBhcnRpY2lwYXRpb246IGFzeW5jIChzdGF0dXMpID0+IHtcblx0XHRcdFx0YXdhaXQgdGhpcy5zZXRPd25BdHRlbmRhbmNlKHN0YXR1cylcblx0XHRcdFx0YWN0aW9uKClcblx0XHRcdH0sXG5cdFx0fVxuXHR9XG5cblx0cHJpdmF0ZSBhc3luYyBzZXRPd25BdHRlbmRhbmNlKHN0YXR1czogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cyk6IFByb21pc2U8dm9pZD4ge1xuXHRcdGlmICh0aGlzLmNhbGVuZGFyRXZlbnQub3JnYW5pemVyID09IG51bGwgfHwgdGhpcy5vd25BdHRlbmRlZSA9PSBudWxsIHx8IHRoaXMucHJvY2Vzc2luZyB8fCB0aGlzLl9vd25BdHRlbmRlZT8uc3RhdHVzID09PSBzdGF0dXMpIHJldHVyblxuXHRcdGNvbnN0IG9sZFN0YXR1cyA9IHRoaXMub3duQXR0ZW5kZWUuc3RhdHVzXG5cdFx0dGhpcy5wcm9jZXNzaW5nID0gdHJ1ZVxuXHRcdHRyeSB7XG5cdFx0XHR0aGlzLm93bkF0dGVuZGVlLnN0YXR1cyA9IHN0YXR1c1xuXHRcdFx0dGhpcy51aVVwZGF0ZUNhbGxiYWNrKClcblx0XHRcdC8vIG5vIHBlci1pbnN0YW5jZSBhdHRlbmRlZXMgeWV0LlxuXHRcdFx0Y29uc3QgbW9kZWwgPSBhd2FpdCB0aGlzLmV2ZW50TW9kZWxGYWN0b3J5KENhbGVuZGFyT3BlcmF0aW9uLkVkaXRBbGwpXG5cdFx0XHRpZiAobW9kZWwpIHtcblx0XHRcdFx0bW9kZWwuZWRpdE1vZGVscy53aG9Nb2RlbC5zZXRPd25BdHRlbmRhbmNlKHN0YXR1cylcblx0XHRcdFx0bW9kZWwuZWRpdE1vZGVscy53aG9Nb2RlbC5pc0NvbmZpZGVudGlhbCA9IHRoaXMuY2FsZW5kYXJFdmVudC5pbnZpdGVkQ29uZmlkZW50aWFsbHkgPz8gZmFsc2Vcblx0XHRcdFx0YXdhaXQgbW9kZWwuYXBwbHkoKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5vd25BdHRlbmRlZS5zdGF0dXMgPSBvbGRTdGF0dXNcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHR0aGlzLm93bkF0dGVuZGVlLnN0YXR1cyA9IG9sZFN0YXR1c1xuXHRcdFx0dGhyb3cgZVxuXHRcdH0gZmluYWxseSB7XG5cdFx0XHR0aGlzLnByb2Nlc3NpbmcgPSBmYWxzZVxuXHRcdH1cblx0fVxuXG5cdC8qKiBhZGQgYW4gZXhjbHVzaW9uIGZvciB0aGlzIGV2ZW50IGluc3RhbmNlcyBzdGFydCB0aW1lIG9uIHRoZSBvcmlnaW5hbCBldmVudC5cblx0ICogaWYgdGhpcyBpcyBhIHJlc2NoZWR1bGVkIGluc3RhbmNlLCB3ZSB3aWxsIGp1c3QgZGVsZXRlIHRoZSBldmVudCBiZWNhdXNlIHRoZSBwcm9nZW5pdG9yIGFscmVhZHlcblx0ICogaGFzIGFuIGV4Y2x1c2lvbiBmb3IgdGhpcyB0aW1lLlxuXHQgKiAqL1xuXHRhc3luYyBkZWxldGVTaW5nbGUoKSB7XG5cdFx0dHJ5IHtcblx0XHRcdGNvbnN0IG1vZGVsID0gYXdhaXQgdGhpcy5ldmVudE1vZGVsRmFjdG9yeShDYWxlbmRhck9wZXJhdGlvbi5EZWxldGVUaGlzKVxuXHRcdFx0YXdhaXQgbW9kZWw/LmFwcGx5KClcblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRpZiAoIShlIGluc3RhbmNlb2YgTm90Rm91bmRFcnJvcikpIHtcblx0XHRcdFx0dGhyb3cgZVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGFzeW5jIGRlbGV0ZUFsbCgpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgbW9kZWwgPSBhd2FpdCB0aGlzLmV2ZW50TW9kZWxGYWN0b3J5KENhbGVuZGFyT3BlcmF0aW9uLkRlbGV0ZUFsbClcblx0XHRcdGF3YWl0IG1vZGVsPy5hcHBseSgpXG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKCEoZSBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpKSB7XG5cdFx0XHRcdHRocm93IGVcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRhc3luYyBlZGl0U2luZ2xlKCkge1xuXHRcdGNvbnN0IG1vZGVsID0gYXdhaXQgdGhpcy5ldmVudE1vZGVsRmFjdG9yeShDYWxlbmRhck9wZXJhdGlvbi5FZGl0VGhpcylcblx0XHRpZiAobW9kZWwgPT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuXG5cdFx0fVxuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBldmVudEVkaXRvciA9IG5ldyBFdmVudEVkaXRvckRpYWxvZygpXG5cdFx0XHRyZXR1cm4gYXdhaXQgZXZlbnRFZGl0b3Iuc2hvd0V4aXN0aW5nQ2FsZW5kYXJFdmVudEVkaXREaWFsb2cobW9kZWwsIHtcblx0XHRcdFx0dWlkOiB0aGlzLmNhbGVuZGFyRXZlbnQudWlkLFxuXHRcdFx0XHRzZXF1ZW5jZTogdGhpcy5jYWxlbmRhckV2ZW50LnNlcXVlbmNlLFxuXHRcdFx0XHRyZWN1cnJlbmNlSWQ6IHRoaXMuY2FsZW5kYXJFdmVudC5zdGFydFRpbWUsXG5cdFx0XHR9KVxuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0aWYgKGVyciBpbnN0YW5jZW9mIE5vdEZvdW5kRXJyb3IpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJvY2N1cnJlbmNlIG5vdCBmb3VuZCB3aGVuIGNsaWNraW5nIG9uIHRoZSBldmVudFwiKVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhyb3cgZXJyXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhyb3cgbmV3IFByb2dyYW1taW5nRXJyb3IoXCJub3QgaW1wbGVtZW50ZWRcIilcblx0fVxuXG5cdGFzeW5jIGVkaXRBbGwoKSB7XG5cdFx0Y29uc3QgbW9kZWwgPSBhd2FpdCB0aGlzLmV2ZW50TW9kZWxGYWN0b3J5KENhbGVuZGFyT3BlcmF0aW9uLkVkaXRBbGwpXG5cdFx0aWYgKG1vZGVsID09IG51bGwpIHtcblx0XHRcdHJldHVyblxuXHRcdH1cblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgZXZlbnRFZGl0b3IgPSBuZXcgRXZlbnRFZGl0b3JEaWFsb2coKVxuXHRcdFx0cmV0dXJuIGF3YWl0IGV2ZW50RWRpdG9yLnNob3dFeGlzdGluZ0NhbGVuZGFyRXZlbnRFZGl0RGlhbG9nKG1vZGVsLCB7XG5cdFx0XHRcdHVpZDogdGhpcy5jYWxlbmRhckV2ZW50LnVpZCxcblx0XHRcdFx0c2VxdWVuY2U6IHRoaXMuY2FsZW5kYXJFdmVudC5zZXF1ZW5jZSxcblx0XHRcdFx0cmVjdXJyZW5jZUlkOiBudWxsLFxuXHRcdFx0fSlcblx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdGlmIChlcnIgaW5zdGFuY2VvZiBOb3RGb3VuZEVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiY2FsZW5kYXIgZXZlbnQgbm90IGZvdW5kIHdoZW4gY2xpY2tpbmcgb24gdGhlIGV2ZW50XCIpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aHJvdyBlcnJcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRhc3luYyBzZW5kVXBkYXRlcygpOiBQcm9taXNlPEV2ZW50U2F2ZVJlc3VsdD4ge1xuXHRcdGNvbnN0IG1vZGVsID0gYXdhaXQgdGhpcy5ldmVudE1vZGVsRmFjdG9yeShDYWxlbmRhck9wZXJhdGlvbi5FZGl0QWxsKVxuXHRcdGlmIChtb2RlbCA9PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gRXZlbnRTYXZlUmVzdWx0LkZhaWxlZFxuXHRcdH1cblx0XHR0cnkge1xuXHRcdFx0bW9kZWwuZWRpdE1vZGVscy53aG9Nb2RlbC5zaG91bGRTZW5kVXBkYXRlcyA9IHRydWVcblx0XHRcdGF3YWl0IG1vZGVsLmFwcGx5KClcblx0XHRcdHJldHVybiBFdmVudFNhdmVSZXN1bHQuU2F2ZWRcblx0XHR9IGZpbmFsbHkge1xuXHRcdFx0bW9kZWwuZWRpdE1vZGVscy53aG9Nb2RlbC5zaG91bGRTZW5kVXBkYXRlcyA9IGZhbHNlXG5cdFx0fVxuXHR9XG5cblx0YXN5bmMgc2FuaXRpemVEZXNjcmlwdGlvbigpOiBQcm9taXNlPHZvaWQ+IHtcblx0XHRjb25zdCB7IGh0bWxTYW5pdGl6ZXIgfSA9IGF3YWl0IGltcG9ydChcIi4uLy4uLy4uLy4uL2NvbW1vbi9taXNjL0h0bWxTYW5pdGl6ZXIuanNcIilcblx0XHR0aGlzLnNhbml0aXplZERlc2NyaXB0aW9uID0gaHRtbFNhbml0aXplci5zYW5pdGl6ZUhUTUwodGhpcy5jYWxlbmRhckV2ZW50LmRlc2NyaXB0aW9uLCB7XG5cdFx0XHRibG9ja0V4dGVybmFsQ29udGVudDogdHJ1ZSxcblx0XHR9KS5odG1sXG5cdH1cblxuXHRnZXRTYW5pdGl6ZWREZXNjcmlwdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5zYW5pdGl6ZWREZXNjcmlwdGlvblxuXHR9XG59XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWVhLGdDQUFOLE1BQW9DO0NBQzFDLEFBQVM7Q0FDVCxBQUFTO0NBQ1QsQUFBUzs7Ozs7Ozs7Ozs7Q0FXVCxBQUFTO0NBRVQsQUFBUSx1QkFBc0M7Q0FFOUMsQUFBUSxhQUFzQjtDQUM5QixBQUFpQjs7Ozs7Ozs7Ozs7O0NBYWpCLFlBQ1VBLGVBQ1FDLGVBQ1JDLFdBQ1FDLG9CQUNqQkMsYUFDaUJDLGdCQUNBQyxtQkFDQUMsbUJBQStCQyxnQkFBRSxRQUNqRDtFQTBLRixLQWxMVTtFQWtMVCxLQWpMaUI7RUFpTGhCLEtBaExRO0VBZ0xQLEtBL0tlO0VBK0tkLEtBN0tjO0VBNktiLEtBNUthO0VBNEtaLEtBM0tZO0FBRWpCLE9BQUssZUFBZSxNQUFNLFlBQVk7QUFDdEMsTUFBSSxLQUFLLGNBQWMsZUFBZSxNQUFNO0FBQzNDLFFBQUssVUFBVTtBQUNmLFFBQUssWUFBWTtBQUNqQixRQUFLLGlCQUFpQjtFQUN0QixPQUFNO0FBRU4sUUFBSyxVQUNKLEtBQUssY0FBYyxVQUFVLE9BQzdCLEtBQUssY0FBYyxVQUFVLGFBQzdCLEtBQUssY0FBYyxVQUFVLFVBQzdCLEtBQUssY0FBYyxVQUFVO0FBQzlCLFFBQUssWUFBWSxLQUFLLFdBQVcsS0FBSyxjQUFjLFVBQVU7QUFDOUQsUUFBSyxpQkFBaUIsc0JBQXNCLEtBQUssY0FBYyxVQUFVLE9BQU8seUJBQXlCLGNBQWMsQ0FBQyxTQUFTO0VBQ2pJO0FBRUQsT0FBSyx5QkFDSCxjQUFjLGNBQWMsUUFBUSxjQUFjLGdCQUFnQixVQUFVLGNBQWMsVUFBVSxPQUFPLGNBQWMsVUFBVTtDQUNySTs7OztDQUtELE1BQU0seUJBQTJDO0VBQ2hELE1BQU0sUUFBUSxNQUFNLEtBQUssZ0JBQWdCO0FBQ3pDLE1BQUksU0FBUyxLQUFNLFFBQU87QUFDMUIsU0FBTywyQ0FBMkMsTUFBTTtDQUN4RDtDQUVELElBQUksY0FBNEM7QUFDL0MsU0FBTyxLQUFLO0NBQ1o7Ozs7Q0FLRCw4QkFBOEJDLFFBRzVCO0FBQ0QsTUFBSSxLQUFLLGVBQWUsUUFBUSxLQUFLLGNBQWMsVUFBVSxPQUFRLFFBQU87QUFDNUUsU0FBTztHQUNOLGFBQWEsS0FBSztHQUNsQixrQkFBa0IsT0FBTyxXQUFXO0FBQ25DLFVBQU0sS0FBSyxpQkFBaUIsT0FBTztBQUNuQyxZQUFRO0dBQ1I7RUFDRDtDQUNEO0NBRUQsTUFBYyxpQkFBaUJDLFFBQStDO0FBQzdFLE1BQUksS0FBSyxjQUFjLGFBQWEsUUFBUSxLQUFLLGVBQWUsUUFBUSxLQUFLLGNBQWMsS0FBSyxjQUFjLFdBQVcsT0FBUTtFQUNqSSxNQUFNLFlBQVksS0FBSyxZQUFZO0FBQ25DLE9BQUssYUFBYTtBQUNsQixNQUFJO0FBQ0gsUUFBSyxZQUFZLFNBQVM7QUFDMUIsUUFBSyxrQkFBa0I7R0FFdkIsTUFBTSxRQUFRLE1BQU0sS0FBSyxrQkFBa0Isa0JBQWtCLFFBQVE7QUFDckUsT0FBSSxPQUFPO0FBQ1YsVUFBTSxXQUFXLFNBQVMsaUJBQWlCLE9BQU87QUFDbEQsVUFBTSxXQUFXLFNBQVMsaUJBQWlCLEtBQUssY0FBYyx5QkFBeUI7QUFDdkYsVUFBTSxNQUFNLE9BQU87R0FDbkIsTUFDQSxNQUFLLFlBQVksU0FBUztFQUUzQixTQUFRLEdBQUc7QUFDWCxRQUFLLFlBQVksU0FBUztBQUMxQixTQUFNO0VBQ04sVUFBUztBQUNULFFBQUssYUFBYTtFQUNsQjtDQUNEOzs7OztDQU1ELE1BQU0sZUFBZTtBQUNwQixNQUFJO0dBQ0gsTUFBTSxRQUFRLE1BQU0sS0FBSyxrQkFBa0Isa0JBQWtCLFdBQVc7QUFDeEUsU0FBTSxPQUFPLE9BQU87RUFDcEIsU0FBUSxHQUFHO0FBQ1gsU0FBTSxhQUFhLGVBQ2xCLE9BQU07RUFFUDtDQUNEO0NBRUQsTUFBTSxZQUEyQjtBQUNoQyxNQUFJO0dBQ0gsTUFBTSxRQUFRLE1BQU0sS0FBSyxrQkFBa0Isa0JBQWtCLFVBQVU7QUFDdkUsU0FBTSxPQUFPLE9BQU87RUFDcEIsU0FBUSxHQUFHO0FBQ1gsU0FBTSxhQUFhLGVBQ2xCLE9BQU07RUFFUDtDQUNEO0NBRUQsTUFBTSxhQUFhO0VBQ2xCLE1BQU0sUUFBUSxNQUFNLEtBQUssa0JBQWtCLGtCQUFrQixTQUFTO0FBQ3RFLE1BQUksU0FBUyxLQUNaO0FBRUQsTUFBSTtHQUNILE1BQU0sY0FBYyxJQUFJO0FBQ3hCLFVBQU8sTUFBTSxZQUFZLG9DQUFvQyxPQUFPO0lBQ25FLEtBQUssS0FBSyxjQUFjO0lBQ3hCLFVBQVUsS0FBSyxjQUFjO0lBQzdCLGNBQWMsS0FBSyxjQUFjO0dBQ2pDLEVBQUM7RUFDRixTQUFRLEtBQUs7QUFDYixPQUFJLGVBQWUsY0FDbEIsU0FBUSxJQUFJLGtEQUFrRDtJQUU5RCxPQUFNO0VBRVA7QUFFRCxRQUFNLElBQUksaUJBQWlCO0NBQzNCO0NBRUQsTUFBTSxVQUFVO0VBQ2YsTUFBTSxRQUFRLE1BQU0sS0FBSyxrQkFBa0Isa0JBQWtCLFFBQVE7QUFDckUsTUFBSSxTQUFTLEtBQ1o7QUFFRCxNQUFJO0dBQ0gsTUFBTSxjQUFjLElBQUk7QUFDeEIsVUFBTyxNQUFNLFlBQVksb0NBQW9DLE9BQU87SUFDbkUsS0FBSyxLQUFLLGNBQWM7SUFDeEIsVUFBVSxLQUFLLGNBQWM7SUFDN0IsY0FBYztHQUNkLEVBQUM7RUFDRixTQUFRLEtBQUs7QUFDYixPQUFJLGVBQWUsY0FDbEIsU0FBUSxJQUFJLHNEQUFzRDtJQUVsRSxPQUFNO0VBRVA7Q0FDRDtDQUVELE1BQU0sY0FBd0M7RUFDN0MsTUFBTSxRQUFRLE1BQU0sS0FBSyxrQkFBa0Isa0JBQWtCLFFBQVE7QUFDckUsTUFBSSxTQUFTLEtBQ1osUUFBTyxnQkFBZ0I7QUFFeEIsTUFBSTtBQUNILFNBQU0sV0FBVyxTQUFTLG9CQUFvQjtBQUM5QyxTQUFNLE1BQU0sT0FBTztBQUNuQixVQUFPLGdCQUFnQjtFQUN2QixVQUFTO0FBQ1QsU0FBTSxXQUFXLFNBQVMsb0JBQW9CO0VBQzlDO0NBQ0Q7Q0FFRCxNQUFNLHNCQUFxQztFQUMxQyxNQUFNLEVBQUUsZUFBZSxHQUFHLE1BQU0sT0FBTztBQUN2QyxPQUFLLHVCQUF1QixjQUFjLGFBQWEsS0FBSyxjQUFjLGFBQWEsRUFDdEYsc0JBQXNCLEtBQ3RCLEVBQUMsQ0FBQztDQUNIO0NBRUQsMEJBQTBCO0FBQ3pCLFNBQU8sS0FBSztDQUNaO0FBQ0QifQ==