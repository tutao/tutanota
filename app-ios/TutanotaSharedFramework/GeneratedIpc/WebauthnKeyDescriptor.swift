/* generated file, don't edit. */


/**
 * Similar to browser's built-in PublicKeyCredentialDescriptor but we only specify ID here
 */
public struct WebauthnKeyDescriptor : Codable {
	public init(
		id: DataWrapper
	) {
		self.id = id
	}
	public let id: DataWrapper
}
