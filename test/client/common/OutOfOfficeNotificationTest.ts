import o from "ospec"
import {createOutOfOfficeNotification} from "../../../src/api/entities/tutanota/OutOfOfficeNotification"
import {mockAttribute, unmockAttribute} from "@tutao/tutanota-test-utils"
import {getDayShifted, getStartOfDay, getStartOfNextDay} from "@tutao/tutanota-utils"
import {lang} from "../../../src/misc/LanguageViewModel"
import {formatActivateState, isNotificationCurrentlyActive} from "../../../src/misc/OutOfOfficeNotificationUtils"
o.spec("OutOfOfficeNotificationTest", function () {
    const mockedAttributes: any = []
    o.before(function () {
        mockedAttributes.push(
            mockAttribute(lang, lang.get, function (key, obj) {
                if (key === "activated_label") {
                    return "Activated"
                } else if (key === "deactivated_label") {
                    return "Deactivated"
                }

                throw new Error("unexpected translation key: " + key)
            }),
        )
    })
    o.after(function () {
        mockedAttributes.forEach(function (mockedAttribute) {
            unmockAttribute(mockedAttribute)
        })
    })
    o("Active state formatting", function () {
        lang._setLanguageTag("en")

        let notification = createOutOfOfficeNotification({
            enabled: true,
            startDate: null,
            endDate: null,
        })
        o(formatActivateState(notification)).equals("Activated")
        notification = createOutOfOfficeNotification({
            enabled: true,
            startDate: new Date(2020, 11, 15),
            endDate: null,
        })
        o(formatActivateState(notification)).equals("Activated (12/15/2020)")
        notification = createOutOfOfficeNotification({
            enabled: true,
            startDate: new Date(2020, 11, 15),
            endDate: new Date(2021, 0, 9),
        })
        o(formatActivateState(notification)).equals("Activated (12/15/2020 - 1/8/2021)") // end date should be shifted

        notification = createOutOfOfficeNotification({
            enabled: false,
            startDate: new Date(2020, 11, 15),
            endDate: new Date(2021, 0, 10),
        })
        o(formatActivateState(notification)).equals("Deactivated")
    })
    o("is active with enabled notification", function () {
        const now = new Date()
        const oneDayBefore = getDayShifted(now, -1)
        const oneDayAfter = getDayShifted(now, +1)
        let notification = createOutOfOfficeNotification({
            enabled: true,
            startDate: null,
            endDate: null,
        })
        o(isNotificationCurrentlyActive(notification, now)).equals(true)
        o(isNotificationCurrentlyActive(notification, oneDayBefore)).equals(true)
        o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(true)
    })
    o("is active with disabled notification", function () {
        const now = new Date()
        const oneDayBefore = getDayShifted(now, -1)
        const oneDayAfter = getDayShifted(now, +1)
        let notification = createOutOfOfficeNotification({
            enabled: false,
            startDate: null,
            endDate: null,
        })
        o(isNotificationCurrentlyActive(notification, now)).equals(false)
        o(isNotificationCurrentlyActive(notification, oneDayBefore)).equals(false)
        o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(false)
    })
    o("is active with startDate", function () {
        const now = new Date()
        const oneDayBefore = getDayShifted(now, -1)
        const oneDayAfter = getDayShifted(now, +1)
        let notification = createOutOfOfficeNotification({
            enabled: true,
            startDate: getStartOfDay(now),
            endDate: null,
        })
        o(isNotificationCurrentlyActive(notification, now)).equals(true)
        o(isNotificationCurrentlyActive(notification, oneDayBefore)).equals(false)
        o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(true)
    })
    o("is active with start and end date", function () {
        const now = new Date()
        const oneDayBefore = getDayShifted(now, -1)
        const oneDayAfter = getDayShifted(now, +1)
        let notification = createOutOfOfficeNotification({
            enabled: true,
            startDate: getStartOfDay(now),
            endDate: getStartOfNextDay(now),
        })
        o(isNotificationCurrentlyActive(notification, now)).equals(true)
        o(isNotificationCurrentlyActive(notification, oneDayBefore)).equals(false)
        o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(false)
    })
    o("is active with start and end date 2", function () {
        const now = new Date()
        const activeUntil = getDayShifted(now, +5)
        const oneDayAfter = getStartOfNextDay(activeUntil)
        let notification = createOutOfOfficeNotification({
            enabled: true,
            startDate: getStartOfDay(now),
            endDate: getStartOfNextDay(activeUntil),
        })
        o(isNotificationCurrentlyActive(notification, now)).equals(true)
        o(isNotificationCurrentlyActive(notification, activeUntil)).equals(true)
        o(isNotificationCurrentlyActive(notification, oneDayAfter)).equals(false)
    })
})