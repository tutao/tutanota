import o from "ospec/ospec.js"
import {random} from "../../../src/api/worker/crypto/Randomizer"
import {CryptoError} from "../../../src/api/common/error/CryptoError"
import sjcl from "../../../src/api/worker/crypto/lib/crypto-sjcl-1.3.0_1"
import {EntropySrc} from "../../../src/api/common/TutanotaConstants"

o.spec("Randomizer", function () {

	o.beforeEach(function () {
		random.random = new sjcl.prng(6)
	})

	o("seeding", function () {
		o(random.isReady()).equals(false)
		try {
			random.generateRandomData(1)
			o().equals("expected exception not thrown")
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
		}

		random.addEntropy([{data: 10, entropy: 255, source: EntropySrc.mouse}])
		o(random.isReady()).equals(false)
		try {
			random.generateRandomData(1)
			o().equals("expected exception not thrown")
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
		}

		random.addEntropy([{data: 10, entropy: 1, source: EntropySrc.key}])
		o(random.isReady()).equals(true)
	})

	o("random data should return array of required length", function () {
		random.addEntropy([{data: 10, entropy: 256, source: EntropySrc.key}])
		for (var i = 1; i < 20; i++) {
			let r = random.generateRandomData(i)
			o(r.length).equals(i)
		}
	})

	o("random numbers should be fairly distributed", function () {
		const runs = 10000
		const bytesPerRun = 16
		random.addEntropy([{data: 10, entropy: 256, source: EntropySrc.key}])
		let results = new Array(256).fill(0)
		let upperHalfCount = 0
		let lowerHalfCount = 0
		for (var i = 1; i <= runs; i++) {
			let r = random.generateRandomData(bytesPerRun)
			r.forEach(number => {
				results[number]++
				if (number >= 128) {
					upperHalfCount++
				} else {
					lowerHalfCount++
				}
			})
		}
		results.forEach(count => {
			o(count >= 500).equals(true) // uniform distribution would mean that each possible number occured 625 times (80%)
		})
		let lowerHalfPercent = 100 / (runs * bytesPerRun) * lowerHalfCount
		o(49 < lowerHalfPercent < 51).equals(true)("distribution should be nearly uniform")
		// FIXME generate image from RNG to visualize performance:
		// http://boallen.com/random-numbers.html
	})

})
