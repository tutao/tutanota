/* generated file, don't edit. */


import Foundation

public class NativePushFacadeReceiveDispatcher {
	let facade: NativePushFacade
	init(facade: NativePushFacade) {
		self.facade = facade
	}
	func dispatch(method: String, arg: [String]) async throws -> String {
		switch method {
		case "getPushIdentifier":
			let userId = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let mailAddress = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let result = try await self.facade.getPushIdentifier(
				userId,
				mailAddress
			)
			return toJson(result)
		case "storePushIdentifierLocally":
			let identifier = try! JSONDecoder().decode(String.self, from: arg[0].data(using: .utf8)!)
			let userId = try! JSONDecoder().decode(String.self, from: arg[1].data(using: .utf8)!)
			let sseOrigin = try! JSONDecoder().decode(String.self, from: arg[2].data(using: .utf8)!)
			let pushIdentifierId = try! JSONDecoder().decode(String.self, from: arg[3].data(using: .utf8)!)
			let pushIdentifierSessionKey = try! JSONDecoder().decode(DataWrapper.self, from: arg[4].data(using: .utf8)!)
			try await self.facade.storePushIdentifierLocally(
				identifier,
				userId,
				sseOrigin,
				pushIdentifierId,
				pushIdentifierSessionKey
			)
			return "null"
		case "initPushNotifications":
			try await self.facade.initPushNotifications(
			)
			return "null"
		case "closePushNotifications":
			let addressesArray = try! JSONDecoder().decode([String].self, from: arg[0].data(using: .utf8)!)
			try await self.facade.closePushNotifications(
				addressesArray
			)
			return "null"
		case "scheduleAlarms":
			let alarms = try! JSONDecoder().decode([EncryptedAlarmNotification].self, from: arg[0].data(using: .utf8)!)
			try await self.facade.scheduleAlarms(
				alarms
			)
			return "null"
		default:
			fatalError("licc messed up! \(method)")
		}
	}
}
