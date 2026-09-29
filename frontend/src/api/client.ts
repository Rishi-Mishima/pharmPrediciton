import axios, { AxiosError } from "axios";
import type { ApiErrorPayload } from "../types/api";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return "Something went wrong. Please try again.";
  }

  const axiosError = error as AxiosError<ApiErrorPayload>;
  const detail = axiosError.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const field = item.loc?.slice(1).join(".");
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .join(" ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (axiosError.code === "ERR_NETWORK") {
    return "Unable to reach the PharmaML API. Check that FastAPI is running.";
  }

  return axiosError.message;
}
