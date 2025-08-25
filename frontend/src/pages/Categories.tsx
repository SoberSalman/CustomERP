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
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Skeleton,
  FormControlLabel,
  Switch,
  Breadcrumbs,
  Link,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Category as CategoryIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
// Color picker component will be replaced with HTML input
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { categoryApi } from '../services/inventory';
import { Category } from '../types/inventory';

const Categories: React.FC = () => {
  const { token } = useAuth();
  const { currentTenant } = useTenant();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#2196f3',
    is_active: true,
  });

  useEffect(() => {
    if (token && currentTenant) {
      loadCategories();
    }
  }, [token, currentTenant]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryApi.list();
      setCategories(response.data.results);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, categoryId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategory(categoryId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const handleCreateCategory = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
      color: '#2196f3',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEditCategory = () => {
    if (!selectedCategory) return;
    
    const category = categories.find(c => c.id === selectedCategory);
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color,
        is_active: category.is_active,
      });
      setDialogMode('edit');
      setDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    const category = categories.find(c => c.id === selectedCategory);
    if (category && category.product_count > 0) {
      setError('Cannot delete category with existing products. Move products to another category first.');
      handleMenuClose();
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoryApi.delete(selectedCategory);
        loadCategories();
      } catch (err) {
        setError('Failed to delete category');
      }
    }
    handleMenuClose();
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        await categoryApi.create(formData);
      } else if (selectedCategory) {
        await categoryApi.update(selectedCategory, formData);
      }
      setDialogOpen(false);
      loadCategories();
    } catch (err) {
      setError(`Failed to ${dialogMode} category`);
    }
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, color: event.target.value });
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Categories</Typography>
        {[...Array(3)].map((_, index) => (
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
          <CategoryIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Categories
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Category Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Organize your products into categories for better navigation and management
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadCategories}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateCategory}
              size="large"
              sx={{ fontWeight: 'bold' }}
            >
              Add Category
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Card elevation={0} sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
          <CardContent>
            <Typography color="primary.600" gutterBottom variant="body2" fontWeight="medium">
              Total Categories
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {loading ? <Skeleton width={60} /> : categories.length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
          <CardContent>
            <Typography color="success.600" gutterBottom variant="body2" fontWeight="medium">
              Active Categories
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {loading ? <Skeleton width={60} /> : categories.filter(c => c.is_active).length}
            </Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.100' }}>
          <CardContent>
            <Typography color="info.600" gutterBottom variant="body2" fontWeight="medium">
              Total Products
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {loading ? <Skeleton width={60} /> : categories.reduce((sum, c) => sum + c.product_count, 0)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {categories.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No categories yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first product category to get started organizing your inventory.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateCategory}
          >
            Add First Category
          </Button>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Description</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Products</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'text.primary' }}>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow 
                  key={category.id}
                  sx={{ 
                    '&:hover': { bgcolor: 'grey.50' },
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: 1,
                          backgroundColor: category.color,
                        }}
                      />
                      <Typography variant="body2" fontWeight="medium">
                        {category.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {category.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={category.product_count}
                      size="small"
                      color={category.product_count > 0 ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={category.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={category.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, category.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </Paper>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditCategory}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteCategory} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Add New Category' : 'Edit Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Category Name"
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

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    backgroundColor: formData.color,
                    border: 1,
                    borderColor: 'divider',
                  }}
                />
                <input
                  type="color"
                  value={formData.color}
                  onChange={handleColorChange}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                />
                <TextField
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  size="small"
                  sx={{ width: 100 }}
                />
              </Box>
            </Box>

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

export default Categories;