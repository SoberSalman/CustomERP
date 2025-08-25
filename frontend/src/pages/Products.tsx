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
  Inventory as InventoryIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { productApi, categoryApi } from '../services/inventory';
import { ProductListItem, Category, ProductCreateUpdate } from '../types/inventory';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

const Products: React.FC = () => {
  const { token } = useAuth();
  const { currentTenant } = useTenant();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<ProductCreateUpdate>({
    name: '',
    description: '',
    barcode: '',
    product_type: 'physical',
    category: '',
    cost_price: '0.00',
    selling_price: '0.00',
    track_inventory: true,
    current_stock: 0,
    minimum_stock: 0,
    maximum_stock: undefined,
    weight: '',
    dimensions: '',
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    if (token && currentTenant) {
      loadProducts();
      loadCategories();
    }
  }, [token, currentTenant, page, rowsPerPage, searchTerm, selectedCategory, selectedStatus]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productApi.list({
        page: page + 1,
        search: searchTerm || undefined,
        category: selectedCategory || undefined,
        stock_status: selectedStatus || undefined,
      });
      setProducts(response.data.results);
      setTotalCount(response.data.count);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryApi.list();
      setCategories(response.data.results);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, productId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(productId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleCreateProduct = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
      barcode: '',
      product_type: 'physical',
      category: '',
      cost_price: '0.00',
      selling_price: '0.00',
      track_inventory: true,
      current_stock: 0,
      minimum_stock: 0,
      maximum_stock: undefined,
      weight: '',
      dimensions: '',
      is_active: true,
      is_featured: false,
    });
    setDialogOpen(true);
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const response = await productApi.get(selectedProduct);
      setFormData({
        name: response.data.name,
        description: response.data.description || '',
        barcode: response.data.barcode || '',
        product_type: response.data.product_type,
        category: response.data.category,
        cost_price: response.data.cost_price,
        selling_price: response.data.selling_price,
        track_inventory: response.data.track_inventory,
        current_stock: response.data.current_stock,
        minimum_stock: response.data.minimum_stock,
        maximum_stock: response.data.maximum_stock || undefined,
        weight: response.data.weight || '',
        dimensions: response.data.dimensions || '',
        is_active: response.data.is_active,
        is_featured: response.data.is_featured,
      });
      setDialogMode('edit');
      setDialogOpen(true);
    } catch (err) {
      setError('Failed to load product details');
    }
    handleMenuClose();
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productApi.delete(selectedProduct);
        loadProducts();
      } catch (err) {
        setError('Failed to delete product');
      }
    }
    handleMenuClose();
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        await productApi.create(formData);
      } else if (selectedProduct) {
        await productApi.update(selectedProduct, formData);
      }
      setDialogOpen(false);
      loadProducts();
    } catch (err) {
      setError(`Failed to ${dialogMode} product`);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'success';
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && products.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Products</Typography>
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
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color="text.primary"
        >
          <InventoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Products
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Product Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your product catalog, inventory levels, and pricing
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                loadProducts();
                loadCategories();
              }}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateProduct}
              size="large"
              sx={{ fontWeight: 'bold' }}
            >
              Add Product
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card elevation={0} sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
          <CardContent>
            <Typography color="primary.600" gutterBottom variant="body2" fontWeight="medium">
              Total Products
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {loading ? <Skeleton width={60} /> : totalCount}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
          <CardContent>
            <Typography color="success.600" gutterBottom variant="body2" fontWeight="medium">
              In Stock
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {loading ? <Skeleton width={60} /> : products.filter(p => p.stock_status === 'in_stock').length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.100' }}>
          <CardContent>
            <Typography color="warning.600" gutterBottom variant="body2" fontWeight="medium">
              Low Stock
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {loading ? <Skeleton width={60} /> : products.filter(p => p.stock_status === 'low_stock').length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.100' }}>
          <CardContent>
            <Typography color="error.600" gutterBottom variant="body2" fontWeight="medium">
              Out of Stock
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="error.main">
              {loading ? <Skeleton width={60} /> : products.filter(p => p.stock_status === 'out_of_stock').length}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Filters Toolbar */}
        <Toolbar sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
          <FilterListIcon sx={{ mr: 2, color: 'text.secondary' }} />
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <TextField
              placeholder="Search products..."
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
            
            <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
            <InputLabel>Stock Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              label="Stock Status"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="in_stock">In Stock</MenuItem>
              <MenuItem value="low_stock">Low Stock</MenuItem>
              <MenuItem value="out_of_stock">Out of Stock</MenuItem>
            </Select>
          </FormControl>
          </Stack>
        </Toolbar>

        {/* Products Table */}
        <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>SKU</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Price</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Stock</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow 
                key={product.id}
                sx={{ 
                  '&:hover': { bgcolor: 'grey.50' },
                  '&:last-child td, &:last-child th': { border: 0 }
                }}
              >
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body1" fontWeight="medium" color="text.primary">
                      {product.name}
                    </Typography>
                    {product.is_featured && (
                      <Chip label="Featured" size="small" color="primary" sx={{ width: 'fit-content' }} />
                    )}
                  </Stack>
                </TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>
                  <Chip
                    label={product.category_name}
                    size="small"
                    style={{ backgroundColor: product.category_color, color: 'white' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" textTransform="capitalize">
                    {product.product_type}
                  </Typography>
                </TableCell>
                <TableCell align="right">{formatCurrency(product.selling_price, currentTenant?.currency)}</TableCell>
                <TableCell align="right">
                  {product.track_inventory ? `${product.current_stock}` : 'N/A'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={product.stock_status_display}
                    size="small"
                    color={getStockStatusColor(product.stock_status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    onClick={(e) => handleMenuClick(e, product.id)}
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

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditProduct}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteProduct} sx={{ color: 'error.main' }}>
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
          {dialogMode === 'create' ? 'Add New Product' : 'Edit Product'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value as any })}
                  label="Type"
                >
                  <MenuItem value="physical">Physical</MenuItem>
                  <MenuItem value="digital">Digital</MenuItem>
                  <MenuItem value="service">Service</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Cost Price"
                type="number"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">{getCurrencySymbol(currentTenant?.currency)}</InputAdornment> }}
              />
              
              <TextField
                label="Selling Price"
                type="number"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                required
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">{getCurrencySymbol(currentTenant?.currency)}</InputAdornment> }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.track_inventory}
                  onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
                />
              }
              label="Track Inventory"
            />

            {formData.track_inventory && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Current Stock"
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
                
                <TextField
                  label="Minimum Stock"
                  type="number"
                  value={formData.minimum_stock}
                  onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                }
                label="Featured"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.category}
          >
            {dialogMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;