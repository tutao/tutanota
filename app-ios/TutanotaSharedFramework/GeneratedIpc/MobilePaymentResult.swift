/* generated file, don't edit. */


public struct MobilePaymentResult : Codable {
	public init(
		result: MobilePaymentResultType,
		transactionID: String?,
		transactionHash: String?
	) {
		self.result = result
		self.transactionID = transactionID
		self.transactionHash = transactionHash
	}
	public let result: MobilePaymentResultType
	public let transactionID: String?
	public let transactionHash: String?
}
