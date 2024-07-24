//  Parts of 'Swiftier Objective-C' articles.
//  See https://pspdfkit.com/blog/2017/even-swiftier-objective-c

#if defined(__cplusplus)
#define let auto const
#else
#define let const __auto_type
#endif

#if defined(__cplusplus)
#define var auto
#else
#define var __auto_type
#endif
