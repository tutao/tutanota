// Represents 0x0 (0) to 0x9 (9)
private let CHAR_0 = Character("0").asciiValue!
private let CHAR_9 = Character("9").asciiValue!

// Represents 0xA (10) to 0xF (15)
private let CHAR_A_LOWER = Character("a").asciiValue!
private let CHAR_F_LOWER = Character("f").asciiValue!
private let CHAR_A_UPPER = Character("A").asciiValue!
private let CHAR_F_UPPER = Character("F").asciiValue!

// For values represented by a letter, we need to offset by 0xA to properly convert them.
//
// For example, 0xB = 0xA + 1 = 10 + 1 = 11
private let HALF_BYTE_LETTER_OFFSET = UInt8(0xA)

public extension Data {
	init?(hexEncoded: String) {
		func charToHalfByte(_ char: UInt8) -> UInt8? {
			// convert hex character into the corresponding half a byte
			// e.g. '0' -> 0
			//      'a' -> 10
			//      'A' -> 10
			switch char {

			// small values map directly since our lower bound for a number is 0
			case CHAR_0...CHAR_9: char - CHAR_0

			// for a-f, char - CHAR_A_LOWER will give us the offset from 0xA, thus we have to re-add 0xA to get the final value
			case CHAR_A_LOWER...CHAR_F_LOWER: char - CHAR_A_LOWER + HALF_BYTE_LETTER_OFFSET
			case CHAR_A_UPPER...CHAR_F_UPPER: char - CHAR_A_UPPER + HALF_BYTE_LETTER_OFFSET

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
			// put upper into the higher bits and fill the rest with lower
			//

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

			// small values map directly since our lower bound for a number is 0
			case 0x0..<HALF_BYTE_LETTER_OFFSET: halfbyte + CHAR_0

			// for a-f, we first convert halfByte to an offset from 0xA, then add it to 'a' to get the hex character
			// e.g. 0xB -> (0xB - 0xA) + 'a' = (1) + 'a' = 'b'
			case HALF_BYTE_LETTER_OFFSET...0xF: (halfbyte - HALF_BYTE_LETTER_OFFSET) + CHAR_A_LOWER

			// should never happen since halfByte < 0x10
			default: fatalError("You got hexed!")
			}
		}

		// Each byte is encoded as two characters so the size will be x2
		var result = Data(count: self.count * 2)
		for (index, byte) in self.enumerated() {
			// byte is 8 bits and we want to encode lower and upper parts separately
			// to do this, we need to separate the higher and lower nibbles (half-bytes)

			// right-shift the byte by four bits to give us the upper nibble
			// (binary) 1 1 0 0 0 1 0 1 >> 4 -> 0 0 0 0 1 1 0 0
			// (hex)    0xC5 >> 4 = 0x0C
			let upper = byte >> 4

			// extract the lower nibble by binary ANDing with 0b1111 (0xF); this is the same as modulo 16
			// (binary) 1 1 0 0 0 1 0 1 & 0b00001111 -> 0 0 0 0 0 1 0 1
			// (hex)    0xC5 & 0x0F = 0x05
			let lower = byte & 0b00001111

			// convert each nibble separately and store the result
			result[index * 2] = halfByteToChar(upper)
			result[index * 2 + 1] = halfByteToChar(lower)

		}
		return String(data: result, encoding: .nonLossyASCII)!
	}
}
