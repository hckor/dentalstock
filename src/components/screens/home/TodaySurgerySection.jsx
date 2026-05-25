import { SecTitle } from "../../shared/SecTitle";
import { TodaySurgeryCard } from "./TodaySurgeryCard";
import { pagePad } from "./homeStyles";

export function TodaySurgerySection({ title = "오늘 수술 준비", anchorId, dashboard, items, canManageSurgery, canConfirmSurgery, confirmSurgeryPrep, confirmSurgeryUsage, openItemsEditor, updateSurgeryItems }) {
  if (dashboard.surgery.today.length === 0) return null;

  return (
    <div id={anchorId} style={pagePad}>
      <SecTitle>{title}</SecTitle>
      {dashboard.surgery.today.map(surgery => (
        <TodaySurgeryCard
          key={surgery.id}
          surgery={surgery}
          items={items}
          confirmSurgeryPrep={confirmSurgeryPrep}
          confirmSurgeryUsage={confirmSurgeryUsage}
          openItemsEditor={openItemsEditor}
          updateSurgeryItems={updateSurgeryItems}
          canManage={canManageSurgery}
          canConfirm={canConfirmSurgery}
          canEditItems={canManageSurgery || canConfirmSurgery}
        />
      ))}
    </div>
  );
}
