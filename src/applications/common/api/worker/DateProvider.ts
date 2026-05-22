import { getDayShifted, getStartOfDay } from "@tutao/utils"

export interface DateProvider {
	getStartOfDayShiftedBy(shiftByDays: number): Date
}

export class LocalTimeDateProvider implements DateProvider {
	getStartOfDayShiftedBy(shiftByDays: number): Date {
		return getStartOfDay(getDayShifted(new Date(), shiftByDays))
	}
}
