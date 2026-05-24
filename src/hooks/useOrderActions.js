import { appRepository } from "../repositories/appRepository";
import { remoteRepository } from "../repositories/remoteRepository";
import { useOrderApprovalActions } from "./useOrderApproval";
import { useOrderReceiptActions } from "./useOrderReceipt";
import { useOrderSubmissionActions } from "./useOrderSubmission";
import { useOrderTrackingActions } from "./useOrderTracking";

export function useOrderActions({
  repositoryAdapter = appRepository.adapter,
  trackingClient = remoteRepository,
  ...deps
}) {
  return {
    ...useOrderSubmissionActions(deps),
    ...useOrderApprovalActions(deps),
    ...useOrderReceiptActions(deps),
    ...useOrderTrackingActions({
      ...deps,
      repositoryAdapter,
      trackingClient,
    }),
  };
}
