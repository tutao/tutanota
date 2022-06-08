/* generated file, don't edit. */


import Foundation

class MobileFacadeSendDispatcher : MobileFacade {
	private let transport: NativeInterface
	init(transport: NativeInterface) { self.transport = transport }
	func handleBackPress(
	) async throws -> Bool
		{
		var args = [Encodable]()
		let returnValue = try await self.transport.invokeRemote(method: "ipc",  args: ["MobileFacade", "handleBackPress"] + args)
		return try! JSONDecoder().decode(Bool.self, from: returnValue.data(using: .utf8)!)
		}
	func visibilityChange(
		_ visibility: Bool
	) async throws -> Void
		{
		var args = [Encodable]()
		args.append(visibility)
		let _ = try await self.transport.invokeRemote(method: "ipc",  args: ["MobileFacade", "visibilityChange"] + args)
		}
	func keyboardSizeChanged(
		_ newSize: Int
	) async throws -> Void
		{
		var args = [Encodable]()
		args.append(newSize)
		let _ = try await self.transport.invokeRemote(method: "ipc",  args: ["MobileFacade", "keyboardSizeChanged"] + args)
		}
}
