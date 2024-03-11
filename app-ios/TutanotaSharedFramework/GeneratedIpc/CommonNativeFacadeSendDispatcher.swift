/* generated file, don't edit. */


import Foundation

public class CommonNativeFacadeSendDispatcher : CommonNativeFacade {
	private let transport: NativeInterface
	public init(transport: NativeInterface) { self.transport = transport }
	
	 public func createMailEditor(
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
	
	 public func openMailBox(
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
	
	 public func openCalendar(
		_ userId: String
	) async throws -> Void
		{
		var args = [String]()
		args.append(toJson(userId))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("openCalendar")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func showAlertDialog(
		_ translationKey: String
	) async throws -> Void
		{
		var args = [String]()
		args.append(toJson(translationKey))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("showAlertDialog")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func invalidateAlarms(
	) async throws -> Void
		{
		let args = [String]()
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("invalidateAlarms")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func updateTheme(
	) async throws -> Void
		{
		let args = [String]()
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("updateTheme")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func promptForNewPassword(
		_ title: String,
		_ oldPassword: String?
	) async throws -> String
		{
		var args = [String]()
		args.append(toJson(title))
		args.append(toJson(oldPassword))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("promptForNewPassword")
		let returnValue = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		return try! JSONDecoder().decode(String.self, from: returnValue.data(using: .utf8)!)
		}
	
	 public func promptForPassword(
		_ title: String
	) async throws -> String
		{
		var args = [String]()
		args.append(toJson(title))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("promptForPassword")
		let returnValue = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		return try! JSONDecoder().decode(String.self, from: returnValue.data(using: .utf8)!)
		}
	
	 public func handleFileImport(
		_ filesUris: [String]
	) async throws -> Void
		{
		var args = [String]()
		args.append(toJson(filesUris))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("handleFileImport")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
}
