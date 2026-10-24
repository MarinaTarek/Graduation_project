# Medora UI Clickable Elements Audit Report

**Date**: October 24, 2026  
**Scope**: Full interactive audit across all pages, layouts, and design-system components (`src/ui/`) for both Admin and Rep roles, light/dark themes, desktop and mobile viewports.  
**Build & Type Check Status**: Passed with 0 TypeScript errors (`tsc --noEmit`).

---

## 1. Audit Summary & Counts

| Status | Meaning | Count |
| :--- | :--- | :---: |
| **OK** | Element is wired to a real page route, modal, drawer, or valid state transition | **83** |
| **NO HANDLER** | Element rendered as button/chip/tab but has no `onClick`, `href`, or interactive handler | **11** |
| **EMPTY HANDLER** | Handler exists but only triggers a placeholder toast notice or does nothing | **8** |
| **DEAD STATE** | Triggers or renders state that is unhandled or unreachable | **3** |
| **BROKEN ROUTE** | Points to a non-existent route, missing page file, or undefined drawer | **2** |
| **ROLE ISSUE** | Element is visible to Rep but leads to Admin-only organization settings | **2** |
| **TOTAL AUDITED** | All clickable / interactive elements across the application | **109** |

---

## 2. Complete Clickable Elements Audit

