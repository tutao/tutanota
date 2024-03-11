/* generated file, don't edit. */


/**
 * Position and size of the active element. Used e.g. as an anchor for file picker popup.
 */
public struct IpcClientRect : Codable {
	public init(
		x: Int,
		y: Int,
		width: Int,
		height: Int
	) {
		self.x = x
		self.y = y
		self.width = width
		self.height = height
	}
	public let x: Int
	public let y: Int
	public let width: Int
	public let height: Int
}
