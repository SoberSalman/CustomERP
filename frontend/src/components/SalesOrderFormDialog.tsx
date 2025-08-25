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
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import { formatCurrency } from '../utils/currency';
import salesApi from '../services/sales';
import { customerApi } from '../services/customer';
import inventoryApi from '../services/inventory';
import {
  SalesOrder,
  SalesOrderCreateUpdate,
  SalesOrderItem,
  PRIORITY_OPTIONS,
} from '../types/sales';
import { CustomerListItem } from '../types/customer';
import { ProductListItem } from '../types/inventory';

interface SalesOrderFormDialogProps {
  open: boolean;
  onClose: () => void;
  orderId?: number | null;
  onSuccess: () => void;
}

const SalesOrderFormDialog: React.FC<SalesOrderFormDialogProps> = ({
  open,
  onClose,
  orderId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [formData, setFormData] = useState<SalesOrderCreateUpdate>({
    customer: '',
    order_date: dayjs().toISOString(),
    priority: 'normal',
    items: [{ product: '', quantity: 1, unit_price: 0, discount_percent: 0 }],
  });

  const { enqueueSnackbar } = useSnackbar();

  const fetchData = async () => {
    try {
      const [customersResponse, productsResponse] = await Promise.all([
        customerApi.list(),
        inventoryApi.products.list(),
      ]);
      setCustomers(customersResponse.data.results);
      setProducts(productsResponse.data.results);
    } catch (error) {
      enqueueSnackbar('Failed to load form data', { variant: 'error' });
      console.error('Error fetching form data:', error);
    }
  };

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const response = await salesApi.orders.get(orderId);
      const order = response.data;

      setFormData({
        customer: order.customer,
        reference: order.reference || '',
        order_date: order.order_date,
        expected_delivery_date: order.expected_delivery_date || '',
        priority: order.priority,
        tax_amount: order.tax_amount || 0,
        discount_amount: order.discount_amount || 0,
        notes: order.notes || '',
        internal_notes: order.internal_notes || '',
        assigned_to: order.assigned_to,
        items: order.items.map(item => ({
          product: item.product,
          quantity: parseFloat(item.quantity.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          discount_percent: parseFloat((item.discount_percent || 0).toString()),
          notes: item.notes || '',
        })),
      });
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
      if (orderId) {
        fetchOrder();
      } else {
        // Reset form for new order
        setFormData({
          customer: '',
          order_date: dayjs().toISOString(),
          priority: 'normal',
          items: [{ product: '', quantity: 1, unit_price: 0, discount_percent: 0 }],
        });
      }
    }
  }, [open, orderId]);

  const handleInputChange = (field: keyof SalesOrderCreateUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index: number, field: keyof SalesOrderItem, value: any) => {
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

  const calculateItemTotal = (item: SalesOrderItem): number => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_percent || 0) / 100;
    return subtotal - discount;
  };

  const calculateOrderTotal = (): number => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const taxAmount = formData.tax_amount || 0;
    const discountAmount = formData.discount_amount || 0;
    return itemsTotal + taxAmount - discountAmount;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.customer || formData.items.some(item => !item.product || item.quantity <= 0)) {
        enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
        return;
      }

      if (orderId) {
        await salesApi.orders.update(orderId, formData);
        enqueueSnackbar('Sales order updated successfully', { variant: 'success' });
      } else {
        await salesApi.orders.create(formData);
        enqueueSnackbar('Sales order created successfully', { variant: 'success' });
      }

      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.error || `Failed to ${orderId ? 'update' : 'create'} sales order`;
      enqueueSnackbar(message, { variant: 'error' });
      console.error('Error saving sales order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {orderId ? 'Edit Sales Order' : 'Create Sales Order'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Customer and Basic Info */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth required>
              <Autocomplete
                value={customers.find(c => c.id === formData.customer) || null}
                onChange={(_, value) => handleInputChange('customer', value?.id || '')}
                options={customers}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField {...params} label="Customer" required />
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

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <DateTimePicker
              label="Order Date *"
              value={dayjs(formData.order_date)}
              onChange={(value: Dayjs | null) => handleInputChange('order_date', value?.toISOString() || '')}
              enableAccessibleFieldDOMStructure={false}
              slots={{
                textField: TextField
              }}
              slotProps={{
                textField: { fullWidth: true, required: true }
              }}
            />

            <DateTimePicker
              label="Expected Delivery Date"
              value={formData.expected_delivery_date ? dayjs(formData.expected_delivery_date) : null}
              onChange={(value: Dayjs | null) => handleInputChange('expected_delivery_date', value?.toISOString() || '')}
              enableAccessibleFieldDOMStructure={false}
              slots={{
                textField: TextField
              }}
              slotProps={{
                textField: { fullWidth: true }
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority || 'normal'}
                label="Priority"
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                {PRIORITY_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Divider />

          {/* Order Items */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Order Items</Typography>
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
                            <TextField {...params} size="small" required />
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
                          inputProps={{ min: 0.01, step: 0.01 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          size="small"
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

            {/* Order Totals */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Stack spacing={1} sx={{ minWidth: 200 }}>
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
                <Typography variant="h6" align="right">
                  Total: {formatCurrency(calculateOrderTotal())}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Divider />

          {/* Notes */}
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
              label="Internal Notes"
              multiline
              rows={3}
              value={formData.internal_notes || ''}
              onChange={(e) => handleInputChange('internal_notes', e.target.value)}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : (orderId ? 'Update Order' : 'Create Order')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalesOrderFormDialog;