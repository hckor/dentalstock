# DentalStock Information Hierarchy Renewal

## Background

DentalStock now covers inventory, orders, surgery preparation, costs, staff management, shipping, and audit-style operations. The feature surface is broad enough that the main product risk is no longer missing functionality, but whether a busy clinic user can decide what to do first.

## Problem

Real users report that the app contains too much information at once and is not immediately clear. The current issue is information hierarchy: operational queues, analytics, shortcuts, and detailed status panels can appear together, making the first action harder to identify.

## Goal

Use three product principles as the decision framework:

1. Hick's Law: reduce first-screen choices.
2. Progressive Disclosure: show summaries first, move detail behind taps.
3. Jobs To Be Done: organize by the role's immediate work, not by internal feature names.

The target experience is:

- Owner: cost and approval risk first.
- Manager: today's operational blockers first.
- Staff: surgery preparation, quick outflow, and low-stock requests first.

This project assumes there is no separate PC product. That means mobile cannot become a compressed admin console. Any information that does not help the user finish a field task should be removed from first exposure, not merely collapsed.

## Mobile User Journey

### Owner

Primary job: decide only what needs owner judgment.

1. Open app.
2. See owner approval, cost anomaly, or risky stock only.
3. Tap the one item that needs judgment.
4. Approve, hold, or move to the relevant detail screen.

Default home should not show routine logs, normal inventory, staff details, or full analysis.

### Manager

Primary job: remove today's operational blockers.

1. Open app.
2. Process approval queue, receipt/shipping queue, or low-stock queue.
3. Finish the blocker or send it to owner review.
4. Leave deeper staff/settings work inside management.

Default home should not show long surgery lists, normal inventory, full cost analysis, or duplicate shortcut grids.

### Staff

Primary job: complete field actions quickly.

1. Open app.
2. Choose today surgery, quick outflow, or low-stock request.
3. Record the action with minimal reading.
4. Search only when looking for a specific item.

Default home should not show global approval status, full inventory stats, cost, staff management, or normal item lists.

## Implementation

The first renewal pass focuses on role home screens.

- Owner home is reduced to three decisions: approval review, cost anomaly, and risk items.
- Manager home is reduced to approval handling, receipt confirmation, and low-stock inventory.
- Manager secondary shortcuts stay compact and only surface price checking when there is work to do.
- Staff home is reduced to today's surgery, quick outflow, and order request. Duplicate surgery detail, shortcut grid, and inventory stats are removed from first exposure.
- Order/shipping keeps the primary state tabs visible, but hides zero-count hold/rejected states from the first choice set.
- Pending order review uses one decision summary instead of four metric cards; stock risk and duplicate signals appear as compact badges.
- Inventory search is first-class. Category and risk filters are hidden behind a filter control, with only active filters shown as compact chips.

## Evaluation

Use these checks before adding more home content:

- Can the user identify the first action within 5 seconds?
- Are there no more than three primary actions on the first role-specific queue?
- Is detailed evidence shown only after tapping into a destination screen?
- Does each card map to a role-specific job rather than a feature bucket?
- Are normal states visually quiet and problem states visually explicit?

Mission tests:

- Staff can find today's surgery task in 5 seconds.
- Staff can open quick outflow in 5 seconds.
- Staff can request low-stock ordering without reading a long list.
- Manager can identify the next approval item in 5 seconds.
- Manager can find receipt/shipping work without scanning unrelated tabs.
- Owner can find owner-review orders without seeing routine operations first.

## Contribution

This renewal converts the home screen from a broad dashboard into a role-based work queue. It gives future design and development work a repeatable standard: first screen for decisions and actions, detail screens for evidence and logs.
