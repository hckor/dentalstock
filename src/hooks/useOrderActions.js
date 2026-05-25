import { useMemo } from "react";
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
  const submissionActions = useOrderSubmissionActions(deps);
  const approvalActions = useOrderApprovalActions(deps);
  const receiptActions = useOrderReceiptActions(deps);
  const trackingActions = useOrderTrackingActions({
    ...deps,
    repositoryAdapter,
    trackingClient,
  });

  return useMemo(() => ({
    ...submissionActions,
    ...approvalActions,
    ...receiptActions,
    ...trackingActions,
  }), [approvalActions, receiptActions, submissionActions, trackingActions]);
}
