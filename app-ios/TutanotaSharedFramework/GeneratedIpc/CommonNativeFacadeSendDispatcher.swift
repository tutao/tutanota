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
	) async throws
		{
		var args = [String]()
		args.append(toJson(filesUris))
		args.append(toJson(text))
		args.append(toJson(addresses))
		args.append(toJson(subject))
		args.append(toJson(mailToUrlString))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("createMailEditor")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func openMailBox(
		_ userId: String,
		_ address: String,
		_ requestedPath: String?
	) async throws
		{
		var args = [String]()
		args.append(toJson(userId))
		args.append(toJson(address))
		args.append(toJson(requestedPath))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("openMailBox")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func openCalendar(
		_ userId: String,
		_ action: CalendarOpenAction?,
		_ dateIso: String?,
		_ eventId: String?
	) async throws
		{
		var args = [String]()
		args.append(toJson(userId))
		args.append(toJson(action))
		args.append(toJson(dateIso))
		args.append(toJson(eventId))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("openCalendar")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func openContactEditor(
		_ contactId: String
	) async throws
		{
		var args = [String]()
		args.append(toJson(contactId))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("openContactEditor")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func showAlertDialog(
		_ translationKey: String
	) async throws
		{
		var args = [String]()
		args.append(toJson(translationKey))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("showAlertDialog")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func invalidateAlarms(
	) async throws
		{
		let args = [String]()
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("invalidateAlarms")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func updateTheme(
	) async throws
		{
		let args = [String]()
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("updateTheme")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
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
	) async throws
		{
		var args = [String]()
		args.append(toJson(filesUris))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("handleFileImport")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func openSettings(
		_ path: String
	) async throws
		{
		var args = [String]()
		args.append(toJson(path))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("openSettings")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func sendLogs(
		_ logs: String
	) async throws
		{
		var args = [String]()
		args.append(toJson(logs))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("sendLogs")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func downloadProgress(
		_ fileId: String,
		_ bytes: Int
	) async throws
		{
		var args = [String]()
		args.append(toJson(fileId))
		args.append(toJson(bytes))
		let encodedFacadeName = toJson("CommonNativeFacade")
		let encodedMethodName = toJson("downloadProgress")
		_ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
}
