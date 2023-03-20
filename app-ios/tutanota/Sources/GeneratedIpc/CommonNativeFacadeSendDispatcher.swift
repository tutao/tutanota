/* generated file, don't edit. */


import Foundation

class CommonNativeFacadeSendDispatcher : CommonNativeFacade {
	private let transport: NativeInterface
	init(transport: NativeInterface) { self.transport = transport }
	
	func createMailEditor(
		_ filesUris: [String],
		_ text: String,
		_ addresses: [String],
		_ subject: String,
		_ mailToUrlString: String
	) async throws -> Void
		{
		var args = [String]()
		args.append(toJson(filesUris))
		args.append(toJson(text))
		args.append(toJson(addresses))
		args.append(toJson(subject))
		args.append(toJson(mailToUrlString))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("createMailEditor")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	func openMailBox(
		_ userId: String,
		_ address: String,
		_ requestedPath: String?
	) async throws -> Void
		{
		var args = [String]()
		args.append(toJson(userId))
		args.append(toJson(address))
		args.append(toJson(requestedPath))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("openMailBox")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	func openCalendar(
		_ userId: String
	) async throws -> Void
		{
		var args = [String]()
		args.append(toJson(userId))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("openCalendar")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	func showAlertDialog(
		_ translationKey: String
	) async throws -> Void
		{
		var args = [String]()
		args.append(toJson(translationKey))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("showAlertDialog")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	func invalidateAlarms(
	) async throws -> Void
		{
		let args = [String]()
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("invalidateAlarms")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	func updateTheme(
	) async throws -> Void
		{
		let args = [String]()
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("updateTheme")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
}
