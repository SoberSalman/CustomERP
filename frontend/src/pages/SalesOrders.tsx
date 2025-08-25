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
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import salesApi from '../services/sales';
import {
  SalesOrderListItem,
  SalesFilters,
  SALES_ORDER_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
} from '../types/sales';
import SalesOrderFormDialog from '../components/SalesOrderFormDialog';
import InvoiceFormDialog from '../components/InvoiceFormDialog';

const SalesOrders: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [invoiceSalesOrderId, setInvoiceSalesOrderId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { enqueueSnackbar } = useSnackbar();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const searchFilters: SalesFilters = {
        ...filters,
        search: searchTerm || undefined,
      };

      const response = await salesApi.orders.list(searchFilters);
      setOrders(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      enqueueSnackbar('Failed to fetch sales orders', { variant: 'error' });
      console.error('Error fetching sales orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, filters]);

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleFilterChange = (key: keyof SalesFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setPage(1);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, orderId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderId(orderId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrderId(null);
  };

  const handleEdit = () => {
    if (selectedOrderId) {
      setFormOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    // Keep the selectedOrderId for the delete operation
    setDeleteDialogOpen(true);
    setAnchorEl(null); // Only close the menu, don't reset selectedOrderId
  };

  const confirmDelete = async () => {
    if (selectedOrderId) {
      try {
        await salesApi.orders.delete(selectedOrderId);
        enqueueSnackbar('Sales order deleted successfully', { variant: 'success' });
        fetchOrders();
      } catch (error) {
        enqueueSnackbar('Failed to delete sales order', { variant: 'error' });
        console.error('Error deleting sales order:', error);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedOrderId(null);
  };

  const handleConfirm = async (orderId: number) => {
    try {
      await salesApi.orders.confirm(orderId);
      enqueueSnackbar('Sales order confirmed successfully', { variant: 'success' });
      fetchOrders();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to confirm sales order';
      enqueueSnackbar(message, { variant: 'error' });
    }
    handleMenuClose();
  };

  const handleCancel = async (orderId: number) => {
    try {
      await salesApi.orders.cancel(orderId);
      enqueueSnackbar('Sales order cancelled successfully', { variant: 'success' });
      fetchOrders();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to cancel sales order';
      enqueueSnackbar(message, { variant: 'error' });
    }
    handleMenuClose();
  };

  const handleCreateInvoice = (orderId: number) => {
    setInvoiceSalesOrderId(orderId);
    setInvoiceFormOpen(true);
    handleMenuClose();
  };

  const getStatusColor = (status: string): string => {
    const statusOption = SALES_ORDER_STATUS_OPTIONS.find(option => option.value === status);
    return statusOption?.color || '#9e9e9e';
  };

  const getPriorityColor = (priority: string): string => {
    const priorityOption = PRIORITY_OPTIONS.find(option => option.value === priority);
    return priorityOption?.color || '#2196f3';
  };

  const selectedOrder = orders.find(order => order.id === selectedOrderId);

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
          Sales Orders
        </Typography>
      </Breadcrumbs>
      {/* Page Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Sales Order Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track and manage all sales orders from creation to fulfillment
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOrders}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedOrderId(null);
                setFormOpen(true);
              }}
              size="large"
              sx={{ fontWeight: 'bold' }}
            >
              Create Sales Order
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card elevation={0} sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
          <CardContent>
            <Typography color="primary.600" gutterBottom variant="body2" fontWeight="medium">
              Total Orders
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {loading ? '...' : totalCount}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
          <CardContent>
            <Typography color="success.600" gutterBottom variant="body2" fontWeight="medium">
              Confirmed
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {loading ? '...' : orders.filter(o => o.status === 'confirmed').length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.100' }}>
          <CardContent>
            <Typography color="warning.600" gutterBottom variant="body2" fontWeight="medium">
              Draft Orders
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {loading ? '...' : orders.filter(o => o.status === 'draft').length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.100' }}>
          <CardContent>
            <Typography color="info.600" gutterBottom variant="body2" fontWeight="medium">
              Delivered
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {loading ? '...' : orders.filter(o => o.status === 'delivered').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>


      {loading ? (
        <Alert severity="info">Loading sales orders...</Alert>
      ) : orders.length === 0 ? (
        <Alert severity="info">No sales orders found.</Alert>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Filters Toolbar */}
          <Toolbar sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <FilterListIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
              <TextField
                placeholder="Search orders..."
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
                  {SALES_ORDER_STATUS_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority || ''}
                  label="Priority"
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <MenuItem value="">All Priority</MenuItem>
                  {PRIORITY_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Toolbar>

          {/* Sales Orders Table */}
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Order Number</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Order Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Priority</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Items</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      '&:last-child td, &:last-child th': { border: 0 }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{formatDate(order.order_date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={SALES_ORDER_STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(order.status),
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={PRIORITY_OPTIONS.find(p => p.value === order.priority)?.label || order.priority}
                        size="small"
                        sx={{
                          backgroundColor: getPriorityColor(order.priority),
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                        {formatCurrency(order.total_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.items_count} items
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="More actions">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, order.id)}
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
        <MenuItem onClick={() => console.log('View order', selectedOrderId)}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          View
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit
        </MenuItem>
        {selectedOrder?.status === 'draft' && (
          <MenuItem onClick={() => selectedOrderId && handleConfirm(selectedOrderId)}>
            <CheckCircleIcon sx={{ mr: 1 }} fontSize="small" />
            Confirm
          </MenuItem>
        )}
        {selectedOrder?.status && !['cancelled', 'delivered'].includes(selectedOrder.status) && (
          <MenuItem onClick={() => selectedOrderId && handleCancel(selectedOrderId)}>
            <CancelIcon sx={{ mr: 1 }} fontSize="small" />
            Cancel
          </MenuItem>
        )}
        {selectedOrder?.status === 'confirmed' && (
          <MenuItem onClick={() => selectedOrderId && handleCreateInvoice(selectedOrderId)}>
            <ReceiptIcon sx={{ mr: 1 }} fontSize="small" />
            Create Invoice
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete
        </MenuItem>
      </Menu>

      {/* Sales Order Form Dialog */}
      <SalesOrderFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedOrderId(null);
        }}
        orderId={selectedOrderId}
        onSuccess={() => {
          fetchOrders();
          setFormOpen(false);
          setSelectedOrderId(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this sales order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Form Dialog */}
      <InvoiceFormDialog
        open={invoiceFormOpen}
        onClose={() => {
          setInvoiceFormOpen(false);
          setInvoiceSalesOrderId(null);
        }}
        salesOrderId={invoiceSalesOrderId}
        onSuccess={() => {
          setInvoiceFormOpen(false);
          setInvoiceSalesOrderId(null);
          fetchOrders(); // Refresh the list
          enqueueSnackbar('Invoice created successfully', { variant: 'success' });
        }}
      />
    </Box>
  );
};

export default SalesOrders;