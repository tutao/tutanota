public extension Data {
	init?(hexEncoded: String) {
		self.init(TUTEncodingConverter.hex(toBytes: hexEncoded))
	}
}

public extension Data {
	func hexEncodedString() -> String {
		TUTEncodingConverter.bytes(toHex: self)
	}
}