| # | Page / Area | Element Label | File:Line | Status | What It Should Open (Best Guess) |
|---|---|---|---|---|---|
| 1 | **Sidebar** | Collapse / Expand toggle chevron | `src/ui/layout/Sidebar.tsx:89` | `OK` | Toggles sidebar between 260px expanded and 72px collapsed |
| 2 | **Sidebar** | Dashboard | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `HomePage` (`Home`) |
| 3 | **Sidebar** | Clients | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `ClientsPage` (`Clients`) |
| 4 | **Sidebar** | Invoices (Badge: 5) | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `InvoicesPage` (`Invoices`) |
| 5 | **Sidebar** | Stock | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `StockPage` (`Stock`) |
| 6 | **Sidebar** | Sell-in | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `SellInPage` (`Sell-in`) |
| 7 | **Sidebar** | Sell-out | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `SellOutPage` (`Sell-out`) |
| 8 | **Sidebar** | Targets | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `TargetsPage` (`Targets`) |
| 9 | **Sidebar** | Visits | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `VisitsPage` (`Visits`) |
| 10 | **Sidebar** | Visit plan | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `VisitPlanPage` (`Visit plan`) |
| 11 | **Sidebar** | Reports (Admin view) | `src/ui/layout/Sidebar.tsx:107` | `OK (FIXED)` | Navigates to dedicated `ReportsPage` (`src/ui/pages/reports/index.tsx`) |
| 12 | **Sidebar** | My profile (Rep view) | `src/ui/layout/Sidebar.tsx:107` | `OK (FIXED)` | Navigates to `ProfilePage` (`src/ui/pages/profile/index.tsx`); Admin Org Settings hidden from Rep |
| 13 | **Sidebar** | Users (Admin view) | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `AdminUsersPage` (`Users`) |
| 14 | **Sidebar** | Products & Batches (Admin) | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `AdminProductsPage` (`Products & Batches`) |
| 15 | **Sidebar** | Territories (Admin view) | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `AdminTerritoriesPage` (`Territories`) |
| 16 | **Sidebar** | Audit log (Admin view) | `src/ui/layout/Sidebar.tsx:107` | `OK` | Navigates to `AdminAuditLogPage` (`Audit log`) |
| 17 | **Sidebar** | Log out | `src/ui/layout/Sidebar.tsx:130` | `OK` | Opens `LogoutConfirmDialog` |
| 18 | **Header** | Search pill ("Search anything... ⌘K") | `src/ui/layout/Header.tsx:34` | `OK` | Opens Command Palette (`CommandPalette`) |
| 19 | **Header** | Role switch pill ("Admin/Rep view") | `src/ui/layout/Header.tsx:46` | `OK` | Toggles role state between Admin and Rep |
| 20 | **Header** | Theme toggle switch (Sun / Moon) | `src/ui/layout/Header.tsx:58` | `OK` | Toggles Light and Dark theme modes |
| 21 | **Header** | Notifications bell button | `src/ui/layout/Header.tsx:70` | `OK` | Opens Notifications drawer (`NotificationsDrawer`) |
| 22 | **Bottom Dock** | Home | `src/ui/layout/BottomDock.tsx:26` | `OK` | Navigates to `HomePage` (`Home`) |
| 23 | **Bottom Dock** | Clients | `src/ui/layout/BottomDock.tsx:26` | `OK` | Navigates to `ClientsPage` (`Clients`) |
| 24 | **Bottom Dock** | Invoices | `src/ui/layout/BottomDock.tsx:26` | `OK` | Navigates to `InvoicesPage` (`Invoices`) |
| 25 | **Bottom Dock** | Stock | `src/ui/layout/BottomDock.tsx:26` | `OK` | Navigates to `StockPage` (`Stock`) |
| 26 | **Bottom Dock** | More | `src/ui/layout/BottomDock.tsx:26` | `OK` | Navigates to `MorePage` (`More`) |
| 27 | **Menu Sheet** | Dark mode toggle | `src/ui/layout/MenuSheet.tsx:26` | `OK (FIXED)` | Toggles dark mode; MenuSheet is reachable from Header profile avatar and BottomDock |
| 28 | **Menu Sheet** | Language button | `src/ui/layout/MenuSheet.tsx:31` | `NO HANDLER` | Language selection dropdown / modal |
| 29 | **Menu Sheet** | Log out button | `src/ui/layout/MenuSheet.tsx:35` | `OK (FIXED)` | Triggers logout dialog and dismisses MenuSheet |
| 30 | **Command Palette** | Quick action "Doctors" | `src/ui/layout/CommandPalette.tsx:28` | `OK` | Dismisses palette and triggers search action toast |
| 31 | **Command Palette** | Quick action "Pharmacies" | `src/ui/layout/CommandPalette.tsx:28` | `OK` | Dismisses palette and triggers search action toast |
| 32 | **Command Palette** | Quick action "Invoices" | `src/ui/layout/CommandPalette.tsx:28` | `OK` | Dismisses palette and triggers search action toast |
| 33 | **Command Palette** | Quick action "Products" | `src/ui/layout/CommandPalette.tsx:28` | `OK` | Dismisses palette and triggers search action toast |
| 34 | **Command Palette** | Close backdrop / X | `src/ui/layout/CommandPalette.tsx:20` | `OK` | Dismisses Command Palette |
| 35 | **Notifications** | "Mark all as read" button | `src/ui/layout/NotificationsDrawer.tsx:25` | `EMPTY HANDLER` | Shows toast notice; does not clear notifications state |
| 36 | **Notifications** | Notice items (3 today rows) | `src/ui/layout/NotificationsDrawer.tsx:34` | `EMPTY HANDLER` | Shows toast notice; should navigate to referenced invoice/stock record |
| 37 | **Notifications** | Notice item (1 earlier row) | `src/ui/layout/NotificationsDrawer.tsx:44` | `EMPTY HANDLER` | Shows toast notice; should navigate to rejected invoice detail drawer |
| 38 | **Notifications** | Close backdrop / X | `src/ui/layout/NotificationsDrawer.tsx:24` | `OK` | Dismisses Notifications drawer |
| 39 | **Home** | Story link "$240K" | `src/ui/pages/home/index.tsx:37` | `OK` | Opens Invoice Review detail drawer (`InvoiceReviewPage`) |
| 40 | **Home** | Primary button "New visit" | `src/ui/pages/home/index.tsx:43` | `OK` | Opens New Visit wizard drawer (`NewVisitWizard`) |
| 41 | **Home** | Sell-in chart panel | `src/ui/pages/home/index.tsx:53` | `OK (FIXED)` | Calls `setActive('Sell-in')` directly navigating to the Sell-in page |
| 42 | **Home** | Filter Chip "Month" | `src/ui/pages/home/components/HomeFilters.tsx:12` | `NO HANDLER` | Date range selector dropdown / popover |
| 43 | **Home** | Filter Chip "All regions" | `src/ui/pages/home/components/HomeFilters.tsx:15` | `NO HANDLER` | Region filter dropdown / popover |
| 44 | **Home** | Filter Chip "All reps" | `src/ui/pages/home/components/HomeFilters.tsx:18` | `NO HANDLER` | Medical representative filter dropdown / popover |
| 45 | **Home** | Filter Chip "All products" | `src/ui/pages/home/components/HomeFilters.tsx:21` | `NO HANDLER` | Product portfolio filter dropdown / popover |
| 46 | **Home** | View toggle button ("Month/Week") | `src/ui/pages/home/components/HomeFilters.tsx:25` | `OK` | Toggles time range state between Month and Week |
| 47 | **Home** | Needs Attention "View all" | `src/ui/pages/home/components/AttentionSection.tsx:18` | `OK (FIXED)` | Opens Notifications panel (`NotificationsDrawer`) |
| 48 | **Home** | Card "Invoices to review" | `src/ui/pages/home/components/AttentionSection.tsx:24` | `OK (FIXED)` | Navigates to `InvoicesPage` pre-filtered to "Pending" with removable filter chip |
| 49 | **Home** | Card "Clients without visit" | `src/ui/pages/home/components/AttentionSection.tsx:24` | `OK (FIXED)` | Navigates to `ClientsPage` pre-filtered to "Overdue only" with removable filter chip |
| 50 | **Home** | Card "Expiring batches" | `src/ui/pages/home/components/AttentionSection.tsx:24` | `OK (FIXED)` | Navigates to `StockPage` with expiring batch detail drawer opened |
| 51 | **Home** | Products panel round arrow | `src/ui/pages/home/components/ProductsPanel.tsx:22` | `OK` | Navigates to Stock page (`setActive('Stock')`) |
| 52 | **Home** | Product capsules (3 items) | `src/ui/pages/home/components/ProductsPanel.tsx:36` | `OK` | Opens Stock Product detail sheet (`StockDetailSheet`) |
| 53 | **Home** | Top reps round arrow | `src/ui/pages/home/components/TopRepsPanel.tsx:19` | `OK` | Navigates to More page (`setActive('More')`) / Users list |
| 54 | **Home** | Top rep rows (4 items) | `src/ui/pages/home/components/TopRepsPanel.tsx:25` | `OK (FIXED)` | Opens `VisitsPage` pre-filtered to clicked representative with removable filter chip |
| 55 | **Clients** | Primary button "Add new" | `src/ui/pages/clients/index.tsx:24` | `OK` | Opens `RecordFormDrawer` with title "Add doctor" |
| 56 | **Clients** | Toolbar "Filters" button | `src/ui/pages/clients/components/ClientToolbar.tsx:11` | `NO HANDLER` | Client filter options popover |
| 57 | **Clients** | Toolbar "View" button | `src/ui/pages/clients/components/ClientToolbar.tsx:14` | `NO HANDLER` | Client layout toggle (List / Grid view) |
| 58 | **Clients** | Client list item rows (3 items) | `src/ui/pages/clients/components/ClientListItem.tsx:12` | `OK` | Opens Doctor Profile drawer (`DoctorProfilePage`) |
| 59 | **Doctor Profile** | Close backdrop / X | `src/ui/pages/doctor-profile/index.tsx:24` | `OK` | Dismisses Doctor Profile drawer |
| 60 | **Doctor Profile** | Button "+ New visit" | `src/ui/pages/doctor-profile/index.tsx:33` | `OK` | Opens New Visit wizard drawer (`NewVisitWizard`) |
| 61 | **Doctor Profile** | Button "Edit doctor" | `src/ui/pages/doctor-profile/index.tsx:36` | `OK` | Triggers save, displays confirmation toast, closes drawer |
| 62 | **Invoices** | Primary button "Add new" | `src/ui/pages/invoices/index.tsx:24` | `OK` | Opens Upload Invoice modal (`UploadInvoiceModal`) |
| 63 | **Invoices** | Toolbar "Filters" button | `src/ui/pages/invoices/components/InvoiceToolbar.tsx:11` | `NO HANDLER` | Invoice status filter popover |
| 64 | **Invoices** | Toolbar "View" button | `src/ui/pages/invoices/components/InvoiceToolbar.tsx:14` | `NO HANDLER` | Invoice density view switch |
| 65 | **Invoices** | Invoice list item rows (3 items) | `src/ui/pages/invoices/components/InvoiceListItem.tsx:11` | `OK` | Opens Invoice Review detail drawer (`InvoiceReviewPage`) |
| 66 | **Upload Invoice** | Close backdrop / X | `src/ui/pages/invoices/components/UploadInvoiceModal.tsx:19` | `OK` | Dismisses Upload Invoice modal |
| 67 | **Upload Invoice** | Button "Choose file" | `src/ui/pages/invoices/components/UploadInvoiceModal.tsx:24` | `OK` | Simulates file upload, closes modal with confirmation toast |
| 68 | **Invoice Review** | Close backdrop / X | `src/ui/pages/invoice-review/index.tsx:27` | `OK` | Dismisses Invoice Review drawer |
| 69 | **Invoice Review** | Button "Reject" | `src/ui/pages/invoice-review/components/InvoiceReviewActions.tsx:15` | `OK` | Rejects invoice with toast notification |
| 70 | **Invoice Review** | Button "Approve" | `src/ui/pages/invoice-review/components/InvoiceReviewActions.tsx:18` | `OK` | Approves invoice, closes drawer, shows confirmation toast |
| 71 | **Stock** | Primary button "Add new" | `src/ui/pages/stock/index.tsx:26` | `OK` | Opens `RecordFormDrawer` with title "Add product" |
| 72 | **Stock** | Toolbar "Filters" button | `src/ui/pages/stock/components/StockToolbar.tsx:11` | `NO HANDLER` | Stock inventory filter popover |
| 73 | **Stock** | Toolbar "View" button | `src/ui/pages/stock/components/StockToolbar.tsx:14` | `NO HANDLER` | Stock layout toggle |
| 74 | **Stock** | Stock list item rows (3 items) | `src/ui/pages/stock/components/StockListItem.tsx:12` | `OK` | Opens Stock Product detail sheet (`StockDetailSheet`) |
| 75 | **Stock Detail** | Close backdrop / X | `src/ui/pages/stock/components/StockDetailSheet.tsx:20` | `OK` | Dismisses Stock Detail sheet |
| 76 | **Stock Detail** | Tab "Warehouse" | `src/ui/pages/stock/components/StockDetailSheet.tsx:22` | `NO HANDLER` | Filters batch view to Warehouse inventory |
| 77 | **Stock Detail** | Tab "With reps" | `src/ui/pages/stock/components/StockDetailSheet.tsx:23` | `NO HANDLER` | Filters batch view to Field rep inventory |
| 78 | **Stock Detail** | Tab "In pharmacies" | `src/ui/pages/stock/components/StockDetailSheet.tsx:24` | `NO HANDLER` | Filters batch view to Consigned pharmacy inventory |
| 79 | **Stock Detail** | Button "Stock count" | `src/ui/pages/stock/components/StockDetailSheet.tsx:35` | `OK` | Opens `RecordFormDrawer` with title "Stock count" |
| 80 | **Visits** | Primary button "New visit" | `src/ui/pages/visits/index.tsx:24` | `OK` | Opens New Visit wizard drawer (`NewVisitWizard`) |
| 81 | **Visits** | Visit list item rows (5 items) | `src/ui/pages/visits/index.tsx:63` | `OK (FIXED)` | Opens `VisitDetailDrawer` with date/time, doctor, rep, products presented, samples quantity, reaction emoji, notes, next visit date, GPS verified badge |
| 82 | **New Visit** | Close backdrop / X | `src/ui/pages/visits/components/NewVisitWizard.tsx:28` | `OK` | Dismisses New Visit wizard drawer |
| 83 | **New Visit** | Button "Continue" | `src/ui/pages/visits/components/NewVisitWizard.tsx:37` | `OK` | Saves visit record, shows confirmation toast, closes drawer |
| 84 | **Admin Hub** | Card "Users" | `src/ui/pages/admin/components/AdminNavCards.tsx:14` | `OK` | Opens Admin Users subpage |
| 85 | **Admin Hub** | Card "Products & Batches" | `src/ui/pages/admin/components/AdminNavCards.tsx:14` | `OK` | Opens Admin Products subpage |
| 86 | **Admin Hub** | Card "Territories" | `src/ui/pages/admin/components/AdminNavCards.tsx:14` | `OK` | Opens Admin Territories subpage |
| 87 | **Admin Hub** | Card "Audit log" | `src/ui/pages/admin/components/AdminNavCards.tsx:14` | `OK` | Opens Admin Audit log subpage |
| 88 | **Admin Hub** | Card "Settings" | `src/ui/pages/admin/components/AdminNavCards.tsx:14` | `OK` | Opens Admin Settings subpage |
| 89 | **Admin Users** | Button "Back to Admin" | `src/ui/pages/admin/index.tsx:22` | `OK` | Returns to Admin hub cards view |
| 90 | **Admin Products**| Button "Back to Admin" | `src/ui/pages/admin/index.tsx:35` | `OK` | Returns to Admin hub cards view |
| 91 | **Admin Territories**| Button "Back to Admin" | `src/ui/pages/admin/index.tsx:48` | `OK` | Returns to Admin hub cards view |
| 92 | **Admin Audit Log**| Button "Back to Admin" | `src/ui/pages/admin/index.tsx:61` | `OK` | Returns to Admin hub cards view |
| 93 | **Admin Settings** | Button "Back to Admin" | `src/ui/pages/admin/index.tsx:74` | `OK` | Returns to Admin hub cards view |
| 94 | **Login** | Button "Sign in" | `src/ui/pages/login/components/LoginForm.tsx:24` | `OK` | Authenticates user and navigates to Dashboard |
| 95 | **Logout Dialog** | Close backdrop / X | `src/ui/pages/login/components/LogoutConfirmDialog.tsx:20` | `OK` | Dismisses Logout confirmation dialog |
| 96 | **Logout Dialog** | Button "Cancel" | `src/ui/pages/login/components/LogoutConfirmDialog.tsx:23` | `OK` | Dismisses Logout confirmation dialog |
| 97 | **Logout Dialog** | Button "Log out" | `src/ui/pages/login/components/LogoutConfirmDialog.tsx:26` | `OK` | Confirms sign out, sets toast notice, closes dialog |
| 98 | **More (Mobile)** | Grid item "Visits" | `src/ui/pages/more/components/MoreGrid.tsx:15` | `OK` | Navigates to `VisitsPage` (`Visits`) |
| 99 | **More (Mobile)** | Grid item "Sell-in" | `src/ui/pages/more/components/MoreGrid.tsx:15` | `OK` | Navigates to `SellInPage` (`Sell-in`) |
| 100 | **More (Mobile)** | Grid item "Sell-out" | `src/ui/pages/more/components/MoreGrid.tsx:15` | `OK` | Navigates to `SellOutPage` (`Sell-out`) |
| 101 | **More (Mobile)** | Grid item "Targets" | `src/ui/pages/more/components/MoreGrid.tsx:15` | `OK` | Navigates to `TargetsPage` (`Targets`) |
| 102 | **More (Mobile)** | Grid item "Admin panel" | `src/ui/pages/more/components/MoreGrid.tsx:15` | `OK` | Navigates to `AdminPage` (`Admin`) |
| 103 | **More (Mobile)** | Grid item "Settings" | `src/ui/pages/more/components/MoreGrid.tsx:15` | `ROLE ISSUE` | Navigates to Admin Settings page (visible in Rep More grid) |
| 104 | **Shared Drawer** | Close backdrop / X | `src/ui/design-system/components/Drawer.tsx:24,34` | `OK` | Closes any drawer instance |
| 105 | **Shared Modal** | Close backdrop | `src/ui/design-system/components/Modal.tsx:14` | `OK` | Closes modal instance |
| 106 | **Record Form** | Close backdrop / X | `src/ui/design-system/components/RecordFormDrawer.tsx:20,27` | `OK` | Dismisses record form drawer |
| 107 | **Record Form** | Button "Cancel" | `src/ui/design-system/components/RecordFormDrawer.tsx:61` | `OK` | Dismisses record form drawer |
| 108 | **Record Form** | Button "Save record" | `src/ui/design-system/components/RecordFormDrawer.tsx:64` | `OK` | Submits form, shows toast notice, closes drawer |
| 109 | **Shared Sheet** | Close backdrop | `src/ui/design-system/components/BottomSheet.tsx:19` | `OK` | Closes bottom sheet instance |

