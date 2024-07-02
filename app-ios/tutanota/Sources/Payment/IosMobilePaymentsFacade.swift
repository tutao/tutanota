import CryptoKit
import StoreKit

public class IosMobilePaymentsFacade: MobilePaymentsFacade {
	private let ALL_PURCHASEABLE_PLANS = ["revolutionary", "legend"]
	private let MOBILE_PAYMENT_DOMAIN = "de.tutao.tutanota.MobilePayment"

	public func queryAppStoreSubscriptionOwnership(_ customerIdBytes: DataWrapper?) async throws -> MobilePaymentSubscriptionOwnership {
		var currentResult = MobilePaymentSubscriptionOwnership.no_subscription

		for await transaction in Transaction.currentEntitlements {
			if let customerBytes = customerIdBytes {
				let transactionInfo = try transaction.payloadValue
				let uuid = customerIdToUUID(customerBytes.data)
				let isSameOwner = transactionInfo.appAccountToken == uuid

				if isSameOwner {
					currentResult = MobilePaymentSubscriptionOwnership.owner
				} else {
					currentResult = MobilePaymentSubscriptionOwnership.not_owner
				}
			} else {
				currentResult = MobilePaymentSubscriptionOwnership.not_owner
			}
		}

		return currentResult
	}

	public func getPlanPrices() async throws -> [MobilePlanPrice] {
		struct TempMobilePlanPrice {
			var monthlyPerMonth: String?
			var yearlyPerYear: String?
			var yearlyPerMonth: String?
		}
		let plans: [String] = ALL_PURCHASEABLE_PLANS.flatMap { plan in
			[self.formatPlanType(plan, withInterval: 1), self.formatPlanType(plan, withInterval: 12)]
		}
		let products: [Product] = try await Product.products(for: plans)
		var result = [String: TempMobilePlanPrice]()
		for product in products {
			let productName = String(product.id.split(separator: ".")[1])
			var plan = result[productName] ?? TempMobilePlanPrice(monthlyPerMonth: nil, yearlyPerYear: nil, yearlyPerMonth: nil)

			let unit = product.subscription!.subscriptionPeriod.unit
			switch unit {
			case .year:
				let formatStyle = product.priceFormatStyle
				let priceDivided = product.price / 12
				let yearlyPerMonthPrice = priceDivided.formatted(formatStyle)
				let yearlyPerYearPrice = product.displayPrice
				plan.yearlyPerYear = yearlyPerYearPrice
				plan.yearlyPerMonth = yearlyPerMonthPrice
			case .month: plan.monthlyPerMonth = product.displayPrice
			default: fatalError("unexpected subscription period unit \(unit)")
			}
			result[productName] = plan
		}
		return result.map { name, prices in
			MobilePlanPrice(name: name, monthlyPerMonth: prices.monthlyPerMonth!, yearlyPerYear: prices.yearlyPerYear!, yearlyPerMonth: prices.yearlyPerMonth!)
		}
	}
	public func showSubscriptionConfigView() async throws {
		let window = await UIApplication.shared.connectedScenes.first
		try await AppStore.showManageSubscriptions(in: window as! UIWindowScene)
	}
	public func requestSubscriptionToPlan(_ plan: String, _ interval: Int, _ customerIdBytes: DataWrapper) async throws -> MobilePaymentResult {
		let uuid = customerIdToUUID(customerIdBytes.data)
		let planType = formatPlanType(plan, withInterval: interval)

		let product: Product?
		do {
			guard let fetchedProduct = (try await Product.products(for: [planType])).first else {
				throw TUTErrorFactory.createError(withDomain: MOBILE_PAYMENT_DOMAIN, message: "Failed to retrieve plan \(planType). (no matching plan)")
			}
			product = fetchedProduct
		} catch let error as StoreKitError {
			throw TUTErrorFactory.createError(withDomain: MOBILE_PAYMENT_DOMAIN, message: "Failed to retrieve plan \(planType). \(error.localizedDescription)")
		}

		if product == nil { throw TUTErrorFactory.createError(withDomain: MOBILE_PAYMENT_DOMAIN, message: "No such plan \(planType)") }

		TUTSLog("Attempting to purchase \(product!.displayName) for \(product!.displayPrice)")
		let result = try await product!.purchase(options: [Product.PurchaseOption.appAccountToken(uuid)])

		switch result {
		case .success(let verification):
			let transaction = Self.checkVerified(verification)
			let id = transaction.id

			if transaction.appAccountToken != uuid {
				throw TUTErrorFactory.createError(
					withDomain: MOBILE_PAYMENT_DOMAIN,
					message:
						"Apparently succeeded buying, but actually got a mismatched customer UUID (got \(transaction.appAccountToken?.uuidString ?? "<null>"), expected \(uuid)); expires \(transaction.expirationDate!)"
				)
			}

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

	public func isAppStoreRenewalEnabled() async throws -> Bool {
		let plans: [String] = ALL_PURCHASEABLE_PLANS.flatMap { plan in
			[self.formatPlanType(plan, withInterval: 1), self.formatPlanType(plan, withInterval: 12)]
		}
		guard let anyProduct = try await Product.products(for: plans).first else {
			throw TUTErrorFactory.createError(withDomain: MOBILE_PAYMENT_DOMAIN, message: "No products found")
		}
		guard let status = try await anyProduct.subscription?.status.first else { return false }
		if case let .verified(renewalInfo) = status.renewalInfo {
			return renewalInfo.willAutoRenew
		} else {
			throw TUTErrorFactory.createError(withDomain: MOBILE_PAYMENT_DOMAIN, message: "No products found")
		}
	}

	func formatPlanType(_ plan: String, withInterval interval: Int) -> String {
		let intervalString =
			switch interval {
			case 1: "monthly"
			case 12: "yearly"
			default: fatalError("invalid plan (\(plan)) interval (\(interval))")
			}

		return "plans.\(plan).\(intervalString)"
	}

	static func checkVerified<T>(_ result: VerificationResult<T>) -> T {
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
