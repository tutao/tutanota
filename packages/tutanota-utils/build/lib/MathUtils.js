export function mod(n, m) {
    return ((n % m) + m) % m;
}
/**
 * Clamp value to between min and max (inclusive)
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}
