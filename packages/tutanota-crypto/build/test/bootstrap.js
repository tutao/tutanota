import { random } from "../lib/random/Randomizer.js";
export async function bootstrapTests() {
    await random.addEntropy([
        {
            data: 36,
            entropy: 256,
            source: "key",
        },
    ]);
}
