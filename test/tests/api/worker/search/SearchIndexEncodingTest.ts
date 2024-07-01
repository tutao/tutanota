import o from "@tutao/otest"
import {
	appendBinaryBlocks,
	calculateNeededSpace,
	decodeBinaryBlock,
	encodeBinaryBlock,
	encodeNumberBlock,
	iterateBinaryBlocks,
	numberOfBytes,
	removeBinaryBlockRanges,
} from "../../../../../src/common/api/worker/search/SearchIndexEncoding.js"
import { spy as makeSpy } from "@tutao/tutanota-test-utils"
import { concat } from "@tutao/tutanota-utils"

o.spec("SearchIndexEncoding test", function () {
	o("numberOfBytes", function () {
		const cases = [
			[0, 0],
			[128, 1],
			[255, 1],
			[256, 2],
			[257, 2],
			[511, 2],
			[512, 2],
			[Math.pow(2, 16) - 1, 2],
			[Math.pow(2, 16), 3], // 65536
		]
		for (const [num, res] of cases) {
			o(numberOfBytes(num)).equals(res)(`${num} should require ${res}`)
		}
	})
	o("calculateNeededSpaceSingleArray", function () {
		o(calculateNeededSpace([new Uint8Array(32)])).equals(1 + 32)
		o(calculateNeededSpace([new Uint8Array(127)])).equals(128)
		o(calculateNeededSpace([new Uint8Array(128)])).equals(1 + 1 + 128)
		o(calculateNeededSpace([new Uint8Array(65535)])).equals(1 + 2 + 65535)
		o(calculateNeededSpace([new Uint8Array(65536)])).equals(1 + 3 + 65536)
	})
	o("calculateNeededSpace", function () {
		const smallEntry = new Uint8Array(32)
		const bigEntry = new Uint8Array(512)
		o(calculateNeededSpace([smallEntry, bigEntry])).equals(1 + 32 + 1 + 2 + 512)
	})
	o.spec("encodeBinaryBlock", function () {
		o("with short length", function () {
			const newIndexEntry = new Uint8Array([0x1])
			const indexEntry = new Uint8Array(2)
			o(encodeBinaryBlock(newIndexEntry, indexEntry, 0)).equals(2)
			o(JSON.stringify(indexEntry)).equals(JSON.stringify(new Uint8Array([0x01, 0x01])))
		})
		o("with large length", function () {
			const entityData = new Uint8Array(256)
			const destinationData = new Uint8Array(259)
			o(encodeBinaryBlock(entityData, destinationData, 0)).equals(259)
			o(JSON.stringify(destinationData)).equals(JSON.stringify(new Uint8Array([0x82, 0x01, 0x00].concat(new Array(256).fill(0)))))
		})
		o("with large length, invalid offset", function () {
			const entityData = new Uint8Array(256)
			const destinationData = new Uint8Array(259)

			try {
				encodeBinaryBlock(entityData, destinationData, 1)
			} catch (e) {
				o(e.constructor).equals(RangeError)
			}
		})
		o("with large length, insufficient memory", function () {
			const entityData = new Uint8Array(256)
			const destinationData = new Uint8Array(2)

			try {
				encodeBinaryBlock(entityData, destinationData, 0)
				throw new Error()
			} catch (e) {
				o(e.constructor).equals(RangeError)
			}
		})
	})
	o.spec("decodeBinaryBlock", function () {
		o("with short length (literal length)", function () {
			const searchIndexData = new Uint8Array([0x01].concat([0x00]))
			o(JSON.stringify(decodeBinaryBlock(searchIndexData, 0))).equals(JSON.stringify(new Uint8Array([0x00])))
		})
		o("with short length (encoded length)", function () {
			const searchIndexData = new Uint8Array([0x7f].concat([0x00]))
			o(JSON.stringify(decodeBinaryBlock(searchIndexData, 0))).equals(JSON.stringify(new Uint8Array([0x00])))
		})
		o("with long length", function () {
			const searchIndexData = new Uint8Array([0x81, 0x01].concat([0x01, 0x02, 0x03]))
			o(JSON.stringify(decodeBinaryBlock(searchIndexData, 0))).equals(JSON.stringify(new Uint8Array([0x01])))
		})
		o("with long length and offset", function () {
			const searchIndexData = new Uint8Array([0x00, 0x82, 0x01, 0x00].concat(new Array(256).fill(0x00)))
			o(JSON.stringify(decodeBinaryBlock(searchIndexData, 1))).equals(JSON.stringify(new Uint8Array(256)))
		})
	})
	o.spec("removeBinaryBlockRanges", function () {
		o("works", function () {
			const row = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
			const expected = new Uint8Array([1, 3, 6])
			o(
				JSON.stringify(
					removeBinaryBlockRanges(row, [
						[0, 1],
						[2, 3],
						[4, 6],
						[7, 8],
					]),
				),
			).equals(JSON.stringify(expected))
		})
	})
	o.spec("iterateBinaryBlocks", function () {
		o("works", function () {
			const shortBlock = [0x01, 0x00] // literal length & data

			const longBlock = [0x81, 0x80].concat(new Array(128).fill(2)) // first byte - length of length, second length of data, rest is data

			const anotherLongBlock = [0x81, 0x81].concat(new Array(129).fill(3)) // first byte - length of length, second length of data, rest is data

			const anotherShortBlock = [0x02, 0x01, 0x02]
			// 0  1  2  3  4  5  6  7  8  9  10 11 12 13
			// l  d  l  l  d  d  d  l  l  d  l  d  d
			// [1 ]  [2          ]  [3     ] [4    ]
			// "i" - length, "d" data
			const row = new Uint8Array([shortBlock, longBlock, anotherLongBlock, anotherShortBlock].flat())
			const spy = makeSpy()
			iterateBinaryBlocks(row, spy)
			o(JSON.stringify(spy.invocations)).equals(
				JSON.stringify([
					[new Uint8Array(shortBlock.slice(1)), 0, 2, 0],
					[new Uint8Array(longBlock.slice(2)), 2, 132, 1],
					[new Uint8Array(anotherLongBlock.slice(2)), 132, 263, 2],
					[new Uint8Array(anotherShortBlock.slice(1)), 263, 266, 3],
				]),
			)
		})
	})
	o.spec("appendBinaryBlocks", function () {
		o("resizes when needed", function () {
			const row = new Uint8Array([0x01, 0x02])
			const newDataOne = new Uint8Array(256).fill(2)
			const newDataTwo = new Uint8Array([0x01])
			const expected = concat(new Uint8Array([0x01, 0x02]), new Uint8Array([0x82, 0x01, 0x00]), newDataOne, new Uint8Array([0x01, 0x01]))
			o(JSON.stringify(appendBinaryBlocks([newDataOne, newDataTwo], row))).equals(JSON.stringify(expected))
		})
	})
	o.spec("encodeNumberBlock", function () {
		o("encodes small numbers", function () {
			const block = new Uint8Array(1)
			encodeNumberBlock(3, block, 0)
			o(Array.from(block)).deepEquals([3])
		})
		o("encodes big numbers", function () {
			const number = 1550759936805
			const block = new Uint8Array(1 + 6)
			encodeNumberBlock(number, block, 0)
			o(Array.from(block)).deepEquals([0x80 | 0x6, 0x1, 0x69, 0x10, 0x7e, 0xc3, 0x25])
		})
	})
})
