//
//  ExternalCaledarFacade.swift
//  calendar
//
//  Created by Tutao GmbH on 15.08.24.
//

import Foundation

public class ExternalCalendarFacadeImpl: ExternalCalendarFacade {
	public init() {}

	public func fetchExternalCalendar(_ url: String) async throws -> String {
		enum FetchExternalError: Error {
			case URLError(String)
			case FetchError(String)
		}

		guard let sourceUrl = URL(string: url) else { throw FetchExternalError.URLError("Error while creating the URL") }

		let (data, _) = try await URLSession.shared.data(from: sourceUrl)
		let str = String(data: data, encoding: .utf8) ?? ""

		return str
	}
}
