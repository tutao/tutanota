public class SwUint8Array: @unchecked Sendable {
  private var inner: ArrayView<UInt8>

  private init(_ array: ArrayView<UInt8> = ArrayView()) {
    self.inner = array
  }

  public var length: SwNumber {
    return SwNumber(self.inner.count)
  }

  public subscript(index: SwNumber) -> Nullable<SwNumber> {
    get {
      let actualIndex = self.inner.startIndex + index.int
      guard self.inner.indices.contains(actualIndex) else {
        return nil
      }
      return SwNumber(Int(self.inner[actualIndex]))
    }
    set(newValue) {
      let actualIndex = self.inner.startIndex + index.int
      guard self.inner.indices.contains(actualIndex) else {
        return
      }
      self.inner[actualIndex] = UInt8(newValue?.inner ?? 0)
      return
    }
  }

  public func subarray(_ begin: SwNumber = SwNumber(0), _ end: SwNumber? = nil) -> SwUint8Array {
    var begin = begin.int
    if begin < 0 {
      begin = self.length.int + begin
    }
    begin = min(max(begin, 0), self.length.int)
    let startIndex = self.inner.startIndex + begin

    var end = end?.int ?? self.length.int
    if end < 0 {
      end = self.length.int + end
    }
    end = min(max(end, 0), self.length.int)
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

  private func set_notTheKeyword(_ array: ArrayView<UInt8>, _ targetOffset: SwNumber = SwNumber(0))
    throws
  {
    guard SwNumber(0) <= targetOffset && targetOffset <= self.length else {
      throw try TutanotaError(SwString("RangeError"), SwString("invalid or out-of-range index"))
    }
    guard targetOffset + SwNumber(array.count) <= self.length else {
      throw try TutanotaError(SwString("RangeError"), SwString("source array is too long"))
    }

    let offsetStartIndex = self.inner.startIndex + targetOffset.int

    for i in array.indices {
      self.inner[offsetStartIndex + i] = array[array.startIndex + i]
    }
  }

  public func set_notTheKeyword(_ array: SwArray<SwNumber>, _ targetOffset: SwNumber = SwNumber(0))
    throws
  {
    try self.set_notTheKeyword(
      ArrayView(array.map { element in UInt8(element.inner) }), targetOffset
    )
  }

  public func set_notTheKeyword(_ array: SwUint8Array, _ targetOffset: SwNumber = SwNumber(0))
    throws
  {
    try self.set_notTheKeyword(array.inner, targetOffset)
  }

  public func fill(_ value: SwNumber, _ start: SwNumber = SwNumber(0), _ end: SwNumber? = nil)
    -> Self
  {
    var start = start.int
    if start < 0 {
      start = self.length.int + start
    }
    start = min(max(start, 0), self.length.int)
    let startIndex = self.inner.startIndex + start

    var end = end?.int ?? self.length.int
    if end < 0 {
      end = self.length.int + end
    }
    end = min(max(end, 0), self.length.int)
    let endIndex = self.inner.startIndex + end

    guard startIndex < endIndex else {
      return self
    }

    for i in startIndex..<endIndex {
      self.inner[i] = UInt8(value.inner)
    }

    return self
  }

  public static func from(_ arrayLike: any Sequence<SwNumber>)
    -> SwUint8Array
  {
    return SwUint8Array(ArrayView(arrayLike.map { element in UInt8(element.inner) }))
  }

  public static func from<T>(
    _ arrayLike: any Sequence<T>,
    _ mapFn: (T) throws -> SwNumber
  ) rethrows -> SwUint8Array {
    return SwUint8Array.from(try arrayLike.map(mapFn))
  }

  public static func of(_ elements: SwNumber...) -> SwUint8Array {
    return SwUint8Array(ArrayView(elements.map { element in UInt8(element.inner) }))
  }
}
