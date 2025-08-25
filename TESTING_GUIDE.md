# Sales & Invoice Management - Frontend Testing Guide

## Prerequisites
- Both backend (port 8000) and frontend (port 3000) servers are running
- Test user account: `test@example.com` / `testpass123`
- Test tenant: "Test Company" is already created

## Testing Workflow Overview
```
1. Login → 2. Dashboard → 3. Sales Orders → 4. Invoices → 5. Payments
```

---

## 1. 🔐 Login & Authentication Testing

### Step 1.1: Access Application
1. Open browser and go to: `http://localhost:3000`
2. Should redirect to login page automatically

### Step 1.2: Test Login
1. **Email**: `test@example.com`
2. **Password**: `testpass123`
3. Click "Sign In"
4. **Expected**: Redirects to Dashboard with welcome message

### Step 1.3: Verify Authentication
- Should see user name "Test" in top navigation
- Should see "Test Company" organization info
- Should see logout option in user menu

---

## 2. 📊 Dashboard Testing

### Step 2.1: Verify Dashboard Stats
Check the statistics cards show:
- **Products**: Should show count of products
- **Customers**: Should show customer count  
- **Sales Orders**: Should show order count
- **Revenue**: Should show revenue amount in PKR

### Step 2.2: Verify Organization Info
In the bottom section, verify:
- **Organization Details**: Shows "Test Company"
- **Settings**: Shows currency as "PKR"
- **Quick Actions**: Shows invitation and other action buttons

---

## 3. 🛒 Sales Orders Testing

### Step 3.1: Navigate to Sales Orders
1. Click "Sales Orders" in left navigation
2. Should see sales orders list page
3. Should see "Create Sales Order" button

### Step 3.2: Create New Sales Order
1. Click "Create Sales Order" button
2. Fill out the form:
   - **Customer**: Select "ABC Corporation" from dropdown
   - **Reference**: Enter "PO-TEST-001"
   - **Order Date**: Use today's date
   - **Expected Delivery**: Select a future date (optional)
   - **Priority**: Select "Normal"

### Step 3.3: Add Order Items
1. **First Item**:
   - Product: Select "Laptop"
   - Quantity: Enter "1"
   - Unit Price: Should auto-fill to "45000.00"
   - Discount %: Leave as "0"

2. Click "Add Item" button

3. **Second Item**:
   - Product: Select "Mouse"  
   - Quantity: Enter "2"
   - Unit Price: Should auto-fill to "1500.00"
   - Discount %: Enter "10"

### Step 3.4: Verify Calculations
- **First Item Total**: Should show Rs. 45,000
- **Second Item Total**: Should show Rs. 2,700 (3,000 - 10% discount)
- **Order Total**: Should show Rs. 47,700

### Step 3.5: Complete Order Creation
1. Add notes: "Test order from frontend"
2. Click "Create Order"
3. **Expected**: Success message, dialog closes, order appears in list

### Step 3.6: Test Order Actions
1. Find the created order in the list
2. Click the three-dot menu (⋮) on the order row
3. Test available actions:
   - **View**: Opens order details
   - **Edit**: Opens edit dialog (test editing reference)
   - **Confirm**: Changes status to "confirmed"
   - **Create Invoice**: Generates invoice from order

### Step 3.7: Confirm the Order
1. Click "Confirm" action
2. **Expected**: Status changes to "Confirmed" with green badge
3. **Expected**: "Create Invoice" action becomes available

---

## 4. 🧾 Invoice Testing

### Step 4.1: Create Invoice from Sales Order
1. From the confirmed sales order, click "Create Invoice"
2. **Expected**: Invoice creation dialog opens with all sales order data pre-populated:
   - Customer and Sales Order fields are disabled (cannot be changed)
   - All items from sales order are shown (cannot be modified)
   - Only invoice-specific fields are editable: dates, payment terms, tax, discount
   - Message shows "Items from Sales Order (cannot be modified)"
3. Review the pre-filled data and modify dates/terms if needed
4. Click "Create Invoice" to confirm
5. **Expected**: Success message, dialog closes, invoice is created

### Step 4.2: Navigate to Invoices
1. Click "Invoices" in left navigation
2. Should see the created invoice in the list
3. Verify invoice details:
   - **Invoice Number**: Auto-generated (e.g., INV-000001)
   - **Customer**: ABC Corporation
   - **Status**: Draft
   - **Total**: Rs. 47,700
   - **Balance Due**: Rs. 47,700

### Step 4.3: Test Invoice Details
1. Click on the invoice row to view details
2. Verify:
   - All items from sales order are included
   - Amounts are calculated correctly
   - Payment status shows "Unpaid"
   - Payment progress bar shows 0%

### Step 4.4: Test Invoice Actions
1. Click the three-dot menu on invoice row
2. Available actions should include:
   - **View**: Opens invoice details
   - **Edit**: Opens edit dialog
   - **Record Payment**: Opens payment dialog
   - **Send**: Mark as sent (optional)

---

## 5. 💰 Payment Testing

### Step 5.1: Record First Payment
1. Click "Record Payment" action on the invoice
2. Fill payment form:
   - **Payment Date**: Use today's date
   - **Amount**: Enter "30000" (partial payment)
   - **Payment Method**: Select "Bank Transfer"
   - **Transaction ID**: Enter "TXN-001"
   - **Reference**: Enter "First installment"
   - **Notes**: Enter "Partial payment received"

