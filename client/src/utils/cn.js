import { clsx } from 'clsx'

/**
 * Utility function for combining class names
 * @param {...any} classes - Class names to combine
 * @returns {string} Combined class names
 */
export function cn(...classes) {
  return clsx(classes)
}