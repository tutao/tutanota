//
//  RemoteStorage.swift
//  calendar
//
//  Created by Tutao GmbH on 24.04.25.
//
import DictionaryCoding
import Foundation

private let REMOTE_ORIGIN_KEY = "remoteOrigin"

public struct Origin: Codable { public let url: String }

public class RemoteStorage {
	private let userPreferencesProvider: UserPreferencesProvider

	public init(userPreferencesProvider: UserPreferencesProvider) { self.userPreferencesProvider = userPreferencesProvider }

	public func getRemoteOrigin() -> Origin? {
		let dict = self.userPreferencesProvider.getObject(forKey: REMOTE_ORIGIN_KEY)
		return dict.map { try! DictionaryDecoder().decode(Origin.self, from: $0 as! NSDictionary) }
	}

	public func storeOrigin(_ url: String) {
		let dict: NSDictionary = try! DictionaryEncoder().encode(Origin(url: url))
		self.userPreferencesProvider.setValue(dict, forKey: REMOTE_ORIGIN_KEY)
	}
}
