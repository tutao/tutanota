import Foundation

// TODO: This does not do any bounds checking. Should it or should the caller have to take care of it?
internal struct ArrayView<T> {
  private let array: NSMutableArray
  let indices: Range<Int>
  var count: Int {
    indices.count
  }
  var startIndex: Int {
    self.indices.startIndex
  }
  var endIndex: Int {
    self.indices.endIndex
  }

  init() {
    self.array = NSMutableArray()
    self.indices = 0..<0
  }

  init(_ array: [T], range: Range<Int>? = nil) {
    let array = NSMutableArray(array: array)
    self.array = array
    self.indices = range ?? 0..<array.count
  }

  init(_ other: ArrayView<T>, range: Range<Int>? = nil) {
    self.array = other.array
    self.indices =
      range != nil
      ? (other.startIndex + range!.startIndex)..<(other.startIndex + range!.endIndex)
      : other.indices
  }

  subscript(index: Int) -> T {
    get {
      array[indices.lowerBound + index] as! T
    }
    set {
      array[indices.lowerBound + index] = newValue
    }
  }

  subscript(range: Range<Int>) -> ArrayView<T> {
    get {
      ArrayView(self, range: range)
    }
  }
}
