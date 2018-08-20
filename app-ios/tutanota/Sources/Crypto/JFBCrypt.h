//
// JFBCrypt.h
// JFCommon
//
// Created by Jason Fuerstenberg on 11/07/03.
// Copyright (c) 2011 Jason Fuerstenberg. All rights reserved.
//
// http://www.jayfuerstenberg.com
// jay@jayfuerstenberg.com
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// This objective C port is based on the original Java implementation by Damien Miller
// found here: http://www.mindrot.org/projects/jBCrypt/
// In accordance with the Damien Miller's request, his original copyright covering
// his Java implementation is included in the accompanying BCrypt-java-copyright.txt file.

#import <Foundation/Foundation.h>

#import "JFGC.h"		// For GC related macros


/*
 * The JFBCrypt utility class.
 * This class has been tested to work on iOS 4.2.
 */
@interface JFBCrypt : NSObject {

@private
	SInt32 *_p;
	SInt32 *_s;
}

//+ (NSString *) hashPassword: (NSString *) password withSalt: (NSString *) salt;
- (NSData *) hashPassword: (NSData *) password withSalt: (NSData *) salt rounds: (SInt32) numberOfRounds;

@end
