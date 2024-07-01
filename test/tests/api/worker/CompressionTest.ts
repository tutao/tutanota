import o from "@tutao/otest"
import { compress, uncompress } from "../../../../src/common/api/worker/Compression.js"
import { base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"

import testData from "./CompressionCompatibilityTestData.json"

o.spec("Compression/Decompression", function () {
	const lowerBound = 12

	o.spec("round trip good input", function () {
		function compressibleData(n) {
			const data = "wwwwoooooooooooowwwwwwwwwweeeeeeeeeeeeeeeeeeeee"
			return Uint8Array.from(new Array(n).fill(undefined).map((_, idx) => data.charCodeAt(idx % data.length) % 256))
		}

		function testGoodInput(input) {
			const a = compress(input)
			const b = uncompress(a)
			const c = compress(b)
			const result = uncompress(c)
			o(Array.from(result)).deepEquals(Array.from(input))
		}

		o("normal text", function () {
			testGoodInput(stringToUtf8Uint8Array(data()))
		})
		o("almost too small", function () {
			testGoodInput(compressibleData(lowerBound + 1))
		})
		o("too small", function () {
			testGoodInput(compressibleData(lowerBound))
		})
		o("empty", function () {
			testGoodInput(new Uint8Array(0))
		})
	})

	o.spec("compatibility", function () {
		o("compression", function () {
			for (const testCase of testData) {
				o(uint8ArrayToBase64(compress(stringToUtf8Uint8Array(testCase.uncompressedText)))).equals(testCase.compressedBase64TextJavaScript)
			}
		})

		o("decompression", function () {
			for (const testCase of testData) {
				o(utf8Uint8ArrayToString(uncompress(base64ToUint8Array(testCase.compressedBase64TextJavaScript)))).equals(testCase.uncompressedText)
			}
		})
	})
})

function data() {
	return (
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tempor orci eu lobortis elementum nibh. Nibh tellus molestie nunc non blandit. Varius quam quisque id diam vel quam. Sit amet aliquam id diam maecenas ultricies mi eget. Erat pellentesque adipiscing commodo elit at imperdiet dui accumsan. Suspendisse ultrices gravida dictum fusce ut placerat orci nulla. Et malesuada fames ac turpis egestas integer eget aliquet nibh. Vitae purus faucibus ornare suspendisse. Ullamcorper eget nulla facilisi etiam dignissim diam quis enim. Volutpat maecenas volutpat blandit aliquam. Cursus turpis massa tincidunt dui ut ornare. A diam maecenas sed enim ut sem viverra.\n" +
		"\n" +
		"Sit amet nisl suscipit adipiscing bibendum est ultricies integer. Pretium vulputate sapien nec sagittis aliquam malesuada. Convallis aenean et tortor at risus viverra adipiscing at in. Euismod lacinia at quis risus sed. Dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Varius duis at consectetur lorem donec. Urna nunc id cursus metus. Sed faucibus turpis in eu mi bibendum neque egestas congue. Gravida in fermentum et sollicitudin ac orci. Sed sed risus pretium quam. Nunc scelerisque viverra mauris in aliquam sem fringilla. Lectus vestibulum mattis ullamcorper velit sed. Amet commodo nulla facilisi nullam vehicula ipsum. Iaculis eu non diam phasellus vestibulum lorem. Felis bibendum ut tristique et egestas. Lobortis mattis aliquam faucibus purus in massa. Nisi vitae suscipit tellus mauris a diam maecenas sed. Velit sed ullamcorper morbi tincidunt ornare massa.\n" +
		"\n" +
		"Ut pharetra sit amet aliquam id diam maecenas ultricies mi. Dolor sit amet consectetur adipiscing elit pellentesque habitant morbi tristique. Consectetur adipiscing elit pellentesque habitant. Vel orci porta non pulvinar. Gravida cum sociis natoque penatibus et magnis. Eget egestas purus viverra accumsan in nisl nisi scelerisque. Erat nam at lectus urna duis convallis. Bibendum est ultricies integer quis auctor. Enim ut tellus elementum sagittis vitae et leo duis. Tellus elementum sagittis vitae et leo duis. Sem fringilla ut morbi tincidunt.\n" +
		"\n" +
		"Egestas diam in arcu cursus euismod quis viverra. Amet luctus venenatis lectus magna fringilla urna porttitor. Egestas sed sed risus pretium quam. Turpis massa tincidunt dui ut ornare. Convallis tellus id interdum velit laoreet id donec ultrices. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Rhoncus urna neque viverra justo nec ultrices. Sapien pellentesque habitant morbi tristique senectus et. Phasellus vestibulum lorem sed risus ultricies tristique nulla aliquet. Odio ut enim blandit volutpat maecenas volutpat blandit. Vulputate eu scelerisque felis imperdiet proin fermentum leo vel. Vitae ultricies leo integer malesuada nunc vel risus. Auctor elit sed vulputate mi sit amet mauris commodo quis.\n" +
		"\n" +
		"Turpis in eu mi bibendum neque egestas congue quisque egestas. Tincidunt praesent semper feugiat nibh. Ante in nibh mauris cursus mattis molestie a. Urna porttitor rhoncus dolor purus. Feugiat in fermentum posuere urna nec tincidunt. Pellentesque massa placerat duis ultricies lacus sed turpis tincidunt. Amet dictum sit amet justo donec enim diam vulputate ut. Egestas purus viverra accumsan in. Elementum sagittis vitae et leo. Euismod quis viverra nibh cras pulvinar mattis nunc. Ultricies mi eget mauris pharetra et ultrices. Mauris vitae ultricies leo integer malesuada nunc vel. Justo laoreet sit amet cursus sit. Vestibulum lectus mauris ultrices eros in cursus. Nunc congue nisi vitae suscipit tellus mauris a."
	)
}
