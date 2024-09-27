#import <XCTest/XCTest.h>
#import "../TutanotaSharedFramework/Utils/TUTLog.h"
#import "../TutanotaSharedFramework/Utils/Swiftier.h"

@interface TUTLogTest : XCTestCase


@end

@implementation TUTLogTest
- (void)testBigLog {
    let logger = [TUTLogger new];
    for (int i = 0; i < LOG_SIZE + 2; i++) {
        [logger addEntry:[NSString stringWithFormat:@"%d", i]];
    }
    XCTAssertEqual([logger entries].count, LOG_SIZE);
    XCTAssert([@"2" isEqualToString:[logger entries][0]]);
    XCTAssert([@"1001" isEqualToString:[logger entries][LOG_SIZE - 1]]);
}

@end
