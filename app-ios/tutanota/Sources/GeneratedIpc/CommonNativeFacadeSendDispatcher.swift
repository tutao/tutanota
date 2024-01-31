/* generated file, don't edit. */

import Foundation

class CommonNativeFacadeSendDispatcher: CommonNativeFacade {
	private let transport: NativeInterface
	init(transport: NativeInterface) { self.transport = transport }

	func createMailEditor(
		_ filesUris: [String],
		_ text: String,
		_ addresses: [String],
		_ subject: String,
		_ mailToUrlString: String
	) async throws {
		var args = [String]()
		args.append(toJson(filesUris))
		args.append(toJson(text))
		args.append(toJson(addresses))
		args.append(toJson(subject))
		args.append(toJson(mailToUrlString))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("createMailEditor")
		_ = try await self.transport.sendRequest(requestType: "ipc", args: [encodedFacadeName, encodedMethodName] + args)
		}

	func openMailBox(
		_ userId: String,
		_ address: String,
		_ requestedPath: String?
	) async throws {
		var args = [String]()
		args.append(toJson(userId))
		args.append(toJson(address))
		args.append(toJson(requestedPath))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("openMailBox")
		_ = try await self.transport.sendRequest(requestType: "ipc", args: [encodedFacadeName, encodedMethodName] + args)
		}

	func openCalendar(
		_ userId: String
	) async throws {
		var args = [String]()
		args.append(toJson(userId))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("openCalendar")
		_ = try await self.transport.sendRequest(requestType: "ipc", args: [encodedFacadeName, encodedMethodName] + args)
		}

	func showAlertDialog(
		_ translationKey: String
	) async throws {
		var args = [String]()
		args.append(toJson(translationKey))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("showAlertDialog")
		_ = try await self.transport.sendRequest(requestType: "ipc", args: [encodedFacadeName, encodedMethodName] + args)
		}

	func invalidateAlarms(
	) async throws {
		let args = [String]()
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("invalidateAlarms")
		_ = try await self.transport.sendRequest(requestType: "ipc", args: [encodedFacadeName, encodedMethodName] + args)
		}

	func updateTheme(
	) async throws {
		let args = [String]()
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("updateTheme")
		_ = try await self.transport.sendRequest(requestType: "ipc", args: [encodedFacadeName, encodedMethodName] + args)
		}

	func promptForNewPassword(
		_ title: String,
		_ oldPassword: String?
	) async throws -> String {
		var args = [String]()
		args.append(toJson(title))
		args.append(toJson(oldPassword))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("promptForNewPassword")
		let returnValue = try await self.transport.sendRequest(requestType: "ipc", args: [encodedFacadeName, encodedMethodName] + args)
		return try! JSONDecoder().decode(String.self, from: returnValue.data(using: .utf8)!)
		}

	func promptForPassword(
		_ title: String
	) async throws -> String {
		var args = [String]()
		args.append(toJson(title))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("promptForPassword")
		let returnValue = try await self.transport.sendRequest(requestType: "ipc", args: [encodedFacadeName, encodedMethodName] + args)
		return try! JSONDecoder().decode(String.self, from: returnValue.data(using: .utf8)!)
		}

}
