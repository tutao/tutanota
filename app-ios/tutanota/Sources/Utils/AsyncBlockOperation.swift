import Foundation

typealias AsyncBlock = (@escaping () -> Void) -> Void

class AsyncBlockOperation : Foundation.Operation {
  // We need to keep KVO and it's hard to do with enum
  private var _isExecuting: Bool {
    willSet {
      self.willChangeValue(forKey: "isExecuting")
    }
    didSet {
      self.didChangeValue(forKey: "isExecuting")
    }
  }
  
  private var _isFinished: Bool {
    willSet {
      self.willChangeValue(forKey: "isFinished")
    }
    didSet {
      self.didChangeValue(forKey: "isFinished")
    }
  }
  
  private let block: AsyncBlock
  
  init(block: @escaping AsyncBlock) {
    self.block = block
    self._isExecuting = false
    self._isFinished = false
    super.init()
  }
  
  @objc
  override func start() {
    self._isExecuting = true
    self.block {
      self._isExecuting = false
      self._isFinished = true
    }
  }
  
  override var isExecuting: Bool {
    return self._isExecuting
  }
  
  override var isFinished: Bool {
    return self._isFinished
  }
  
  @objc
  override var isAsynchronous: Bool {
    get {
      return true
    }
  }
}

extension OperationQueue {
  func addAsyncOperation(block: @escaping AsyncBlock) {
    self.addOperation(AsyncBlockOperation(block: block))
  }
}
