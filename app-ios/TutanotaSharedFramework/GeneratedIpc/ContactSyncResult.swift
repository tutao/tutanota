/* generated file, don't edit. */


public struct ContactSyncResult : Codable {
	public init(
		createdOnDevice: [StructuredContact],
		editedOnDevice: [StructuredContact],
		deletedOnDevice: [String]
	) {
		self.createdOnDevice = createdOnDevice
		self.editedOnDevice = editedOnDevice
		self.deletedOnDevice = deletedOnDevice
	}
	public let createdOnDevice: [StructuredContact]
	public let editedOnDevice: [StructuredContact]
	public let deletedOnDevice: [String]
}
