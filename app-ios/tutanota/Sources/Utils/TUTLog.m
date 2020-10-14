//
//  TUTLog.m
//  tutanota
//
//  Created by Tutao GmbH on 26.09.19.
//  Copyright © 2019 Tutao GmbH. All rights reserved.
//

#import "TUTLog.h"
#import "Swiftier.h"
#import "PSPDFFastEnumeration.h"

const int LOG_SIZE = 1000;


@interface TUTLogger ()
// Circular buffer with next available position pointed by index
@property NSMutableArray<NSString *> *buffer;
@property int index;
@property NSISO8601DateFormatter *dateFormatter;
@end

static TUTLogger *singleton = nil;

@implementation TUTLogger

- (instancetype)init{
    self = [super init];
    self.buffer = [[NSMutableArray alloc]initWithCapacity:LOG_SIZE];
    self.dateFormatter = [NSISO8601DateFormatter new];
    return self;
}

+ (instancetype)sharedInstance {
    if (!singleton) {
        singleton = [TUTLogger new];
    }
    return singleton;
}

-(void)addEntry:(NSString *)entry {
    self.buffer[self.index] = entry;
    self.index++;
    if (self.index == LOG_SIZE) {
        self.index = 0;
    }
}

-(NSArray<NSString *> *)entries {
    let newerPart = [self.buffer subarrayWithRange:NSMakeRange(0, self.index)];
    let olderPart = [self.buffer subarrayWithRange:NSMakeRange(self.index, self.buffer.count - self.index)];
    return [olderPart arrayByAddingObjectsFromArray:newerPart];
}
@end

void TUTLog(NSString *format, ...) {
    va_list args;
    va_start(args, format);
    NSString *contents = [[NSString alloc] initWithFormat:format arguments:args];
    va_end(args);
    TUTSLog(contents);
}

void TUTSLog(NSString *message) {
    let log = [TUTLogger sharedInstance];
    let dateString = [log.dateFormatter stringFromDate:NSDate.date];
    let entry = [NSString stringWithFormat:@"%@ %@ %@", dateString, @"I", message];
    [log addEntry:entry];
    NSLog(@"%@", message);
}