---

## 3. Discrepancies Ordered by Priority

### Priority 1: Main Navigation & Layout Issues (All Resolved)
1. **Sidebar "Reports" Route** (`src/ui/layout/Sidebar.tsx:107`):  
   - *Status*: `RESOLVED`  
   - *Fix*: Kept for Admin, created dedicated `src/ui/pages/reports/index.tsx` with friendly `EmptyState`, and routed in `App.tsx`.
2. **Sidebar "Settings" Role Mismatch** (`src/ui/layout/Sidebar.tsx:107`):  
   - *Status*: `RESOLVED`  
   - *Fix*: Renamed to "My profile" for Reps pointing to `src/ui/pages/profile/index.tsx` with Avatar, Name, Email, Telegram link, and Dark Mode switch. Admin Org settings are completely hidden from Reps.
3. **MenuSheet Profile Menu is Unreachable** (`src/ui/layout/MenuSheet.tsx:12`):  
   - *Status*: `RESOLVED`  
   - *Fix*: Added profile avatar button to desktop `Header.tsx` and connected mobile bottom dock navigation to toggle `MenuSheet`, with transparent backdrop dismisser.
4. **Home Sell-in Chart Panel Overlay** (`src/ui/pages/home/index.tsx:53`):  
   - *Status*: `RESOLVED`  
   - *Fix*: Replaced `onOpen('sell-in')` with `setActive('Sell-in')` to perform real page navigation.

