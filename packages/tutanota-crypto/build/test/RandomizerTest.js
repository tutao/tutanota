import o from "@tutao/otest";
import { random } from "../lib/random/Randomizer.js";
import sjcl from "../lib/internal/sjcl.js";
import { CryptoError } from "../lib/misc/CryptoError.js";
import { assertThrows } from "@tutao/tutanota-test-utils";
o.spec("Randomizer", function () {
    o.beforeEach(function () {
        random.random = new sjcl.prng(6);
    });
    o("seeding", function () {
        o(random.isReady()).equals(false);
        assertThrows(CryptoError, async () => random.generateRandomData(1));
        random.addEntropy([
            {
                data: 10,
                entropy: 255,
                source: "mouse",
            },
        ]);
        o(random.isReady()).equals(false);
        assertThrows(CryptoError, async () => random.generateRandomData(1));
        random.addEntropy([
            {
                data: 10,
                entropy: 1,
                source: "key",
            },
        ]);
        o(random.isReady()).equals(true);
    });
    o("random data should return array of required length", function () {
        random.addEntropy([
            {
                data: 10,
                entropy: 256,
                source: "key",
            },
        ]);
        for (let i = 1; i < 20; i++) {
            let r = random.generateRandomData(i);
            o(r.length).equals(i);
        }
    });
    o("random numbers should be fairly distributed", function () {
        const runs = 10000;
        const bytesPerRun = 16;
        random.addEntropy([
            {
                data: 10,
                entropy: 256,
                source: "key",
            },
        ]);
        let results = new Array(256).fill(0);
        let upperHalfCount = 0;
        let lowerHalfCount = 0;
        for (let i = 1; i <= runs; i++) {
            let r = random.generateRandomData(bytesPerRun);
            for (const number of r) {
                results[number]++;
                if (number >= 128) {
                    upperHalfCount++;
                }
                else {
                    lowerHalfCount++;
                }
            }
        }
        for (const count of results) {
            o(count >= 500).equals(true); // uniform distribution would mean that each possible number occured 625 times (80%)
        }
        let lowerHalfPercent = (100 / (runs * bytesPerRun)) * lowerHalfCount;
        o(lowerHalfPercent > 49 && lowerHalfPercent < 51).equals(true)("distribution should be nearly uniform"); // TODO generate image from RNG to visualize performance:
        // http://boallen.com/random-numbers.html
    });
});
