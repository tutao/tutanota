//
//  TUTLogTest.m
//  tutanotaTests
//
//  Created by Tutao GmbH on 26.09.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import <XCTest/XCTest.h>
#import "../tutanota/Sources/Utils/TUTLog.h"
#import "../tutanota/Sources/Utils/Swiftier.h"

@interface TUTLogTest : XCTestCase

@end

@implementation TUTLogTest

- (void)setUp {
    // Put setup code here. This method is called before the invocation of each test method in the class.
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
}

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
