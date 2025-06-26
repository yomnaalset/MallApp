 # Return Functionality Implementation

## Overview
This document describes the return functionality implemented for delivered orders in the e-commerce mall application.

## Features Implemented

### 1. Return Button for Delivered Orders
- **Location**: Next to the ACTIONS button in the customer's orders page
- **Visibility**: Only shows for orders with status "DELIVERED"
- **Conditions**: 
  - Order must be delivered
  - Return period must not be expired (within 48 hours)
  - Order must not already have an existing return request

### 2. Return Request Process
- **Dialog Form**: Opens when the Return button is clicked
- **Required Information**: 
  - Reason for return (minimum 10 characters)
- **48-Hour Notice**: Form displays a notice about the 48-hour return period limit
- **Validation**: Backend validates that the return request is within the 48-hour window

### 3. Post-Return Behavior
- **Order Removal**: After successful return request submission, the order is removed from the customer's orders page
- **Notification**: 
  - Success toast notification: "Return request has been sent to the delivery manager. You will be notified once reviewed."
  - Additional success message showing the order has been processed and removed
- **UI Feedback**: Page shows a success message with option to continue shopping

### 4. Return Period Restrictions
- **Time Limit**: 48 hours from delivery time
- **Backend Validation**: Server-side validation ensures return requests are only accepted within the valid timeframe
- **Frontend Feedback**: Shows "Return period expired (48 hours)" message if the time limit has passed

### 5. Return Status Indicators
- **Already Returned**: Shows "Return request already submitted" if a return was already 
@ 
- **Period Expired**: Shows "Return period expired (48 hours)" for orders outside the return window
- **Eligible**: Shows the "Return Order" button for valid orders

## Technical Implementation

### Frontend Components
1. **OrderReturnButton** (`/components/order/OrderReturnButton.jsx`)
   - Handles return button display logic
   - Manages eligibility checks
   - Opens return form dialog

2. **ReturnOrderForm** (`/components/order/ReturnOrderForm.jsx`)
   - Modal form for return request submission
   - Includes 48-hour notice
   - Handles form validation and submission

3. **Orders Page** (`/app/(store)/orders/page.jsx`)
   - Integrates return button
   - Handles post-return UI updates
   - Shows success messages

### Backend Integration
- **API Endpoint**: `POST /api/delivery/customer/returns/`
- **Validation**: 48-hour return window validation
- **Data**: Stores return reason and timestamps

## User Experience Flow
1. Customer views delivered order in orders page
2. Sees "Return Order" button next to actions
3. Clicks button to open return form
4. Reads 48-hour notice and enters return reason
5. Submits return request
6. Receives confirmation notification
7. Order is removed from orders page
8. Success message displayed with shopping link

## Notes
- Return requests are sent to delivery managers for review
- The 48-hour limit is enforced both on frontend and backend
- Orders with existing returns show appropriate status messages
- Expired return periods show clear feedback to users