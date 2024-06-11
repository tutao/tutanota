/* generated file, don't edit. */


import Foundation

public class MobilePaymentsFacadeReceiveDispatcher {
	let facade: MobilePaymentsFacade
	init(facade: MobilePaymentsFacade) {
		self.facade = facade
	}
	public func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "requestSubscriptionToPlan":
			let plan = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let interval = try! JSONDecoder().decode(Int.self, from: arg[1].data(using: .utf8)!)
			let customerIdBytes = try! JSONDecoder().decode(DataWrapper.self, from: arg[2].data(using: .utf8)!)
			let result = try await self.facade.requestSubscriptionToPlan(
				plan,
				interval,
				customerIdBytes
			)
			return toJson(result)
		case "getPlanPrices":
			let result = try await self.facade.getPlanPrices(
			)
			return toJson(result)
		case "showSubscriptionConfigView":
			try await self.facade.showSubscriptionConfigView(
			)
			return "null"
		case "queryAppStoreSubscriptionOwnership":
			let customerIdBytes = try! JSONDecoder().decode(DataWrapper?.self, from: arg[0].data(using: .utf8)!)
			let result = try await self.facade.queryAppStoreSubscriptionOwnership(
				customerIdBytes
			)
			return toJson(result)
		case "isAppStoreRenewalEnabled":
			let result = try await self.facade.isAppStoreRenewalEnabled(
			)
			return toJson(result)
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
