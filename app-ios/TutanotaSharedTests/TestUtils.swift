import Mockable
import Testing

/// A matcher for Dictionary that tests that the dictionary has all entries.
func dictContains<K, V>(_ entries: [K: V]) -> ((Dictionary<K, V>) -> Bool) where K: Hashable, K: Equatable, V: Equatable {
	{ dictToTest in dictToTest.containsAll(from: entries) }
}

private extension Dictionary where Value: Equatable {
	func contains(key: Key, value: Value) -> Bool { self[key] == value }
	func containsAll(from dict: Self) -> Bool { dict.allSatisfy { dictEntry in self.contains(key: dictEntry.key, value: dictEntry.value) } }
}