### Step 5.2: Verify Payment Buttons
- **Full Payment Button**: Should show "Full Payment (Rs. 47,700)"
- **50% Payment Button**: Should show "50% Payment (Rs. 23,850)"
- Test clicking these buttons to verify amount auto-fill

### Step 5.3: Submit Payment
1. Set amount back to "30000"
2. Click "Record Payment"
3. **Expected**: Success message, dialog closes

### Step 5.4: Verify Payment Impact
1. Return to invoice details
2. Verify:
   - **Status**: Changed to "Partially Paid"
   - **Paid Amount**: Shows Rs. 30,000
   - **Balance Due**: Shows Rs. 17,700
   - **Payment Progress**: Bar shows ~63% filled
   - **Payment Status**: Shows "Partially Paid" in orange

### Step 5.5: Navigate to Payments
1. Click "Payments" in left navigation
2. Should see the recorded payment
3. Verify payment details:
   - **Payment Number**: Auto-generated (e.g., PAY-000001)
   - **Invoice**: Links to INV-000001
   - **Amount**: Rs. 30,000
   - **Status**: Pending
   - **Method**: Bank Transfer

### Step 5.6: Process Payment
1. Click three-dot menu on payment row
2. Click "Process" action
3. **Expected**: Status changes to "Processed"
4. **Expected**: Success confirmation message

### Step 5.7: Record Remaining Payment
1. Go back to Invoices
2. Click "Record Payment" on the same invoice
3. Click "Full Payment" button (should show Rs. 17,700)
4. Fill remaining details:
   - **Payment Method**: Select "Cash"
   - **Reference**: Enter "Final payment"
5. Submit payment

### Step 5.8: Verify Full Payment
1. Check invoice status changes to "Paid"
2. Payment progress bar shows 100%
3. Balance due shows Rs. 0.00
4. Status badge shows "Paid" in green

---

## 6. 🔄 End-to-End Workflow Testing

### Step 6.1: Create Complete Second Order
Repeat the entire workflow with different data:
1. **Sales Order**: Different customer, different products
2. **Invoice**: Generate from order
3. **Payment**: Record full payment immediately

### Step 6.2: Test Search & Filters
1. **Sales Orders**: Use search box to find orders
2. **Invoices**: Filter by status (Draft, Paid, Overdue)
3. **Payments**: Filter by payment method
4. **Date Ranges**: Test date filtering on all pages

### Step 6.3: Test Pagination
1. Create multiple orders/invoices/payments
2. Verify pagination controls work
3. Test different page sizes

---

## 7. 📱 UI/UX Testing

### Step 7.1: Responsive Design
1. Test on different screen sizes:
   - Desktop (1920x1080)
   - Tablet (768px width)
   - Mobile (375px width)
2. Verify all dialogs are responsive
3. Check table scrolling on small screens

### Step 7.2: Form Validation
1. **Required Fields**: Try submitting forms without required fields
2. **Number Validation**: Enter negative numbers, letters in number fields
3. **Date Validation**: Try invalid dates
4. **Email Validation**: Test invalid email formats

### Step 7.3: Error Handling
1. **Network Errors**: Disconnect internet, try operations
2. **Invalid Data**: Submit forms with invalid data
3. **Permission Errors**: Try operations without proper permissions

---

## 8. 🚀 Performance Testing

### Step 8.1: Loading Times
1. Measure page load times
2. Check for loading indicators
3. Verify smooth transitions between pages

### Step 8.2: Large Data Sets
1. Create 20+ sales orders
2. Test list performance
3. Check search functionality with many records

---

## 9. ✅ Final Verification Checklist

### Dashboard
- [ ] Statistics show correct counts
- [ ] Currency formatting shows "Rs." prefix
- [ ] Organization info displays correctly

### Sales Orders
- [ ] Can create orders with multiple items
- [ ] Calculations are accurate
- [ ] Can confirm orders
- [ ] Can generate invoices from orders

### Invoices
- [ ] Auto-generated from sales orders
- [ ] Payment tracking works correctly
- [ ] Status updates properly
- [ ] Balance calculations are accurate

### Payments
- [ ] Can record partial and full payments
- [ ] Payment methods work
- [ ] Processing updates invoice status
- [ ] Payment history is maintained

### General
- [ ] Navigation works smoothly
- [ ] Forms validate properly
- [ ] Success/error messages appear
- [ ] Data persists between pages
- [ ] Logout works correctly

---

## 🐛 Common Issues & Solutions

### Issue: DateTimePicker not working
**Solution**: Check browser console for errors, ensure date format is correct

### Issue: Authentication fails
**Solution**: Check network tab, verify backend is running on port 8000

### Issue: Data not loading
**Solution**: Verify tenant headers, check browser console for API errors

### Issue: Calculations wrong
**Solution**: Check decimal places, verify discount calculations

---

## 📝 Test Data Summary

### Users
- Email: `test@example.com`
- Password: `testpass123`

### Test Company Data
- Tenant: "Test Company"
- Currency: PKR
- Timezone: UTC

### Sample Products
- Laptop: Rs. 45,000
- Mouse: Rs. 1,500

### Sample Customer
- ABC Corporation
- Email: contact@abc.com
- Phone: +92-300-1234567

---

## 🎯 Success Criteria

The system passes testing if:
1. ✅ Complete order-to-payment workflow works
2. ✅ All calculations are mathematically correct
3. ✅ Status updates reflect properly across modules
4. ✅ Data persists correctly between sessions
5. ✅ UI is responsive and user-friendly
6. ✅ Error handling provides clear feedback
7. ✅ Multi-tenant isolation works (different organizations see different data)

**Happy Testing! 🚀**