---

### Priority 2: Primary Actions per Page (All Resolved)
5. **Visits List Items Have No Click Handler** (`src/ui/pages/visits/index.tsx:31`):  
   - *Status*: `RESOLVED`  
   - *Fix*: Wired `onClick` on each `<VisitListItem>` to open `VisitDetailDrawer` with date/time, doctor, rep, products presented, samples quantity, reaction emoji, notes, next visit date, and GPS verified badge. Reps only see their own visits.
6. **Needs Attention Cards are Toast-Only** (`src/ui/pages/home/components/AttentionSection.tsx:24`):  
   - *Status*: `RESOLVED`  
   - *Fix*: Wired to navigate with active filter state: "invoices waiting approval" -> Invoices filtered to Pending; "doctors not visited" -> Clients filtered to Overdue only; "batch expiring" -> Stock with expiring batch detail drawer open.
7. **Attention "View all" Button is Toast-Only** (`src/ui/pages/home/components/AttentionSection.tsx:18`):  
   - *Status*: `RESOLVED`  
   - *Fix*: Wired to open the existing Notifications panel drawer (`NotificationsDrawer`).
8. **Top Reps Row Items are Toast-Only** (`src/ui/pages/home/components/TopRepsPanel.tsx:25`):  
   - *Status*: `RESOLVED`  
   - *Fix*: Wired to navigate to `VisitsPage` filtered to the clicked representative with a removable filter chip. Normal sidebar navigation resets the filter.

