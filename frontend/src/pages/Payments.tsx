import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Breadcrumbs,
  Link,
  Toolbar,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import salesApi from '../services/sales';
import {
  Payment,
  PaymentFilters,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../types/sales';
import PaymentFormDialog from '../components/PaymentFormDialog';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { enqueueSnackbar } = useSnackbar();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const searchFilters: PaymentFilters = {
        ...filters,
        search: searchTerm || undefined,
      };

      const response = await salesApi.payments.list(searchFilters);
      setPayments(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      enqueueSnackbar('Failed to fetch payments', { variant: 'error' });
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, filters]);

  const handleSearch = () => {
    setPage(1);
    fetchPayments();
  };

  const handleFilterChange = (key: keyof PaymentFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setPage(1);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, paymentId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedPaymentId(paymentId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPaymentId(null);
  };

  const handleEdit = () => {
    if (selectedPaymentId) {
      setFormOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (selectedPaymentId) {
      try {
        await salesApi.payments.delete(selectedPaymentId);
        enqueueSnackbar('Payment deleted successfully', { variant: 'success' });
        fetchPayments();
      } catch (error) {
        enqueueSnackbar('Failed to delete payment', { variant: 'error' });
        console.error('Error deleting payment:', error);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedPaymentId(null);
  };

  const handleProcess = async (paymentId: number) => {
    try {
      await salesApi.payments.process(paymentId);
      enqueueSnackbar('Payment processed successfully', { variant: 'success' });
      fetchPayments();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to process payment';
      enqueueSnackbar(message, { variant: 'error' });
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string): string => {
    const statusOption = PAYMENT_STATUS_OPTIONS.find(option => option.value === status);
    return statusOption?.color || '#9e9e9e';
  };

  const getMethodLabel = (method: string): string => {
    const methodOption = PAYMENT_METHOD_OPTIONS.find(option => option.value === method);
    return methodOption?.label || method;
  };

  const selectedPayment = payments.find(payment => payment.id === selectedPaymentId);

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
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => window.location.href = '/sales'}
        >
          <ShoppingCartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Sales
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <PaymentIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Payments
        </Typography>
      </Breadcrumbs>
      {/* Page Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Payment Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track and record customer payments across all invoices
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchPayments}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedPaymentId(null);
                setFormOpen(true);
              }}
              size="large"
              sx={{ fontWeight: 'bold' }}
            >
              Record Payment
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card elevation={0} sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
          <CardContent>
            <Typography color="primary.600" gutterBottom variant="body2" fontWeight="medium">
              Total Payments
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {loading ? '...' : totalCount}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
          <CardContent>
            <Typography color="success.600" gutterBottom variant="body2" fontWeight="medium">
              Completed
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {loading ? '...' : payments.filter(p => p.status === 'completed').length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.100' }}>
          <CardContent>
            <Typography color="warning.600" gutterBottom variant="body2" fontWeight="medium">
              Pending
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {loading ? '...' : payments.filter(p => p.status === 'pending').length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.100' }}>
          <CardContent>
            <Typography color="error.600" gutterBottom variant="body2" fontWeight="medium">
              Failed
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {loading ? '...' : payments.filter(p => p.status === 'failed').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>


      {loading ? (
        <Alert severity="info">Loading payments...</Alert>
      ) : payments.length === 0 ? (
        <Alert severity="info">No payments found.</Alert>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Filters Toolbar */}
          <Toolbar sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <FilterListIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
              <TextField
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 300, bgcolor: 'white' }}
              />
              
              <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  {PAYMENT_STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={filters.payment_method || ''}
                  label="Payment Method"
                  onChange={(e) => handleFilterChange('payment_method', e.target.value)}
                >
                  <MenuItem value="">All Methods</MenuItem>
                  {PAYMENT_METHOD_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Toolbar>

          {/* Payments Table */}
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Payment Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Invoice</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Payment Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow 
                    key={payment.id} 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      '&:last-child td, &:last-child th': { border: 0 }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {payment.payment_number}
                      </Typography>
                      {payment.reference && (
                        <Typography variant="caption" color="text.secondary">
                          Ref: {payment.reference}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payment.invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{payment.customer_name}</TableCell>
                    <TableCell>{formatDateTime(payment.payment_date)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                        {formatCurrency(payment.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getMethodLabel(payment.payment_method)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={PAYMENT_STATUS_OPTIONS.find(s => s.value === payment.status)?.label || payment.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(payment.status),
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="More actions">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, payment.id!)}
                          size="small"
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalCount > pageSize && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => console.log('View payment', selectedPaymentId)}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        {selectedPayment?.status === 'pending' && (
          <MenuItem onClick={() => selectedPaymentId && handleProcess(selectedPaymentId)}>
            <CheckCircleIcon sx={{ mr: 1 }} fontSize="small" />
            Process Payment
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Payment Form Dialog */}
      <PaymentFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedPaymentId(null);
        }}
        invoiceId={selectedPaymentId}
        onSuccess={() => {
          fetchPayments();
          setFormOpen(false);
          setSelectedPaymentId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this payment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payments;