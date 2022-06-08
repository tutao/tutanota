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
		var args = [Encodable]()
		args.append(filesUris)
		args.append(text)
		args.append(addresses)
		args.append(subject)
		args.append(mailToUrlString)
		let _ = try await self.transport.invokeRemote(method: "ipc",  args: ["CommonNativeFacade", "createMailEditor"] + args)
		}
	func openMailBox(
		_ userId: String,
		_ address: String,
		_ requestedPath: String?
	) async throws -> Void
		{
		var args = [Encodable]()
		args.append(userId)
		args.append(address)
		args.append(requestedPath)
		let _ = try await self.transport.invokeRemote(method: "ipc",  args: ["CommonNativeFacade", "openMailBox"] + args)
		}
	func openCalendar(
		_ userId: String
	) async throws -> Void
		{
		var args = [Encodable]()
		args.append(userId)
		let _ = try await self.transport.invokeRemote(method: "ipc",  args: ["CommonNativeFacade", "openCalendar"] + args)
		}
	func showAlertDialog(
		_ translationKey: String
	) async throws -> Void
		{
		var args = [Encodable]()
		args.append(translationKey)
		let _ = try await self.transport.invokeRemote(method: "ipc",  args: ["CommonNativeFacade", "showAlertDialog"] + args)
		}
	func invalidateAlarms(
	) async throws -> Void
		{
		var args = [Encodable]()
		let _ = try await self.transport.invokeRemote(method: "ipc",  args: ["CommonNativeFacade", "invalidateAlarms"] + args)
		}
}
