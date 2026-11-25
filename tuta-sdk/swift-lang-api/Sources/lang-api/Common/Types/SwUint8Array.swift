public class SwUint8Array: @unchecked Sendable {
  private var inner: ArrayView<UInt8>

  private init(_ array: ArrayView<UInt8> = ArrayView()) {
    self.inner = array
  }

  public var length: SwInt {
    return SwInt(self.inner.count)
  }

  public subscript(index: SwInt) -> Nullable<UInt8> {
    get {
      let actualIndex = self.inner.startIndex + index.inner
      guard self.inner.indices.contains(actualIndex) else {
        return nil
      }
      return self.inner[actualIndex]
    }
    set(newValue) {
      let actualIndex = self.inner.startIndex + index.inner
      guard self.inner.indices.contains(actualIndex) else {
        return
      }
      self.inner[actualIndex] = newValue ?? 0
      return
    }
  }

  public func subarray(_ begin: SwInt = SwInt(0), _ end: SwInt? = nil) -> SwUint8Array {
    var begin = begin.inner
    if begin < 0 {
      begin = self.length.inner + begin
    }
    begin = min(max(begin, 0), self.length.inner)
    let startIndex = self.inner.startIndex + begin

    var end = end?.inner ?? self.length.inner
    if end < 0 {
      end = self.length.inner + end
    }
    end = min(max(end, 0), self.length.inner)
    let endIndex = self.inner.startIndex + end

    guard
      (self.inner.indices.contains(startIndex) || startIndex == self.inner.endIndex)
        && (self.inner.indices.contains(endIndex) || endIndex == self.inner.endIndex)
    else {
      fatalError("programming error in SwUint8Array.subarray")
    }

    guard startIndex < endIndex else {
      return SwUint8Array()
    }

    return SwUint8Array(self.inner[startIndex..<endIndex])
  }

  private func set_notTheKeyword(_ array: ArrayView<UInt8>, _ targetOffset: SwInt = SwInt(0))
    throws
  {
    guard SwInt(0) <= targetOffset && targetOffset <= self.length else {
      throw try TutanotaError(SwString("RangeError"), SwString("invalid or out-of-range index"))
    }
    guard targetOffset + SwInt(array.count) <= self.length else {
      throw try TutanotaError(SwString("RangeError"), SwString("source array is too long"))
    }

    let offsetStartIndex = self.inner.startIndex + targetOffset.inner

    for i in array.indices {
      self.inner[offsetStartIndex + i] = array[array.startIndex + i]
    }
  }

  public func set_notTheKeyword(_ array: SwArray<SwInt>, _ targetOffset: SwInt = SwInt(0))
    throws
  {
    try self.set_notTheKeyword(
      ArrayView(array.map { element in UInt8(element.inner) }), targetOffset
    )
  }

  public func set_notTheKeyword(_ array: SwUint8Array, _ targetOffset: SwInt = SwInt(0))
    throws
  {
    try self.set_notTheKeyword(array.inner, targetOffset)
  }

  public func fill(_ value: SwInt, _ start: SwInt = SwInt(0), _ end: SwInt? = nil) -> Self {
    var start = start.inner
    if start < 0 {
      start = self.length.inner + start
    }
    start = min(max(start, 0), self.length.inner)
    let startIndex = self.inner.startIndex + start

    var end = end?.inner ?? self.length.inner
    if end < 0 {
      end = self.length.inner + end
    }
    end = min(max(end, 0), self.length.inner)
    let endIndex = self.inner.startIndex + end

    guard startIndex < endIndex else {
      return self
    }

    for i in startIndex..<endIndex {
      self.inner[i] = UInt8(value.inner)
    }

    return self
  }

  public static func from(_ arrayLike: any Sequence<SwInt>)
    -> SwUint8Array
  {
    return SwUint8Array(ArrayView(arrayLike.map { element in UInt8(element.inner) }))
  }

  public static func from<T>(
    _ arrayLike: any Sequence<T>,
    _ mapFn: (T) throws -> SwInt
  ) rethrows -> SwUint8Array {
    return SwUint8Array.from(try arrayLike.map(mapFn))
  }

  public static func of(_ elements: SwInt...) -> SwUint8Array {
    return SwUint8Array(ArrayView(elements.map { element in UInt8(element.inner) }))
  }
}
