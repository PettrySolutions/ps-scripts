/**
 * Error result type following Go-style error handling
 * Success returns [data, null]
 * Failure returns [null, error]
 */
export type ErrorResult<T> = [T, null] | [null, Error];