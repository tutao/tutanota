// @flow
import o from "ospec"
import {
	GENERATED_MIN_ID,
	generatedIdToTimestamp,
	timestampToGeneratedId,
	timestampToHexGeneratedId
} from "../../../src/api/common/utils/EntityUtils"

o.spec("EntityUtils", function () {
	o("TimestampToHexGeneratedId ", function () {
		let timestamp = 1370563200000
		o(timestampToHexGeneratedId(timestamp, 0)).equals("4fc6fbb10000000000")
	})

	o("TimestampToHexGeneratedId server id 1", function () {
		let timestamp = 1370563200000
		o(timestampToHexGeneratedId(timestamp, 1)).equals("4fc6fbb10000000001")
	})

	o("generatedIdToTimestamp ", function () {
		let maxTimestamp = (Math.pow(2, 42) - 1)

		o(generatedIdToTimestamp(GENERATED_MIN_ID)).equals(0)
		o(generatedIdToTimestamp(timestampToGeneratedId(0))).equals(0)
		o(generatedIdToTimestamp("zzzzzzzzzzzz")).equals(maxTimestamp)
		o(generatedIdToTimestamp("IwQvgF------")).equals(1370563200000)
	})
})