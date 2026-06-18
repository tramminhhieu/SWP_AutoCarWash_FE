/**
 * Generic envelope returned by every endpoint of the AutoCarWash backend.
 *
 * The backend always wraps its payload in this shape, e.g.:
 * ```json
 * { "success": true, "message": "OK", "data": [...] }
 * ```
 *
 * @typeParam T - Shape of the actual payload carried in `data`.
 */
export interface ApiResponse<T> {
  /** Whether the request was handled successfully by the backend. */
  success: boolean;
  /** Human-readable message describing the result (often in Vietnamese). */
  message: string;
  /** The actual payload — a list, a single object, etc., depending on the endpoint. */
  data: T;
}
