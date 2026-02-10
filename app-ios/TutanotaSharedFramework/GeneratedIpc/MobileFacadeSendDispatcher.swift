/* generated file, don't edit. */


import Foundation

public class MobileFacadeSendDispatcher : MobileFacade {
	private let transport: NativeInterface
	public init(transport: NativeInterface) { self.transport = transport }
	
	 public func handleBackPress(
	) async throws -> Bool
		{
		let args = [String]()
		let encodedFacadeName = toJson("MobileFacade")
		let encodedMethodName = toJson("handleBackPress")
		let returnValue = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		return try! JSONDecoder().decode(Bool.self, from: returnValue.data(using: .utf8)!)
		}
	
	 public func visibilityChange(
		_ visibility: Bool
	) async throws -> Void
		{
		var args = [String]()
		args.append(toJson(visibility))
		let encodedFacadeName = toJson("MobileFacade")
		let encodedMethodName = toJson("visibilityChange")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
	 public func keyboardSizeChanged(
		_ newSize: Int
	) async throws -> Void
		{
		var args = [String]()
		args.append(toJson(newSize))
		let encodedFacadeName = toJson("MobileFacade")
		let encodedMethodName = toJson("keyboardSizeChanged")
		let _ = try await self.transport.sendRequest(requestType: "ipc",  args: [encodedFacadeName, encodedMethodName] + args)
		}
	
}
