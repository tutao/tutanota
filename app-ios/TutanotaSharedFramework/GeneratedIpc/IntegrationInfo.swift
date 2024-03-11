/* generated file, don't edit. */


/**
 * Status of desktop integration.
 */
public struct IntegrationInfo : Codable {
	public init(
		isMailtoHandler: Bool,
		isAutoLaunchEnabled: Bool,
		isIntegrated: Bool,
		isUpdateAvailable: Bool
	) {
		self.isMailtoHandler = isMailtoHandler
		self.isAutoLaunchEnabled = isAutoLaunchEnabled
		self.isIntegrated = isIntegrated
		self.isUpdateAvailable = isUpdateAvailable
	}
	public let isMailtoHandler: Bool
	public let isAutoLaunchEnabled: Bool
	public let isIntegrated: Bool
	public let isUpdateAvailable: Bool
}
