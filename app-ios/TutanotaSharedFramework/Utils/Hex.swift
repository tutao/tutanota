let char0 = Character("0").asciiValue!
let char9 = Character("9").asciiValue!
let charALower = Character("a").asciiValue!
let charFLower = Character("f").asciiValue!
let charAUpper = Character("A").asciiValue!
let charFUpper = Character("F").asciiValue!

public extension Data {
	init?(hexEncoded: String) {
		func charToHalfByte(_ char: UInt8) -> UInt8? {
			// convert hex character into the corresponding half a byte
			// e.g. '0' -> 0
			//      'a' -> 10
			//      'A' -> 10
			switch char {
			// small values map directly
			case char0...char9: char - char0
			// for bigger values we need to shift not by the whole offset of 'a' but more because halfByte has a value
			case charALower...charFLower: char - charALower + 0xA
			case charAUpper...charFUpper: char - charAUpper + 0xA
			default: nil
			}
		}

		guard let asciiData = hexEncoded.data(using: .ascii) else { return nil }
		guard asciiData.count % 2 == 0 else { return nil }
		// each byte is represented by two characters so output is 2x smaller
		var resultData = Data(count: asciiData.count / 2)
		for resultIndex in 0..<resultData.endIndex {
			let (upperChar, lowerChar) = (asciiData[resultIndex * 2], asciiData[resultIndex * 2 + 1])
			guard let upperByte = charToHalfByte(upperChar), let lowerByte = charToHalfByte(lowerChar) else { return nil }
			// combine two halves of the byte into the whole byte
			// put upper into the higher bytes and fill the rest with lower
			let wholeByte = (upperByte << 4) | lowerByte
			resultData[resultIndex] = wholeByte
		}
		self.init(resultData)
	}
}

public extension Data {
	func hexEncodedString() -> String {
		// convert half byte into ASCII character code
		// e.g. 0 -> 48 (code for '0', 0x30)
		//      10 -> 97 (code for 'a', 0x61)
		func halfByteToChar(_ halfbyte: UInt8) -> UInt8 {
			switch halfbyte {
			// small values map directly
			case 0x0...0x9: halfbyte + char0
			// for bigger values we need to shift not by the whole offset of 'a' because halfByte is already a value
			case 0xA...0xF: halfbyte + charALower - 0xA
			default: fatalError("You got hexed!")
			}
		}

		// Each byte is encoded as two characters so the size will be x2
		var result = Data(count: self.count * 2)
		for (index, byte) in self.enumerated() {
			// byte is 8 bits and we want to encode lower and upper parts separately

			// shift the upper part right so that we only have the upper part
			// 1 0 1 0 1 0 1 0 >> 4 -> 0 0 0 0 1 0 1 0
			let upper = byte >> 4
			// mask the upper part so that we only have the lower part
			// 0b1111 is a short for 0b00001111
			// 1 0 1 0 1 0 1 0 & 0b1111 -> 1 0 1 0 0 0 0 0
			let lower = byte & 0b1111
			result[index * 2] = halfByteToChar(upper)
			result[index * 2 + 1] = halfByteToChar(lower)

		}
		return String(data: result, encoding: .nonLossyASCII)!
	}
}
