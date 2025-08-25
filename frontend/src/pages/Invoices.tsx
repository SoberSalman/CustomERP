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
  LinearProgress,
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
  Send as SendIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PictureAsPdf as PdfIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
  Receipt as ReceiptIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import salesApi from '../services/sales';
import {
  InvoiceListItem,
  InvoiceFilters,
  INVOICE_STATUS_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
} from '../types/sales';
import InvoiceFormDialog from '../components/InvoiceFormDialog';
import PaymentFormDialog from '../components/PaymentFormDialog';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { enqueueSnackbar } = useSnackbar();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const searchFilters: InvoiceFilters = {
        ...filters,
        search: searchTerm || undefined,
      };

      const response = await salesApi.invoices.list(searchFilters);
      setInvoices(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      enqueueSnackbar('Failed to fetch invoices', { variant: 'error' });
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, filters]);

  const handleSearch = () => {
    setPage(1);
    fetchInvoices();
  };

  const handleFilterChange = (key: keyof InvoiceFilters, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
    setPage(1);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, invoiceId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedInvoiceId(invoiceId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoiceId(null);
  };

  const handleEdit = () => {
    if (selectedInvoiceId) {
      setFormOpen(true);
    }
    setAnchorEl(null); // Only close the menu, don't reset selectedInvoiceId
  };

  const handleDelete = () => {
    // Keep the selectedInvoiceId for the delete operation
    setDeleteDialogOpen(true);
    setAnchorEl(null); // Only close the menu, don't reset selectedInvoiceId
  };

  const confirmDelete = async () => {
    if (selectedInvoiceId) {
      try {
        await salesApi.invoices.delete(selectedInvoiceId);
        enqueueSnackbar('Invoice deleted successfully', { variant: 'success' });
        fetchInvoices();
      } catch (error) {
        enqueueSnackbar('Failed to delete invoice', { variant: 'error' });
        console.error('Error deleting invoice:', error);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedInvoiceId(null);
  };

  const handleSend = async (invoiceId: number) => {
    try {
      await salesApi.invoices.send(invoiceId);
      enqueueSnackbar('Invoice sent successfully', { variant: 'success' });
      fetchInvoices();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send invoice';
      enqueueSnackbar(message, { variant: 'error' });
    }
    handleMenuClose();
  };

  const handleMarkPaid = async (invoiceId: number) => {
    try {
      await salesApi.invoices.markPaid(invoiceId);
      enqueueSnackbar('Invoice marked as paid', { variant: 'success' });
      fetchInvoices();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to mark invoice as paid';
      enqueueSnackbar(message, { variant: 'error' });
    }
    handleMenuClose();
  };

  const handleAddPayment = () => {
    if (selectedInvoiceId) {
      setPaymentFormOpen(true);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string): string => {
    const statusOption = INVOICE_STATUS_OPTIONS.find(option => option.value === status);
    return statusOption?.color || '#9e9e9e';
  };

  const getPaymentProgress = (totalAmount: number, paidAmount: number): number => {
    if (totalAmount === 0) return 0;
    return Math.min((paidAmount / totalAmount) * 100, 100);
  };

  const selectedInvoice = invoices.find(invoice => invoice.id === selectedInvoiceId);

  const handleViewInvoice = (invoiceId: number) => {
    // Open the invoice form dialog in edit/view mode
    setSelectedInvoiceId(invoiceId);
    setFormOpen(true);
    handleMenuClose();
  };

  const handleDownloadPDF = async (invoiceId: number) => {
    try {
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
    handleMenuClose();
  };

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
          <ReceiptIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Invoices
        </Typography>
      </Breadcrumbs>
      {/* Page Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Invoice Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create, track and manage customer invoices and payments
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchInvoices}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedInvoiceId(null);
                setFormOpen(true);
              }}
              size="large"
              sx={{ fontWeight: 'bold' }}
            >
              Create Invoice
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card elevation={0} sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
          <CardContent>
            <Typography color="primary.600" gutterBottom variant="body2" fontWeight="medium">
              Total Invoices
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {loading ? '...' : totalCount}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
          <CardContent>
            <Typography color="success.600" gutterBottom variant="body2" fontWeight="medium">
              Paid
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {loading ? '...' : invoices.filter(i => i.status === 'paid').length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.100' }}>
          <CardContent>
            <Typography color="warning.600" gutterBottom variant="body2" fontWeight="medium">
              Pending
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {loading ? '...' : invoices.filter(i => i.status === 'sent').length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.100' }}>
          <CardContent>
            <Typography color="error.600" gutterBottom variant="body2" fontWeight="medium">
              Overdue
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {loading ? '...' : invoices.filter(i => i.is_overdue).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>


      {loading ? (
        <Alert severity="info">Loading invoices...</Alert>
      ) : invoices.length === 0 ? (
        <Alert severity="info">No invoices found.</Alert>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Filters Toolbar */}
          <Toolbar sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <FilterListIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
              <TextField
                placeholder="Search invoices..."
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
                  {INVOICE_STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
                <InputLabel>Overdue</InputLabel>
                <Select
                  value={filters.overdue === true ? 'true' : filters.overdue === false ? 'false' : ''}
                  label="Overdue"
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('overdue', value === 'true' ? true : value === 'false' ? false : '');
                  }}
                >
                  <MenuItem value="">All Invoices</MenuItem>
                  <MenuItem value="true">Overdue Only</MenuItem>
                  <MenuItem value="false">Not Overdue</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Toolbar>

          {/* Invoices Table */}
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Invoice Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Invoice Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Payment Progress</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      '&:last-child td, &:last-child th': { border: 0 }
                    }}
                  >
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" fontWeight={500}>
                          {invoice.invoice_number}
                        </Typography>
                        {invoice.is_overdue && (
                          <Chip
                            icon={<WarningIcon />}
                            label="Overdue"
                            size="small"
                            color="error"
                            sx={{ width: 'fit-content' }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={invoice.is_overdue ? 'error.main' : 'inherit'}
                      >
                        {formatDate(invoice.due_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={INVOICE_STATUS_OPTIONS.find(s => s.value === invoice.status)?.label || invoice.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(invoice.status),
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack alignItems="flex-end">
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(invoice.total_amount)}
                        </Typography>
                        {invoice.paid_amount > 0 && (
                          <Typography variant="caption" color="success.main">
                            Paid: {formatCurrency(invoice.paid_amount)}
                          </Typography>
                        )}
                        {invoice.balance_due > 0 && (
                          <Typography variant="caption" color="warning.main">
                            Due: {formatCurrency(invoice.balance_due)}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={getPaymentProgress(invoice.total_amount, invoice.paid_amount)}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: '#f0f0f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: invoice.status === 'paid' ? '#4caf50' : '#ff9800',
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(getPaymentProgress(invoice.total_amount, invoice.paid_amount))}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="More actions">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, invoice.id)}
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
        <MenuItem onClick={() => selectedInvoiceId && handleViewInvoice(selectedInvoiceId)}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View
        </MenuItem>
        <MenuItem onClick={() => selectedInvoiceId && handleDownloadPDF(selectedInvoiceId)}>
          <PdfIcon sx={{ mr: 1 }} fontSize="small" />
          Download PDF
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        {selectedInvoice?.status === 'draft' && (
          <MenuItem onClick={() => selectedInvoiceId && handleSend(selectedInvoiceId)}>
            <SendIcon sx={{ mr: 1 }} fontSize="small" />
            Send Invoice
          </MenuItem>
        )}
        {selectedInvoice?.status && !['paid', 'cancelled'].includes(selectedInvoice.status) && (
          <MenuItem onClick={handleAddPayment}>
            <PaymentIcon sx={{ mr: 1 }} fontSize="small" />
            Add Payment
          </MenuItem>
        )}
        {selectedInvoice?.status && !['paid', 'cancelled'].includes(selectedInvoice.status) && (
          <MenuItem onClick={() => selectedInvoiceId && handleMarkPaid(selectedInvoiceId)}>
            <CheckCircleIcon sx={{ mr: 1 }} fontSize="small" />
            Mark as Paid
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Invoice Form Dialog */}
      <InvoiceFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedInvoiceId(null);
        }}
        invoiceId={selectedInvoiceId}
        onSuccess={() => {
          fetchInvoices();
          setFormOpen(false);
          setSelectedInvoiceId(null);
        }}
      />

      {/* Payment Form Dialog */}
      <PaymentFormDialog
        open={paymentFormOpen}
        onClose={() => {
          setPaymentFormOpen(false);
          setSelectedInvoiceId(null);
        }}
        invoiceId={selectedInvoiceId}
        onSuccess={() => {
          fetchInvoices();
          setPaymentFormOpen(false);
          setSelectedInvoiceId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this invoice? This action cannot be undone.
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

export default Invoices;