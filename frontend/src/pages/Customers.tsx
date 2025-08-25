import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Alert,
  Skeleton,
  InputAdornment,
  Stack,
  Tooltip,
  Avatar,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  Toolbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountBalance as GovernmentIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  TrendingUp as ConvertIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { 
  customerApi, 
  CUSTOMER_TYPE_OPTIONS, 
  CUSTOMER_STATUS_OPTIONS 
} from '../services/customer';
import { 
  CustomerListItem, 
  CustomerCreateUpdate,
  CustomerFilters 
} from '../types/customer';
import { formatCurrency } from '../utils/currency';
import CustomerFormDialog from '../components/CustomerFormDialog';

const Customers: React.FC = () => {
  const { token } = useAuth();
  const { currentTenant } = useTenant();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [vipOnly, setVipOnly] = useState(false);
  
  // UI State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<CustomerCreateUpdate | undefined>();

  useEffect(() => {
    if (token && currentTenant) {
      loadCustomers();
    }
  }, [token, currentTenant, page, rowsPerPage, searchTerm, selectedStatus, selectedType, vipOnly]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const filters: CustomerFilters = {
        page: page + 1,
        search: searchTerm || undefined,
        status: selectedStatus || undefined,
        customer_type: selectedType || undefined,
        vip_only: vipOnly || undefined,
        sort_by: 'name',
        sort_direction: 'asc',
      };
      
      const response = await customerApi.list(filters);
      setCustomers(response.data.results);
      setTotalCount(response.data.count);
    } catch (err) {
      setError('Failed to load customers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = () => {
    setDialogMode('create');
    setFormData(undefined);
    setDialogOpen(true);
  };

  const handleEditCustomer = async (id: string) => {
    try {
      const response = await customerApi.get(id);
      const customer = response.data;
      
      setDialogMode('edit');
      setFormData({
        name: customer.name,
        customer_type: customer.customer_type,
        status: customer.status,
        contact_person: customer.contact_person,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        website: customer.website,
        billing_address: customer.billing_address,
        billing_city: customer.billing_city,
        billing_state: customer.billing_state,
        billing_country: customer.billing_country,
        billing_postal_code: customer.billing_postal_code,
        shipping_address: customer.shipping_address,
        shipping_city: customer.shipping_city,
        shipping_state: customer.shipping_state,
        shipping_country: customer.shipping_country,
        shipping_postal_code: customer.shipping_postal_code,
        use_billing_as_shipping: customer.use_billing_as_shipping,
        tax_number: customer.tax_number,
        registration_number: customer.registration_number,
        payment_terms: customer.payment_terms,
        credit_limit: customer.credit_limit || '',
        notes: customer.notes,
        tags: customer.tags,
        is_active: customer.is_active,
        assigned_to: customer.assigned_to,
      });
      setSelectedCustomer(id);
      setDialogOpen(true);
    } catch (err) {
      setError('Failed to load customer details');
    }
  };

  const handleSaveCustomer = async (data: CustomerCreateUpdate) => {
    try {
      setFormLoading(true);
      if (dialogMode === 'create') {
        await customerApi.create(data);
      } else if (selectedCustomer) {
        await customerApi.update(selectedCustomer, data);
      }
      
      setDialogOpen(false);
      setFormData(undefined);
      loadCustomers();
    } catch (err) {
      setError('Failed to save customer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (selectedCustomer) {
      try {
        await customerApi.delete(selectedCustomer);
        setDeleteDialogOpen(false);
        setSelectedCustomer(null);
        loadCustomers();
      } catch (err) {
        setError('Failed to delete customer');
      }
    }
  };

  const handleConvertLead = async (id: string) => {
    try {
      await customerApi.convertLead(id);
      loadCustomers();
    } catch (err) {
      setError('Failed to convert lead');
    }
  };

  const getCustomerTypeIcon = (type: string) => {
    switch (type) {
      case 'business':
        return <BusinessIcon fontSize="small" />;
      case 'government':
        return <GovernmentIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'lead':
        return 'info';
      case 'prospect':
        return 'warning';
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && customers.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        {[...Array(10)].map((_, index) => (
          <Skeleton key={index} height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3 }}
        aria-label="breadcrumb"
      >
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => window.location.href = '/dashboard'}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <PersonIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Customers
        </Typography>
      </Breadcrumbs>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Page Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Customer Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your customer relationships and track sales performance
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadCustomers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateCustomer}
              size="large"
              sx={{ fontWeight: 'bold' }}
            >
              Add Customer
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card elevation={0} sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
          <CardContent>
            <Typography color="primary.600" gutterBottom variant="body2" fontWeight="medium">
              Total Customers
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {loading ? <Skeleton width={60} /> : totalCount}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
          <CardContent>
            <Typography color="success.600" gutterBottom variant="body2" fontWeight="medium">
              Active Customers
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {loading ? <Skeleton width={60} /> : customers.filter(c => c.status === 'active').length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.100' }}>
          <CardContent>
            <Typography color="warning.600" gutterBottom variant="body2" fontWeight="medium">
              VIP Customers
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {loading ? <Skeleton width={60} /> : customers.filter(c => c.is_vip).length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.100' }}>
          <CardContent>
            <Typography color="info.600" gutterBottom variant="body2" fontWeight="medium">
              Leads
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {loading ? <Skeleton width={60} /> : customers.filter(c => c.status === 'lead').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>


      {/* Main Content */}
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Filters Toolbar */}
        <Toolbar sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
          <FilterListIcon sx={{ mr: 2, color: 'text.secondary' }} />
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <TextField
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300, bgcolor: 'white' }}
            />
            
            <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'white' }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {CUSTOMER_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'white' }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                label="Type"
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {CUSTOMER_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={vipOnly}
                  onChange={(e) => setVipOnly(e.target.checked)}
                  size="small"
                />
              }
              label="VIP Only"
            />
          </Stack>
        </Toolbar>

        {/* Customers Table */}
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Contact</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Total Spent</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Orders</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Outstanding</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Last Order</TableCell>
                <TableCell width={100} sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  sx={{ 
                    '&:hover': { bgcolor: 'grey.50' },
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: customer.is_vip ? 'gold' : 'primary.main' }}>
                      {customer.is_vip ? <StarIcon /> : getCustomerTypeIcon(customer.customer_type)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {customer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.customer_code}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" textTransform="capitalize">
                    {customer.customer_type_display}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={customer.status_display}
                    color={getStatusColor(customer.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="column" spacing={0.5}>
                    {customer.email && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption">{customer.email}</Typography>
                      </Stack>
                    )}
                    {customer.phone && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption">{customer.phone}</Typography>
                      </Stack>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(customer.total_spent, currentTenant?.currency)}
                </TableCell>
                <TableCell align="right">{customer.total_orders}</TableCell>
                <TableCell align="right">
                  {formatCurrency(customer.outstanding_balance, currentTenant?.currency)}
                </TableCell>
                <TableCell>
                  {customer.last_order_date ? (
                    new Date(customer.last_order_date).toLocaleDateString()
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {customer.status === 'lead' && (
                      <Tooltip title="Convert to Customer">
                        <IconButton
                          size="small"
                          onClick={() => handleConvertLead(customer.id)}
                          color="success"
                        >
                          <ConvertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleEditCustomer(customer.id)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedCustomer(customer.id);
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />
        </TableContainer>
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            if (selectedCustomer) handleEditCustomer(selectedCustomer);
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setDeleteDialogOpen(true);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this customer? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteCustomer} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setFormData(undefined);
        }}
        onSave={handleSaveCustomer}
        initialData={formData}
        mode={dialogMode}
        loading={formLoading}
      />
    </Box>
  );
};

export default Customers;