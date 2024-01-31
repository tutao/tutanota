import Foundation

/// User settings provider
///
/// This is abstracted into an interface for better testability.
protocol UserPreferencesProvider {
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
class UserPreferencesProviderImpl: UserPreferencesProvider {
  func getObject(forKey: String) -> Any? {
    return UserDefaults.standard.object(forKey: forKey)
  }
  func getDictionary(forKey: String) -> [String: Any]? {
    return UserDefaults.standard.dictionary(forKey: forKey)
  }
  func setValue(_ object: Any?, forKey: String) {
    UserDefaults.standard.set(object, forKey: forKey)
  }
}
