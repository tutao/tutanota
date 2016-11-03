
//
//  Created by Bernd Deterding on 21.10.16.
//  Copyright © 2016 Bernd Deterding. All rights reserved.
//

#import <XCTest/XCTest.h>

@interface StreamTest : XCTestCase<NSStreamDelegate>

@property NSString *srcFile;
@property NSMutableData *data;
@property NSInteger *bytesRead;
@property NSCondition *condition;

@property XCTestExpectation *expect;


@end

@implementation StreamTest

- (void)setUp {
    [super setUp];

    NSBundle *bundle = [NSBundle bundleForClass:[self class]];
    self.srcFile = [bundle pathForResource:@"CompatibilityTestData" ofType:@"json"];
    self.data  = [NSMutableData data];
    self.bytesRead = 0;
    self.condition = [[NSCondition alloc] init];

	
	
}

- (void)tearDown {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
    [super tearDown];
}

- (void)testInitStreamFromFile {

	//StreamHelper *streamHelper = [[StreamHelper alloc]init];
	
	NSDate *timeoutDate = [NSDate dateWithTimeIntervalSinceNow:10.0];
	
	self.expect = [self expectationWithDescription:@"Read file data"];
 

	NSInputStream *inputStream = [[NSInputStream alloc] initWithFileAtPath:self.srcFile];
	[inputStream setDelegate:self];
	[inputStream scheduleInRunLoop:[NSRunLoop currentRunLoop]
                    forMode:NSDefaultRunLoopMode];
	[inputStream open];
		
	NSStreamStatus status = [inputStream streamStatus];
	
	/*
	dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        sleep(5);
        [self performSelectorInBackground:@selector(_method2) withObject:nil];
    });
	
	*/
	
	[self waitForExpectationsWithTimeout:5.0 handler:^(NSError *error) {
        if (error) {
			NSLog(@"Timeout Error: %@", error);
		}
	}];
}


//- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)eventCode{
- (void)stream:(NSStream *)aStream handleEvent:(NSStreamEvent)eventCode{
    NSLog(@"event %lu %@", (unsigned long)eventCode, aStream);
    
    switch(eventCode) {
            
        case NSStreamEventHasBytesAvailable:
        {
            uint8_t buf[1024];
            NSInteger len = 0;
            len = [(NSInputStream *)aStream read:buf maxLength:1024];
            if(len) {
                [self.data appendBytes:(const void *)buf length:len];
                // bytesRead is an instance variable of type NSNumber.
                self.bytesRead = self.bytesRead +len;
            } else {
                NSLog(@"no buffer!");
            }
            break;
        }
            
        case NSStreamEventEndEncountered:
        {
            [aStream close];
            [aStream removeFromRunLoop:[NSRunLoop currentRunLoop]
                              forMode:NSDefaultRunLoopMode];
            
            //[stream release];
            aStream = nil; // stream is ivar, so reinit it
			
			[self.expect fulfill];
            break;
        }
            // continued ...
    }

}

//- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)eventCode{
- (void)threadMethod{

}

@end
