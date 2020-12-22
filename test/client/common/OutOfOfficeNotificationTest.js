//@flow
import o from "ospec/ospec.js"
import {createOutOfOfficeNotification} from "../../../src/api/entities/tutanota/OutOfOfficeNotification"
import {mockAttribute, unmockAttribute} from "../../api/TestUtils"
import {lang} from "../../../src/misc/LanguageViewModel"
import {
	formatActivateState,
	isNotificationCurrentlyActive,
	notificationMessagesAreValid
} from "../../../src/settings/OutOfOfficeNotificationUtils"
import {getDayShifted, getStartOfDay, getStartOfNextDay} from "../../../src/api/common/utils/DateUtils"
import {createOutOfOfficeNotificationMessage} from "../../../src/api/entities/tutanota/OutOfOfficeNotificationMessage"

o.spec("OutOfOfficeNotificationTest", function () {

	const mockedAttributes = []

	o.before(function () {
		mockedAttributes.push(mockAttribute(lang, lang.get, function (key, obj) {
			if (key === "activated_label") {
				return "Activated"
			} else if (key === "deactivated_label") {
				return "Deactivated"
			}
			throw new Error("unexpected translation key: " + key)
		}))
	})

	o.after(function () {
		mockedAttributes.forEach(function (mockedAttribute) {
			unmockAttribute(mockedAttribute)
		})
	})

	o("Active state formatting", function () {
		let notification = createOutOfOfficeNotification({enabled: true, startDate: null, endDate: null})
		o(formatActivateState(notification)).equals("Activated")
		notification = createOutOfOfficeNotification({enabled: true, startDate: new Date(2020, 11, 15), endDate: null})
		o(formatActivateState(notification)).equals("Activated (12/15/2020)")
		notification = createOutOfOfficeNotification({enabled: true, startDate: new Date(2020, 11, 15), endDate: new Date(2021, 0, 10)})
		o(formatActivateState(notification)).equals("Activated (12/15/2020 - 1/10/2021)")
		notification = createOutOfOfficeNotification({enabled: false, startDate: new Date(2020, 11, 15), endDate: new Date(2021, 0, 10)})
		o(formatActivateState(notification)).equals("Deactivated")
	});

	o("is active with enabled notification", function () {
		const now = new Date()
		const oneDayBefore = getDayShifted(now, -1);
		const oneDayAfter = getDayShifted(now, +1);
		let notification = createOutOfOfficeNotification({enabled: true, startDate: null, endDate: null})
		o(isNotificationCurrentlyActive(notification, now)).equals(true)
		o(isNotificationCurrentlyActive(notification, oneDayBefore)).equals(true)
		o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(true)
	});

	o("is active with disabled notification", function () {
		const now = new Date()
		const oneDayBefore = getDayShifted(now, -1);
		const oneDayAfter = getDayShifted(now, +1);
		let notification = createOutOfOfficeNotification({enabled: false, startDate: null, endDate: null})
		o(isNotificationCurrentlyActive(notification, now)).equals(false)
		o(isNotificationCurrentlyActive(notification, oneDayBefore)).equals(false)
		o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(false)
	});


	o("is active with startDate", function () {
		const now = new Date()
		const oneDayBefore = getDayShifted(now, -1);
		const oneDayAfter = getDayShifted(now, +1);
		let notification = createOutOfOfficeNotification({enabled: true, startDate: getStartOfDay(now), endDate: null})
		o(isNotificationCurrentlyActive(notification, now)).equals(true)
		o(isNotificationCurrentlyActive(notification, oneDayBefore)).equals(false)
		o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(true)
	});

	o("is active with start and end date", function () {
		const now = new Date()
		const oneDayBefore = getDayShifted(now, -1);
		const oneDayAfter = getDayShifted(now, +1);
		let notification = createOutOfOfficeNotification({
			enabled: true,
			startDate: getStartOfDay(now),
			endDate: getStartOfNextDay(now)
		})
		o(isNotificationCurrentlyActive(notification, now)).equals(true)
		o(isNotificationCurrentlyActive(notification, oneDayBefore)).equals(false)
		o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(false)
	});
	o("is active with start and end date", function () {
		const now = new Date()
		const activeUntil = getDayShifted(now, +5);
		const oneDayAfter = getStartOfNextDay(activeUntil)

		let notification = createOutOfOfficeNotification({
			enabled: true,
			startDate: getStartOfDay(now),
			endDate: getStartOfNextDay(activeUntil)
		})
		o(isNotificationCurrentlyActive(notification, now)).equals(true)
		o(isNotificationCurrentlyActive(notification, activeUntil)).equals(true)
		o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(false)
	});


	o("are messages valid", function () {
		const messages = []
		const outsideMessage = createOutOfOfficeNotificationMessage({
			message: "out",
			subject: "out subject",
			type: "0" //OutOfOfficeNotificationMessageType.Default
		})
		const insideMessage = createOutOfOfficeNotificationMessage({
			message: "in",
			subject: "in subject",
			type: "1" //OutOfOfficeNotificationMessageType.SameOrganization
		})
		const noSubjectMessage = createOutOfOfficeNotificationMessage({
			message: "invalid message",
			subject: "",
			type: "0"
		})
		const noTextMessage = createOutOfOfficeNotificationMessage({
			message: "",
			subject: "subject",
			type: "0"
		})
		o(notificationMessagesAreValid(messages)).equals(false) // empty not allowed
		messages.push(outsideMessage)
		o(notificationMessagesAreValid(messages)).equals(true)
		messages.push(insideMessage)
		o(notificationMessagesAreValid(messages)).equals(true)
		messages.push(outsideMessage)
		o(notificationMessagesAreValid(messages)).equals(false) //too many
		messages.shift()
		messages.shift()
		messages.push(noSubjectMessage)
		o(notificationMessagesAreValid(messages)).equals(false) // invalid not allowed
		messages.shift()
		messages.shift()
		messages.push(noTextMessage)
		o(notificationMessagesAreValid(messages)).equals(false) // invalid not allowed
	})

})