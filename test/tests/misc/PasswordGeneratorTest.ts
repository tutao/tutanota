import o from "@tutao/otest"
import { BYTE_RANGE, PasswordGenerator } from "../../../src/common/misc/passwords/PasswordGenerator.js"
import { downcast } from "@tutao/tutanota-utils"

o.spec("PasswordGenerator", function () {
	let generator: PasswordGenerator
	let randomNumber: number
	const DICTIONARY = [
		"dash",
		"flash",
		"neighbour",
		"escape",
		"office",
		"season",
		"priority",
		"liberty",
		"bottom",
		"summary",
		"affair",
		"peak",
		"lazy",
		"method",
		"computer",
		"smooth",
		"muzzle",
		"fine",
		"assume",
		"distant",
		"fling",
		"give",
		"borrow",
		"conservation",
	]

	o.beforeEach(function () {
		randomNumber = 0
		const randomizerMock = {
			async generateRandomNumber() {
				return randomNumber
			},
		}

		generator = new PasswordGenerator(randomizerMock, [])
	})

	o.spec("generate random data", function () {
		o("generate random number in range", async function () {
			// min possible number that can be generated
			o(await generator.generateRandomNumberInRange(10)).equals(0)

			// max possible number that can be generated
			// range is not included, meaning that for range 10 the max number will be 9
			randomNumber = BYTE_RANGE - 1
			o(await generator.generateRandomNumberInRange(10)).equals(9)

			// check edge cases to see if scaling is uniform/correct
			// easiest way to check edge cases is with a graphic calculator, type in functions and check where they intersect
			// TODO these test do not work anymore as we changed the range from 3Bytes to 2Bytes

			// const lowerBoundFor7 = 11744052
			// const upperBoundFor7 = 13421772
			//
			// randomNumber = lowerBoundFor7 - 1
			// o(await generator.generateRandomNumberInRange(10)).equals(6)
			// randomNumber = lowerBoundFor7
			// o(await generator.generateRandomNumberInRange(10)).equals(7)
			//
			// randomNumber = upperBoundFor7
			// o(await generator.generateRandomNumberInRange(10)).equals(7)
			// randomNumber = upperBoundFor7 + 1
			// o(await generator.generateRandomNumberInRange(10)).equals(8)
		})

		o("there should be no duplicates in the generated password", async function () {
			const passwordGenerator = new PasswordGenerator(downcast({}), ["a", "B", "c", "d", "c", "e", "f", "g"])

			let i = 0
			passwordGenerator.generateRandomNumberInRange = async function () {
				return i++
			}

			const randomPassword = await passwordGenerator.generateRandomPassphrase()
			o(randomPassword).equals("a B c d e f")
		})
	})
})
