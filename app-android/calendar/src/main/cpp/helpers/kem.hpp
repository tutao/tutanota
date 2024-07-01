#ifndef APP_ANDROID_KEM_HPP
#define APP_ANDROID_KEM_HPP

#include <oqs/kem.h>
#include <exception>
#include <string>

/**
 * Container for instantiating and managing a KEM pointer.
 *
 * The pointer is automatically freed when it goes out of scope.
 */
class KEM {
    NON_COPYABLE
public:
    /**
     * Instantiate a KEM pointer.
     * @param methodName method name to use
     * @throws KEMInitializeException if OQS_KEM_new failed for some reason (usually due to a bad method name)
     */
    KEM(const char *methodName) : kem(OQS_KEM_new(methodName)) {
        if (this->kem == nullptr) {
            throw KEMInitializeException();
        }
    }

    OQS_KEM *getKem() {
        return this->kem;
    }

    ~KEM() {
        OQS_KEM_free(this->kem);
    }

    class KEMInitializeException : public std::exception {
    public:
        const char *what() const noexcept override {
            return "KEM initialize failure";
        }
    };

    operator OQS_KEM *() noexcept {
        return this->getKem();
    }

private:
    OQS_KEM *kem;
};

#endif
