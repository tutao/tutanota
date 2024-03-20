import CryptoKit
import StoreKit

public class IosMobilePaymentsFacade: MobilePaymentsFacade {
	public func requestSubscriptionToPlan(_ plan: String, _ interval: Int, _ customerId: DataWrapper) async throws -> MobilePaymentResult {
		let uuid = customerIdToUUID(customerId.data)

		let intervalString =
			switch interval {
			case 1: "monthly"
			case 12: "yearly"
			default: fatalError()
			}

		let planType = "plans.\(plan).\(intervalString)"

		// FIXME: handle errors/no such product
		let product = (try await Product.products(for: [planType]))[0]
		NSLog("Attempting to purchase %@ - %@", product.displayName, product.displayPrice)
		let result = try await product.purchase(options: [Product.PurchaseOption.appAccountToken(uuid)])

		switch result {
		case .success(let verification):
			let transaction = checkVerified(verification)
			let id = transaction.id
			await transaction.finish()  // FIXME: do this after we have confirmed with the server!
			return MobilePaymentResult(
				result: MobilePaymentResultType.success,
				transactionID: String(id),
				transactionHash: TUTEncodingConverter.bytes(toHex: transaction.deviceVerification)
			)
		case .userCancelled: return MobilePaymentResult(result: MobilePaymentResultType.cancelled, transactionID: nil, transactionHash: nil)
		case .pending: return MobilePaymentResult(result: MobilePaymentResultType.pending, transactionID: nil, transactionHash: nil)
		default: fatalError("unknown purchase result")
		}
	}

	func checkVerified<T>(_ result: VerificationResult<T>) -> T {
		switch result {
		case .unverified: fatalError("failed verification - oh no")
		case .verified(let safe): return safe
		}
	}

	func customerIdToUUID(_ customerId: Data) -> UUID {
		var uuidBytes = Data(repeating: 0, count: 16)

		for i in 0..<6 { uuidBytes[i] = customerId[i] }

		for i in 0..<3 { uuidBytes[i + 9] = customerId[i + 6] }

		uuidBytes[6] = 3 << 4  // version 3
		uuidBytes[8] = 2 << 6  // ietf

		let t = uuidBytes.withUnsafeBytes { data in data.load(as: uuid_t.self) }

		return UUID(uuid: t)
	}
}