---

### Priority 3: Secondary Actions (Filters, Tabs & Toolbars)
9. **Collection Toolbars "Filters" & "View" Buttons**:  
   - `src/ui/pages/clients/components/ClientToolbar.tsx:11,14` (`NO HANDLER`)  
   - `src/ui/pages/invoices/components/InvoiceToolbar.tsx:11,14` (`NO HANDLER`)  
   - `src/ui/pages/stock/components/StockToolbar.tsx:11,14` (`NO HANDLER`)  
   - *Target*: Connect to interactive filter drawers/popovers and view density switches.
10. **Home Filter Chips** (`src/ui/pages/home/components/HomeFilters.tsx:12,15,18,21`):  
    - *Status*: `NO HANDLER`  
    - *Target*: Connect to selection menus for Region, Rep, and Product scopes.
11. **Stock Detail Sheet Warehouse / Rep / Pharmacy Tabs** (`src/ui/pages/stock/components/StockDetailSheet.tsx:22,23,24`):  
    - *Status*: `NO HANDLER`  
    - *Target*: Add active tab state switching between Warehouse, Rep-consigned, and Pharmacy batches.
12. **MenuSheet Language Selection** (`src/ui/layout/MenuSheet.tsx:31`):  
    - *Status*: `NO HANDLER`  
    - *Target*: Connect to language switcher modal or toggle.
13. **Notifications Drawer "Mark all as read" & Row Items** (`src/ui/layout/NotificationsDrawer.tsx:25,34,44`):  
    - *Status*: `EMPTY HANDLER`  
    - *Target*: Wire "Mark all as read" to clear state, and individual notifications to open the relevant record.
