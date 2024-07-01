#ifndef APP_ANDROID_NON_COPYABLE_HPP
#define APP_ANDROID_NON_COPYABLE_HPP

/**
 * Used for making it impossible to copy an object. Useful if a class contains a pointer that must be unique but can't
 * be freed trivally.
 */
class NonCopyable {
public:
    NonCopyable() = default;

    ~NonCopyable() = default;

    NonCopyable(const NonCopyable &) = delete;

    NonCopyable &operator=(NonCopyable &) = delete;
};

/**
 * Place in a class definition to make it non-copyable.
 */
#define NON_COPYABLE [[maybe_unused]] NonCopyable _nonCopyable;

#endif
