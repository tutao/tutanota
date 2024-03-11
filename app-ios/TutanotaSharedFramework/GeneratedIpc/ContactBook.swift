/* generated file, don't edit. */


/**
 * Represents an account/list from the device's phonebook.
 */
public struct ContactBook : Codable {
	public init(
		id: String,
		name: String?
	) {
		self.id = id
		self.name = name
	}
	public let id: String
	public let name: String?
}
