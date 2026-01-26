import o from "@tutao/otest"
import { CalendarEventApplyStrategies } from "../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarEventModelStrategy"
import { CalendarModel } from "../../../src/calendar-app/calendar/model/CalendarModel"
import { func, object } from "testdouble"
import { LoginController } from "../../../src/common/api/main/LoginController"
import { CalendarNotificationModel } from "../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarNotificationModel"
import { ShowProgressCallback } from "../../../src/calendar-app/calendar/gui/eventeditor-model/CalendarEventModel"

o.spec("CalendarEventModelStrategyTest", function () {
	let calendarEventApplyStrategies: CalendarEventApplyStrategies
	let calendarModelMock: CalendarModel
	let loginControllerMock: LoginController
	let notificationModelMock: CalendarNotificationModel
	let lazyRecurrenceIdsCallbackMock: (uid?: string | null) => Promise<Date[]>
	let showProgressCallbackMock: ShowProgressCallback
	let zone: string

	o.beforeEach(function () {
		calendarModelMock = object()
		loginControllerMock = object()
		notificationModelMock = object()
		lazyRecurrenceIdsCallbackMock = func() as (uid?: string | null) => Promise<Date[]>
		showProgressCallbackMock = func() as ShowProgressCallback
		zone = "Europe/Berlin"
		calendarEventApplyStrategies = new CalendarEventApplyStrategies(
			calendarModelMock,
			loginControllerMock,
			notificationModelMock,
			lazyRecurrenceIdsCallbackMock,
			showProgressCallbackMock,
			zone,
		)
	})
})
