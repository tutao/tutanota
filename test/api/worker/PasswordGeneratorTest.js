// @flow
import o from "ospec"
import {generatePassword} from "../../../src/api/worker/utils/PasswordGenerator"
import {Randomizer} from "../../../src/api/worker/crypto/Randomizer"
import {getPasswordStrength} from "../../../src/misc/PasswordUtils"


export class MockRandomizer extends Randomizer {
	random: Uint8Array

	generateRandomData(nbrOfBytes: number): Uint8Array {
		return this.random
	}
}

o.spec("PasswordGenerator", function () {
	const randomMock = new MockRandomizer()

	o.only("generates a password", function () {
		randomMock.random = new Uint8Array(Array.from({length: 13}, () => 1))
		o(generatePassword(randomMock)).equals("!!!!!!!!!!!!!")
	})

	o.only("password is strong enough", function () {
		randomMock.random = new Uint8Array([0, 8, 241, 186, 214, 95, 254, 26, 84, 169, 209, 243, 167])
		const password = generatePassword(randomMock)
		const strength = getPasswordStrength(password, [])
		o(strength > 80).equals(true)
	})
})
