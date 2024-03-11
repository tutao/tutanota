/* generated file, don't edit. */


public struct NativeShortcut : Codable {
	public init(
		key: NativeKey,
		ctrl: Bool?,
		alt: Bool?,
		shift: Bool?,
		meta: Bool?,
		help: String
	) {
		self.key = key
		self.ctrl = ctrl
		self.alt = alt
		self.shift = shift
		self.meta = meta
		self.help = help
	}
	public let key: NativeKey
	public let ctrl: Bool?
	public let alt: Bool?
	public let shift: Bool?
	public let meta: Bool?
	public let help: String
}
