/* generated file, don't edit. */


import Foundation

public protocol MobileFacade {
	func handleBackPress(
	) async throws -> Bool
	func visibilityChange(
		_ visibility: Bool
	) async throws -> Void
	func keyboardSizeChanged(
		_ newSize: Int
	) async throws -> Void
}
