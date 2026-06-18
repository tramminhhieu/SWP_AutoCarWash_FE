import axios from "axios";

/**
 * Shared axios instance for all calls to the AutoCarWash backend.
 *
 * Base URL points at the Spring Boot API (`SWP_AutoCarWash_BE`, default port 8080).
 * The backend does not require an `Authorization` header yet (its auth module is
 * still a placeholder), so no request interceptor is added here.
 */
const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosClient;
