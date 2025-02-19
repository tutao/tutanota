import o from "@tutao/otest";
import { LazyLoaded } from "../lib/LazyLoaded.js";
import { assertThrows } from "@tutao/tutanota-test-utils";
o.spec("LazyLoaded", function () {
    o("default value", async function () {
        const ll = new LazyLoaded(() => Promise.resolve(1), 3);
        o(ll.isLoaded()).equals(false);
        o(ll.getSync()).equals(3);
        const v = await ll.getAsync();
        o(v).equals(1);
        o(ll.getSync()).equals(1);
    });
    o("reset and reload", async function () {
        let ret = 0;
        const ll = new LazyLoaded(() => Promise.resolve(ret++), -1);
        o(ll.getSync()).equals(-1);
        const v = await ll.getAsync();
        o(v).equals(0);
        o(ll.isLoaded()).equals(true);
        ll.reset();
        o(ll.isLoaded()).equals(false);
        o(ll.getSync()).equals(null);
        const v2 = await ll.getAsync();
        o(v2).equals(1);
    });
    o("multiple getAsync", async function () {
        let ret = 0;
        const ll = new LazyLoaded(() => Promise.resolve(ret++));
        const arr = await Promise.all([ll.getAsync(), ll.getAsync(), ll.getAsync()]);
        o(arr).deepEquals([0, 0, 0]);
    });
    o("don't cache errors", async function () {
        let ret = 0;
        const ll = new LazyLoaded(() => (ret % 2 === 1 ? Promise.resolve(ret++) : Promise.reject((ret++, new Error("fail")))));
        await assertThrows(Error, async () => await ll.getAsync());
        o(ret).equals(1);
        const one = await ll.getAsync();
        o(one).equals(1);
    });
});
