//
//  JFGC.h
//
//  Created by Jason Fuerstenberg on 2008/05/01.
//	Copyright 2008 Jason Fuerstenberg
//
//	Licensed under the Apache License, Version 2.0 (the "License");
//	you may not use this file except in compliance with the License.
//	You may obtain a copy of the License at
//
//	http://www.apache.org/licenses/LICENSE-2.0
//
//	Unless required by applicable law or agreed to in writing, software
//	distributed under the License is distributed on an "AS IS" BASIS,
//	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//	See the License for the specific language governing permissions and
//	limitations under the License.

#if __has_feature(objc_arc)

#define JFAssign(to, from) { to = from; }
#define JFRelease(a) { a = nil; }
#define JFFree(a) { free(a); a = NULL; }

#else

/*
 * The JFAssign macro assigns the value of one object reference to another.
 */
#define JFAssign(to, from) { id __temp__ = from; JFRelease(to); to = [__temp__ retain]; }

/*
 * The JFRelease macro releases an objective C object using the release method.
 * If the object reference is nil nothing will be released.
 * The object reference is then assigned to nil.
 */
#define JFRelease(a) { id __temp__ = a; [__temp__ release]; a = nil; }

/*
 * The JFFree macro releases a non-objective C memory buffer using the free function.
 * If the pointer is nil nothing will be freed.
 * The pointer is then assigned to nil.
 */
#define JFFree(a) { free(a); a = NULL; }

#endif