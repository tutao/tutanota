import o from "@tutao/otest";
import { murmurHash } from "../lib/hashes/MurmurHash.js";
o.spec("murmur hash", function () {
    o("32bitHash", function () {
        o(murmurHash("External images")).equals(4063203704);
        o(murmurHash("Matthias")).equals(194850999);
        o(murmurHash("map-free@tutanota.de")).equals(3865241570);
        o(murmurHash("Matthias Pfau")).equals(1016488926);
        o(murmurHash("asdlkasdj")).equals(1988722598);
        o(murmurHash("ö")).equals(108599527);
        o(murmurHash("asdlkasdjö")).equals(436586817);
        o(murmurHash("В чашах леса жил бы цитрус?")).equals(1081111591);
        o(murmurHash("👉")).equals(3807575468);
    });
});
