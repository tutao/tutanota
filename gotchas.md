gotchas:

 - `something?: Sometype` mean that it is that something can be undefined but not null
 - since null and undefined are not treated the same you might want to slap some easy `?? null` or `?? undefined` in places
 - types are not inferred backwards. If you say that let thing = null and then assign to thing, it's still of type null. You might want to sprinkle some `as Meh` when declaring things.
 - `filter(Boolean)` is `filter(isNotNull)` now