/* generated file, don't edit. */

/**
 * Common external calendar operations that must be completed on native side
 */
export interface ExternalCalendarFacade {
	/**
	 * Fetches the content of an external calendar and return it as a string
	 */
	fetchExternalCalendar(url: string): Promise<string>
}
