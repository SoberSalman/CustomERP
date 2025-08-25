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
  Alert,
  Skeleton,
  InputAdornment,
  FormControlLabel,
  Switch,
  Breadcrumbs,
  Link,
  Stack,
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
  Business as BusinessIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { supplierApi } from '../services/inventory';
import { Supplier } from '../types/inventory';

const Suppliers: React.FC = () => {
  const { token } = useAuth();
  const { currentTenant } = useTenant();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    tax_number: '',
    payment_terms: '',
    is_active: true,
  });

  useEffect(() => {
    if (token && currentTenant) {
      loadSuppliers();
    }
  }, [token, currentTenant, page, rowsPerPage, searchTerm]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierApi.list({
        page: page + 1,
        search: searchTerm || undefined,
      });
      setSuppliers(response.data.results);
      setTotalCount(response.data.count);
    } catch (err) {
      setError('Failed to load suppliers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, supplierId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedSupplier(supplierId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSupplier(null);
  };

  const handleCreateSupplier = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      postal_code: '',
      tax_number: '',
      payment_terms: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEditSupplier = async () => {
    if (!selectedSupplier) return;
    
    try {
      const response = await supplierApi.get(selectedSupplier);
      setFormData({
        name: response.data.name,
        contact_person: response.data.contact_person || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        country: response.data.country || '',
        postal_code: response.data.postal_code || '',
        tax_number: response.data.tax_number || '',
        payment_terms: response.data.payment_terms || '',
        is_active: response.data.is_active,
      });
      setDialogMode('edit');
      setDialogOpen(true);
    } catch (err) {
      setError('Failed to load supplier details');
    }
    handleMenuClose();
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    
    const supplier = suppliers.find(s => s.id === selectedSupplier);
    if (supplier && supplier.products_count > 0) {
      setError('Cannot delete supplier with existing products. Remove products first.');
      handleMenuClose();
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await supplierApi.delete(selectedSupplier);
        loadSuppliers();
      } catch (err) {
        setError('Failed to delete supplier');
      }
    }
    handleMenuClose();
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        await supplierApi.create(formData);
      } else if (selectedSupplier) {
        await supplierApi.update(selectedSupplier, formData);
      }
      setDialogOpen(false);
      loadSuppliers();
    } catch (err) {
      setError(`Failed to ${dialogMode} supplier`);
    }
  };

  if (loading && suppliers.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Suppliers</Typography>
        {[...Array(5)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={60} sx={{ mb: 1 }} />
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
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => window.location.href = '/products'}
        >
          <InventoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Inventory
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <BusinessIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Suppliers
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Supplier Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your suppliers and vendor relationships for procurement
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadSuppliers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateSupplier}
              size="large"
              sx={{ fontWeight: 'bold' }}
            >
              Add Supplier
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card elevation={0} sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
          <CardContent>
            <Typography color="primary.600" gutterBottom variant="body2" fontWeight="medium">
              Total Suppliers
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {loading ? <Skeleton width={60} /> : totalCount}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
          <CardContent>
            <Typography color="success.600" gutterBottom variant="body2" fontWeight="medium">
              Active Suppliers
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {loading ? <Skeleton width={60} /> : suppliers.filter(s => s.is_active).length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.100' }}>
          <CardContent>
            <Typography color="info.600" gutterBottom variant="body2" fontWeight="medium">
              With Products
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {loading ? <Skeleton width={60} /> : suppliers.filter(s => s.products_count > 0).length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}


      {suppliers.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No suppliers yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add suppliers to manage your product sourcing and purchasing.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateSupplier}
          >
            Add First Supplier
          </Button>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Filters Toolbar */}
          <Toolbar sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
            <BusinessIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
              <TextField
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            </Stack>
          </Toolbar>

          {/* Suppliers Table */}
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Location</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Products</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow 
                    key={supplier.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      '&:last-child td, &:last-child th': { border: 0 }
                    }}
                  >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {supplier.name}
                      </Typography>
                      {supplier.contact_person && (
                        <Typography variant="body2" color="text.secondary">
                          {supplier.contact_person}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {supplier.email && (
                        <Typography variant="body2">{supplier.email}</Typography>
                      )}
                      {supplier.phone && (
                        <Typography variant="body2" color="text.secondary">
                          {supplier.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {[supplier.city, supplier.country].filter(Boolean).join(', ') || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={supplier.products_count}
                      size="small"
                      color={supplier.products_count > 0 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={supplier.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={supplier.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, supplier.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
            
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          </TableContainer>
        </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditSupplier}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteSupplier} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Add New Supplier' : 'Edit Supplier'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Supplier Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Contact Person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                fullWidth
              />
              
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />
              
              <TextField
                label="Tax Number"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                fullWidth
              />
            </Box>

            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                fullWidth
              />
              
              <TextField
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                fullWidth
              />
              
              <TextField
                label="Postal Code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                fullWidth
              />
            </Box>

            <TextField
              label="Payment Terms"
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              placeholder="e.g., Net 30, COD, 2/10 Net 30"
              fullWidth
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name}
          >
            {dialogMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers;