import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import { formatCurrency } from '../utils/currency';
import { addDays } from '../utils/date';
import salesApi from '../services/sales';
import { customerApi } from '../services/customer';
import inventoryApi from '../services/inventory';
import {
  Invoice,
  InvoiceCreateUpdate,
  InvoiceItem,
  PAYMENT_TERMS_OPTIONS,
} from '../types/sales';
import { CustomerListItem } from '../types/customer';
import { ProductListItem } from '../types/inventory';
import { SalesOrderListItem } from '../types/sales';

interface InvoiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId?: number | null;
  salesOrderId?: number | null;
  onSuccess: () => void;
}

const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
  open,
  onClose,
  invoiceId,
  salesOrderId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrderListItem[]>([]);
  const [salesOrderData, setSalesOrderData] = useState<any>(null);
  const [formData, setFormData] = useState<InvoiceCreateUpdate>({
    customer: '',
    invoice_date: dayjs().toISOString(),
    due_date: dayjs().add(30, 'day').toISOString(),
    payment_terms: 'net_30',
    items: [{ product: '', quantity: 1, unit_price: 0, discount_percent: 0 }],
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const { enqueueSnackbar } = useSnackbar();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.customer) {
      newErrors.customer = 'Customer is required';
    }
    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }

    formData.items.forEach((item, index) => {
      if (!item.product) {
        newErrors[`item_${index}_product`] = 'Product is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (!item.unit_price || item.unit_price <= 0) {
        newErrors[`item_${index}_unit_price`] = 'Unit price must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchData = async () => {
    try {
      const [customersResponse, productsResponse, ordersResponse] = await Promise.all([
        customerApi.list(),
        inventoryApi.products.list(),
        salesApi.orders.list({ status: 'confirmed' }),
      ]);
      setCustomers(customersResponse.data.results);
      setProducts(productsResponse.data.results);
      setSalesOrders(ordersResponse.data.results);
    } catch (error) {
      enqueueSnackbar('Failed to load form data', { variant: 'error' });
      console.error('Error fetching form data:', error);
    }
  };

  const fetchInvoice = async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      const response = await salesApi.invoices.get(invoiceId);
      const invoice = response.data;

      setFormData({
        sales_order: invoice.sales_order || undefined,
        customer: invoice.customer,
        reference: invoice.reference || '',
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        payment_terms: invoice.payment_terms,
        tax_amount: invoice.tax_amount || 0,
        discount_amount: invoice.discount_amount || 0,
        paid_amount: invoice.paid_amount || 0,
        notes: invoice.notes || '',
        terms_conditions: invoice.terms_conditions || '',
        items: invoice.items.map(item => ({
          product: item.product,
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          discount_percent: parseFloat((item.discount_percent || 0).toString()),
          notes: item.notes || '',
        })),
      });
    } catch (error) {
      enqueueSnackbar('Failed to load invoice', { variant: 'error' });
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesOrder = async () => {
    if (!salesOrderId) return;

    try {
      setLoading(true);
      console.log('Fetching sales order with ID:', salesOrderId);
      const response = await salesApi.orders.get(salesOrderId);
      const order = response.data;
      console.log('Sales order data received:', order);
      
      // Store the complete sales order data for display
      setSalesOrderData(order);

      // Pre-populate form with sales order data
      setFormData({
        sales_order: order.id,
        customer: order.customer,
        reference: order.reference || '',
        invoice_date: dayjs().toISOString(),
        due_date: dayjs().add(30, 'day').toISOString(),
        payment_terms: 'net_30',
        tax_amount: order.tax_amount || 0,
        discount_amount: order.discount_amount || 0,
        notes: order.notes || '',
        terms_conditions: '',
        items: order.items.map(item => ({
          product: item.product,
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          discount_percent: parseFloat((item.discount_percent || 0).toString()),
          notes: item.notes || '',
        })),
      });
      console.log('Form data set with sales order data');
    } catch (error) {
      enqueueSnackbar('Failed to load sales order', { variant: 'error' });
      console.error('Error fetching sales order:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
      if (invoiceId) {
        fetchInvoice();
      } else if (salesOrderId) {
        console.log('Invoice dialog opened with salesOrderId:', salesOrderId);
        fetchSalesOrder();
      } else {
        // Reset form for new invoice
        setSalesOrderData(null);
        setFormData({
          customer: '',
          invoice_date: dayjs().toISOString(),
          due_date: dayjs().add(30, 'day').toISOString(),
          payment_terms: 'net_30',
          items: [{ product: '', quantity: 1, unit_price: 0, discount_percent: 0 }],
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoiceId, salesOrderId]);

  const handleInputChange = (field: keyof InvoiceCreateUpdate, value: any) => {
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-adjust due date when payment terms change
    if (field === 'payment_terms' && value !== 'immediate') {
      const days = parseInt(value.replace('net_', ''));
      if (!isNaN(days)) {
        setFormData(prev => ({
          ...prev,
          due_date: addDays(prev.invoice_date, days),
        }));
      }
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    // Clear error for this item field when user starts typing
    const errorKey = `item_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-fill unit price when product is selected
          if (field === 'product' && value) {
            const product = products.find(p => p.id === value);
            if (product) {
              updatedItem.unit_price = parseFloat(product.selling_price);
            }
          }
          
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product: '', quantity: 1, unit_price: 0, discount_percent: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const calculateItemTotal = (item: InvoiceItem): number => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_percent || 0) / 100;
    return subtotal - discount;
  };

  const calculateInvoiceTotal = (): number => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const taxAmount = formData.tax_amount || 0;
    const discountAmount = formData.discount_amount || 0;
    return itemsTotal + taxAmount - discountAmount;
  };

  const handleDownloadPDF = async () => {
    try {
      if (!invoiceId) {
        enqueueSnackbar('Unable to download PDF - invoice not saved', { variant: 'error' });
        return;
      }

      // Create PDF download URL
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('auth_token');
      const tenantId = localStorage.getItem('current_tenant_id');
      
      // Download PDF from backend
      const response = await fetch(`${apiUrl}/api/sales/invoices/${invoiceId}/download_pdf/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      // Get the PDF blob and create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link for download
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      enqueueSnackbar('PDF downloaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      enqueueSnackbar('Failed to download PDF', { variant: 'error' });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setLoading(false);
      enqueueSnackbar('Please fix the highlighted errors', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);

      if (invoiceId) {
        await salesApi.invoices.update(invoiceId, formData);
        enqueueSnackbar('✅ Invoice updated successfully!', { variant: 'success' });
      } else {
        const response = await salesApi.invoices.create(formData);
        enqueueSnackbar('🎉 Invoice created successfully! You can download the PDF from the actions menu.', { 
          variant: 'success',
          autoHideDuration: 6000
        });
      }

      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.error || `Failed to ${invoiceId ? 'update' : 'create'} invoice`;
      enqueueSnackbar(message, { variant: 'error' });
      console.error('Error saving invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {invoiceId ? 'Edit Invoice' : salesOrderId ? `Create Invoice from Sales Order ${salesOrderData?.order_number || ''}` : 'Create New Invoice'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Sales Order Summary (when creating from sales order) */}
          {salesOrderData && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: 1, borderColor: 'grey.300' }}>
              <Typography variant="h6" gutterBottom>
                Creating Invoice from Sales Order: {salesOrderData.order_number}
              </Typography>
              <Stack direction="row" spacing={4}>
                <Typography variant="body2">
                  <strong>Customer:</strong> {salesOrderData.customer_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Order Date:</strong> {new Date(salesOrderData.order_date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Reference:</strong> {salesOrderData.reference || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Amount:</strong> {formatCurrency(salesOrderData.total_amount)}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Items from the sales order will be automatically included in the invoice. You can only modify invoice-specific settings below.
              </Typography>
            </Box>
          )}

          {/* Customer and Sales Order (only show when not creating from sales order) */}
          {!salesOrderId && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <Autocomplete
                  value={salesOrders.find(o => o.id.toString() === formData.sales_order?.toString()) || null}
                  onChange={(_, value) => {
                    handleInputChange('sales_order', value?.id || '');
                    if (value) {
                      handleInputChange('customer', value.customer_name);
                    }
                  }}
                  options={salesOrders}
                  getOptionLabel={(option) => `${option.order_number} - ${option.customer_name}`}
                  renderInput={(params) => (
                    <TextField {...params} label="Sales Order (Optional)" />
                  )}
                />
              </FormControl>

              <FormControl fullWidth required>
                <Autocomplete
                  value={customers.find(c => c.id === formData.customer) || null}
                  onChange={(_, value) => handleInputChange('customer', value?.id || '')}
                  options={customers}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Customer" 
                      required 
                      error={!!errors.customer}
                      helperText={errors.customer}
                    />
                  )}
                />
              </FormControl>

              <TextField
                label="Reference"
                value={formData.reference || ''}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                fullWidth
              />
            </Stack>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <DateTimePicker
              label="Invoice Date *"
              value={dayjs(formData.invoice_date)}
              onChange={(value: Dayjs | null) => handleInputChange('invoice_date', value?.toISOString() || '')}
              enableAccessibleFieldDOMStructure={false}
              slots={{
                textField: TextField
              }}
              slotProps={{
                textField: { 
                  fullWidth: true, 
                  required: true,
                  error: !!errors.invoice_date,
                  helperText: errors.invoice_date
                }
              }}
            />

            <DateTimePicker
              label="Due Date *"
              value={dayjs(formData.due_date)}
              onChange={(value: Dayjs | null) => handleInputChange('due_date', value?.toISOString() || '')}
              enableAccessibleFieldDOMStructure={false}
              slots={{
                textField: TextField
              }}
              slotProps={{
                textField: { 
                  fullWidth: true, 
                  required: true,
                  error: !!errors.due_date,
                  helperText: errors.due_date
                }
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Payment Terms</InputLabel>
              <Select
                value={formData.payment_terms || 'net_30'}
                label="Payment Terms"
                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
              >
                {PAYMENT_TERMS_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Divider />

          {/* Invoice Items */}
          <Box>
            {salesOrderId ? (
              // Sales Order Items Summary (read-only)
              <Box>
                <Typography variant="h6" gutterBottom>Items from Sales Order</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="center">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="center">Discount %</TableCell>
                        <TableCell align="right">Line Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesOrderData?.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.product_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              SKU: {item.product_sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {parseFloat(item.quantity).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell align="center">
                            {parseFloat(item.discount_percent || 0)}%
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(item.line_total)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ) : (
              // Editable Items Table (for manual invoice creation)
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Invoice Items</Typography>
                  <Button startIcon={<AddIcon />} onClick={addItem}>
                    Add Item
                  </Button>
                </Stack>

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product *</TableCell>
                        <TableCell width={120}>Quantity *</TableCell>
                        <TableCell width={120}>Unit Price</TableCell>
                        <TableCell width={120}>Discount %</TableCell>
                        <TableCell width={120}>Total</TableCell>
                        <TableCell width={60}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Autocomplete
                              value={products.find(p => p.id === item.product) || null}
                              onChange={(_, value) => handleItemChange(index, 'product', value?.id || '')}
                              options={products}
                              getOptionLabel={(option) => `${option.name} (${option.sku})`}
                              renderInput={(params) => (
                                <TextField 
                                  {...params} 
                                  size="small" 
                                  required 
                                  error={!!errors[`item_${index}_product`]}
                                  helperText={errors[`item_${index}_product`]}
                                />
                              )}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              size="small"
                              required
                              error={!!errors[`item_${index}_quantity`]}
                              helperText={errors[`item_${index}_quantity`]}
                              inputProps={{ min: 0.01, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              size="small"
                              error={!!errors[`item_${index}_unit_price`]}
                              helperText={errors[`item_${index}_unit_price`]}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={item.discount_percent || 0}
                              onChange={(e) => handleItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              size="small"
                              inputProps={{ min: 0, max: 100, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(calculateItemTotal(item))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Invoice Totals */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Stack spacing={1} sx={{ minWidth: 300 }}>
                {salesOrderId ? (
                  // Show totals from sales order (read-only with optional adjustments)
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Sales Order Total Breakdown:
                    </Typography>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Subtotal:</Typography>
                        <Typography variant="body2">{formatCurrency(salesOrderData?.subtotal || 0)}</Typography>
                      </Stack>
                      {(salesOrderData?.tax_amount > 0) && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">Tax:</Typography>
                          <Typography variant="body2">{formatCurrency(salesOrderData?.tax_amount || 0)}</Typography>
                        </Stack>
                      )}
                      {(salesOrderData?.discount_amount > 0) && (
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2">Discount:</Typography>
                          <Typography variant="body2">-{formatCurrency(salesOrderData?.discount_amount || 0)}</Typography>
                        </Stack>
                      )}
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="h6">Invoice Total:</Typography>
                        <Typography variant="h6">{formatCurrency(calculateInvoiceTotal())}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                ) : (
                  // Editable totals for manual invoice creation
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        label="Tax Amount"
                        type="number"
                        value={formData.tax_amount || 0}
                        onChange={(e) => handleInputChange('tax_amount', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                      <TextField
                        label="Discount Amount"
                        type="number"
                        value={formData.discount_amount || 0}
                        onChange={(e) => handleInputChange('discount_amount', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Stack>
                    {invoiceId && (
                      <TextField
                        label="Paid Amount"
                        type="number"
                        value={formData.paid_amount || 0}
                        onChange={(e) => handleInputChange('paid_amount', parseFloat(e.target.value) || 0)}
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    )}
                    <Typography variant="h6" align="right">
                      Total: {formatCurrency(calculateInvoiceTotal())}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Box>

          <Divider />

          {/* Notes and Terms */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Notes"
              multiline
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              fullWidth
            />
            <TextField
              label="Terms & Conditions"
              multiline
              rows={3}
              value={formData.terms_conditions || ''}
              onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {invoiceId && (
          <Button
            startIcon={<PdfIcon />}
            onClick={() => handleDownloadPDF()}
            disabled={loading}
            color="secondary"
          >
            Download PDF
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : (invoiceId ? 'Update Invoice' : 'Create Invoice')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceFormDialog;