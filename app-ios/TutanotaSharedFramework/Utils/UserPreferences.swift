import Foundation

/// User settings provider
///
/// This is abstracted into an interface for better testability.
public protocol UserPreferencesProvider {
	/// Get the settings object for the given key.
	///
	/// Parameters:
	/// - `forkey` key to get settings
	func getObject(forKey: String) -> Any?

	/// Get the settings dictionary for the given key.
	///
	/// Parameters:
	/// - `forkey` key to get settings
	func getDictionary(forKey: String) -> [String: Any]?

	/// Write the settings object for the given key.
	///
	/// Parameters:
	/// - `object` settings to write
	/// - `forKey` key to write settings
	func setValue(_ object: Any?, forKey: String)
}

/// User preferences implementation.
///
/// This interacts with the actual user preferences for the Tuta app.
public class UserPreferencesProviderImpl: UserPreferencesProvider {
	private let userDefault = UserDefaults(suiteName: getAppGroupName())!
	public init() {}

	public func getObject(forKey: String) -> Any? { userDefault.object(forKey: forKey) }
	public func getDictionary(forKey: String) -> [String: Any]? { userDefault.dictionary(forKey: forKey) }
	public func setValue(_ object: Any?, forKey: String) { userDefault.set(object, forKey: forKey) }
}
