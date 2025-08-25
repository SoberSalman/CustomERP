import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Tabs,
  Tab,
  Typography,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { CustomerCreateUpdate } from '../types/customer';
import { CUSTOMER_TYPE_OPTIONS, CUSTOMER_STATUS_OPTIONS } from '../services/customer';
import { getCurrencySymbol } from '../utils/currency';
import { useTenant } from '../contexts/TenantContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CustomerCreateUpdate) => void;
  initialData?: CustomerCreateUpdate;
  mode: 'create' | 'edit';
  loading?: boolean;
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  open,
  onClose,
  onSave,
  initialData,
  mode,
  loading = false,
}) => {
  const { currentTenant } = useTenant();
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<CustomerCreateUpdate>(
    initialData || {
      name: '',
      customer_type: 'individual',
      status: 'lead',
      contact_person: '',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      billing_address: '',
      billing_city: '',
      billing_state: '',
      billing_country: 'Pakistan',
      billing_postal_code: '',
      shipping_address: '',
      shipping_city: '',
      shipping_state: '',
      shipping_country: '',
      shipping_postal_code: '',
      use_billing_as_shipping: true,
      tax_number: '',
      registration_number: '',
      payment_terms: 'Net 30',
      credit_limit: '',
      notes: '',
      tags: '',
      is_active: true,
    }
  );

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (field: keyof CustomerCreateUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-copy billing to shipping when enabled
    if (field === 'use_billing_as_shipping' && value) {
      setFormData(prev => ({
        ...prev,
        use_billing_as_shipping: true,
        shipping_address: prev.billing_address,
        shipping_city: prev.billing_city,
        shipping_state: prev.billing_state,
        shipping_country: prev.billing_country,
        shipping_postal_code: prev.billing_postal_code,
      }));
    }

    // Auto-copy billing fields to shipping when billing changes and option is enabled
    if (formData.use_billing_as_shipping) {
      if (field === 'billing_address') {
        setFormData(prev => ({ ...prev, [field]: value, shipping_address: value }));
      } else if (field === 'billing_city') {
        setFormData(prev => ({ ...prev, [field]: value, shipping_city: value }));
      } else if (field === 'billing_state') {
        setFormData(prev => ({ ...prev, [field]: value, shipping_state: value }));
      } else if (field === 'billing_country') {
        setFormData(prev => ({ ...prev, [field]: value, shipping_country: value }));
      } else if (field === 'billing_postal_code') {
        setFormData(prev => ({ ...prev, [field]: value, shipping_postal_code: value }));
      }
    }
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  const isValid = formData.name.trim() !== '' && formData.email.trim() !== '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? 'Add New Customer' : 'Edit Customer'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab icon={<PersonIcon />} label="Basic Info" />
            <Tab icon={<LocationIcon />} label="Addresses" />
            <Tab icon={<PaymentIcon />} label="Business Info" />
            <Tab icon={<NotesIcon />} label="Notes & Tags" />
          </Tabs>
        </Box>

        {/* Basic Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Customer Name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Contact Person"
                value={formData.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
                fullWidth
              />
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Customer Type</InputLabel>
                <Select
                  value={formData.customer_type}
                  label="Customer Type"
                  onChange={(e) => handleChange('customer_type', e.target.value)}
                >
                  {CUSTOMER_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {CUSTOMER_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              fullWidth
              required
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                fullWidth
              />
              <TextField
                label="Mobile"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                fullWidth
              />
            </Stack>

            <TextField
              label="Website"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              fullWidth
              placeholder="https://example.com"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                />
              }
              label="Active Customer"
            />
          </Stack>
        </TabPanel>

        {/* Addresses Tab */}
        <TabPanel value={activeTab} index={1}>
          <Stack spacing={3}>
            <Typography variant="h6" gutterBottom>
              Billing Address
            </Typography>
            
            <TextField
              label="Address"
              value={formData.billing_address}
              onChange={(e) => handleChange('billing_address', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                value={formData.billing_city}
                onChange={(e) => handleChange('billing_city', e.target.value)}
                fullWidth
              />
              <TextField
                label="State/Province"
                value={formData.billing_state}
                onChange={(e) => handleChange('billing_state', e.target.value)}
                fullWidth
              />
              <TextField
                label="Postal Code"
                value={formData.billing_postal_code}
                onChange={(e) => handleChange('billing_postal_code', e.target.value)}
                fullWidth
              />
            </Stack>
            
            <TextField
              label="Country"
              value={formData.billing_country}
              onChange={(e) => handleChange('billing_country', e.target.value)}
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.use_billing_as_shipping}
                  onChange={(e) => handleChange('use_billing_as_shipping', e.target.checked)}
                />
              }
              label="Use billing address as shipping address"
            />

            {!formData.use_billing_as_shipping && (
              <Stack spacing={3}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Shipping Address
                </Typography>
                
                <TextField
                  label="Shipping Address"
                  value={formData.shipping_address}
                  onChange={(e) => handleChange('shipping_address', e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
                
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="City"
                    value={formData.shipping_city}
                    onChange={(e) => handleChange('shipping_city', e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="State/Province"
                    value={formData.shipping_state}
                    onChange={(e) => handleChange('shipping_state', e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Postal Code"
                    value={formData.shipping_postal_code}
                    onChange={(e) => handleChange('shipping_postal_code', e.target.value)}
                    fullWidth
                  />
                </Stack>
                
                <TextField
                  label="Country"
                  value={formData.shipping_country}
                  onChange={(e) => handleChange('shipping_country', e.target.value)}
                  fullWidth
                />
              </Stack>
            )}
          </Stack>
        </TabPanel>

        {/* Business Information Tab */}
        <TabPanel value={activeTab} index={2}>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Tax Number"
                value={formData.tax_number}
                onChange={(e) => handleChange('tax_number', e.target.value)}
                fullWidth
              />
              <TextField
                label="Registration Number"
                value={formData.registration_number}
                onChange={(e) => handleChange('registration_number', e.target.value)}
                fullWidth
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Payment Terms"
                value={formData.payment_terms}
                onChange={(e) => handleChange('payment_terms', e.target.value)}
                fullWidth
                placeholder="e.g., Net 30, COD, Advance"
              />
              <TextField
                label="Credit Limit"
                type="number"
                value={formData.credit_limit}
                onChange={(e) => handleChange('credit_limit', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {getCurrencySymbol(currentTenant?.currency)}
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </Stack>
        </TabPanel>

        {/* Notes & Tags Tab */}
        <TabPanel value={activeTab} index={3}>
          <Stack spacing={3}>
            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Additional notes about this customer..."
            />
            <TextField
              label="Tags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              fullWidth
              placeholder="Comma-separated tags (e.g., VIP, Corporate, Local)"
            />
          </Stack>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!isValid || loading}
        >
          {loading ? 'Saving...' : (mode === 'create' ? 'Create Customer' : 'Update Customer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerFormDialog;