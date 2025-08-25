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
  IconButton,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useSnackbar } from 'notistack';
import dayjs, { Dayjs } from 'dayjs';
import { formatCurrency } from '../utils/currency';
import salesApi from '../services/sales';
import {
  PaymentCreateUpdate,
  PAYMENT_METHOD_OPTIONS,
  Invoice,
} from '../types/sales';

interface PaymentFormDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId?: number | null;
  onSuccess: () => void;
}

const PaymentFormDialog: React.FC<PaymentFormDialogProps> = ({
  open,
  onClose,
  invoiceId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<PaymentCreateUpdate>({
    invoice: 0,
    customer: '',
    payment_date: dayjs().toISOString(),
    amount: 0,
    payment_method: 'bank_transfer',
    notes: '',
  });

  const { enqueueSnackbar } = useSnackbar();

  const fetchInvoice = async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);
      const response = await salesApi.invoices.get(invoiceId);
      const invoiceData = response.data;
      setInvoice(invoiceData);
      
      setFormData({
        invoice: invoiceData.id!,
        customer: invoiceData.customer,
        payment_date: dayjs().toISOString(),
        amount: invoiceData.balance_due || 0,
        payment_method: 'bank_transfer',
        notes: '',
      });
    } catch (error) {
      enqueueSnackbar('Failed to load invoice details', { variant: 'error' });
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoice();
    } else if (open) {
      // Reset form
      setFormData({
        invoice: 0,
        customer: '',
        payment_date: dayjs().toISOString(),
        amount: 0,
        payment_method: 'bank_transfer',
        notes: '',
      });
      setInvoice(null);
    }
  }, [open, invoiceId]);

  const handleInputChange = (field: keyof PaymentCreateUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.invoice || !formData.customer || formData.amount <= 0) {
        enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
        return;
      }

      // Validate amount doesn't exceed balance due
      if (invoice && formData.amount > invoice.balance_due!) {
        enqueueSnackbar('Payment amount cannot exceed balance due', { variant: 'error' });
        return;
      }

      await salesApi.payments.create(formData);
      enqueueSnackbar('Payment recorded successfully', { variant: 'success' });
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to record payment';
      enqueueSnackbar(message, { variant: 'error' });
      console.error('Error recording payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Record Payment</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {invoice && (
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Invoice:</strong> {invoice.invoice_number}<br />
                <strong>Customer:</strong> {invoice.customer_name}<br />
                <strong>Total Amount:</strong> {formatCurrency(invoice.total_amount!)}<br />
                <strong>Paid Amount:</strong> {formatCurrency(invoice.paid_amount!)}<br />
                <strong>Balance Due:</strong> {formatCurrency(invoice.balance_due!)}
              </Typography>
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <DateTimePicker
              label="Payment Date *"
              value={dayjs(formData.payment_date)}
              onChange={(value: Dayjs | null) => 
                handleInputChange('payment_date', value?.toISOString() || '')
              }
              enableAccessibleFieldDOMStructure={false}
              slots={{
                textField: TextField
              }}
              slotProps={{
                textField: { fullWidth: true, required: true }
              }}
            />

            <TextField
              label="Amount *"
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              fullWidth
              required
              inputProps={{ 
                min: 0.01, 
                step: 0.01,
                max: invoice?.balance_due || undefined
              }}
              helperText={
                invoice && formData.amount > 0 
                  ? `Remaining balance: ${formatCurrency((invoice.balance_due || 0) - formData.amount)}`
                  : undefined
              }
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={formData.payment_method}
                label="Payment Method"
                onChange={(e) => handleInputChange('payment_method', e.target.value)}
              >
                {PAYMENT_METHOD_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Transaction ID"
              value={formData.transaction_id || ''}
              onChange={(e) => handleInputChange('transaction_id', e.target.value)}
              fullWidth
            />
          </Stack>

          <TextField
            label="Reference"
            value={formData.reference || ''}
            onChange={(e) => handleInputChange('reference', e.target.value)}
            fullWidth
          />

          <TextField
            label="Notes"
            multiline
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            fullWidth
          />

          {/* Payment Actions Quick Buttons */}
          {invoice && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleInputChange('amount', invoice.balance_due || 0)}
                disabled={formData.amount === invoice.balance_due}
              >
                Full Payment ({formatCurrency(invoice.balance_due || 0)})
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleInputChange('amount', (invoice.balance_due || 0) / 2)}
                disabled={formData.amount === (invoice.balance_due || 0) / 2}
              >
                50% Payment ({formatCurrency((invoice.balance_due || 0) / 2)})
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !invoice}
        >
          {loading ? 'Recording...' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentFormDialog;