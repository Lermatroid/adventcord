import { createFetch } from "@better-fetch/fetch";

export const fetcher = createFetch({
  retry: {
    type: "linear",
    attempts: 3,
    delay: 1000,
  },
  timeout: 30000,
});
