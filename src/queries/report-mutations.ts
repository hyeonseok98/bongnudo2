import { mutationOptions } from "@tanstack/react-query";

import { postReport } from "@/apis/reports/create-report";

export const reportMutations = {
  create: () =>
    mutationOptions({
      mutationFn: postReport,
    }),
};
