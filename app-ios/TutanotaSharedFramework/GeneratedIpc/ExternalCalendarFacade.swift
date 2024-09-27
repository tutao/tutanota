/* generated file, don't edit. */


import Foundation

/**
 * Common external calendar operations that must be completed on native side
 */
public protocol ExternalCalendarFacade {
	/**
	 * Fetches the content of an external calendar and return it as a string
	 */
	func fetchExternalCalendar(
		_ url: String
	) async throws -> String
}
