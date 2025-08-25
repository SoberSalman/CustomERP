import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Paper,
} from '@mui/material';
import {
  Business,
  Add,
  PersonAdd,
  TrendingUp,
  People,
  Inventory,
  Receipt,
  AttachMoney,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import MainLayout from '../components/Layout/MainLayout';
import { productApi } from '../services/inventory';
import { ProductStats } from '../types/inventory';
import { customerApi } from '../services/customer';
import { CustomerStats } from '../types/customer';
import salesApi from '../services/sales';
import { SalesStats } from '../types/sales';
import { formatCurrency } from '../utils/currency';

const Dashboard: React.FC = () => {
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createOrgData, setCreateOrgData] = useState({
    name: '',
    legal_name: '',
    email: '',
  });
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'employee',
  });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const { user } = useAuth();
  const {
    userTenants,
    createTenant,
    isLoading,
    error,
    clearError,
  } = useTenant();

  const userOrganization = userTenants.length > 0 ? userTenants[0] : null;

  // Load stats when user has organization and is authenticated
  useEffect(() => {
    const loadStats = async () => {
      if (userOrganization && user) {
        try {
          setStatsLoading(true);
          const [productResponse, customerResponse, salesResponse] = await Promise.all([
            productApi.stats(),
            customerApi.stats(),
            salesApi.stats.get(),
          ]);
          setStats(productResponse.data);
          setCustomerStats(customerResponse.data);
          setSalesStats(salesResponse.data);
        } catch (error) {
          console.error('Failed to load stats:', error);
        } finally {
          setStatsLoading(false);
        }
      }
    };

    loadStats();
  }, [userOrganization, user]);

  const handleCreateOrganization = async () => {
    try {
      clearError();
      await createTenant(createOrgData);
      setCreateOrgDialogOpen(false);
      setCreateOrgData({
        name: '',
        legal_name: '',
        email: '',
      });
    } catch (error) {
      // Error is handled by context
    }
  };

  const handleInviteUser = async () => {
    try {
      setInviteError(null);
      
      const token = localStorage.getItem('auth_token');
      const tenantId = localStorage.getItem('current_tenant_id');
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/tenants/invite/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify(inviteData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }
      
      setInviteSuccess('Invitation sent successfully!');
      setInviteData({ email: '', role: 'employee' });
      setTimeout(() => {
        setInviteDialogOpen(false);
        setInviteSuccess(null);
      }, 2000);
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation');
    }
  };

  const roleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Administrator' },
  ];

  const dashboardStats = [
    {
      title: 'Products',
      value: statsLoading ? '-' : (stats?.total_products?.toString() || '0'),
      icon: <Inventory sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      description: 'Items in catalog'
    },
    {
      title: 'Customers',
      value: statsLoading ? '-' : (customerStats?.total_customers?.toString() || '0'),
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      description: 'Total customers'
    },
    {
      title: 'Sales Orders',
      value: statsLoading ? '-' : (salesStats?.total_orders?.toString() || '0'),
      icon: <Receipt sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      description: 'Total orders'
    },
    {
      title: 'Revenue',
      value: statsLoading ? '-' : formatCurrency(salesStats?.total_revenue || '0', userOrganization?.currency),
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
      description: 'Paid invoices'
    },
  ];

  if (!userOrganization) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
              {error}
            </Alert>
          )}

          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 3 }}>
            <Business sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome to Custom ERP!
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Get started by creating your organization
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              Set up your business profile to begin managing products, customers, and invoices. 
              You'll be able to invite team members and collaborate on your business operations.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setCreateOrgDialogOpen(true)}
              sx={{ 
                py: 1.5, 
                px: 4, 
                fontSize: '1.1rem',
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Create Your Organization
            </Button>
          </Paper>

          {/* Create Organization Dialog */}
          <Dialog
            open={createOrgDialogOpen}
            onClose={() => setCreateOrgDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Create Your Organization</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Organization Name"
                fullWidth
                variant="outlined"
                value={createOrgData.name}
                onChange={(e) =>
                  setCreateOrgData({ ...createOrgData, name: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Legal Name"
                fullWidth
                variant="outlined"
                value={createOrgData.legal_name}
                onChange={(e) =>
                  setCreateOrgData({ ...createOrgData, legal_name: e.target.value })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={createOrgData.email}
                onChange={(e) =>
                  setCreateOrgData({ ...createOrgData, email: e.target.value })
                }
                sx={{ mb: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateOrgDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleCreateOrganization}
                variant="contained"
                disabled={!createOrgData.name || !createOrgData.legal_name || isLoading}
              >
                Create Organization
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        <Stack spacing={4}>
          {/* Welcome Header */}
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome back, {user?.first_name}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening with {userOrganization.name} today.
            </Typography>
          </Box>

          {/* Stats Overview */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
            {dashboardStats.map((stat, index) => (
              <Card key={index} elevation={1} sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.description}
                      </Typography>
                    </Box>
                    <Box sx={{ color: stat.color, opacity: 0.8 }}>
                      {stat.icon}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Quick Actions */}
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Quick Actions
              </Typography>
              
              <List>
                {userOrganization.user_role === 'admin' && (
                  <ListItem divider>
                    <ListItemText 
                      primary="Invite Team Members"
                      secondary="Add employees and managers to your organization"
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PersonAdd />}
                        onClick={() => setInviteDialogOpen(true)}
                        sx={{ borderRadius: 2 }}
                      >
                        Invite
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                )}
                <ListItem divider>
                  <ListItemText 
                    primary="Add Your First Product"
                    secondary="Start building your product catalog"
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" size="small" disabled sx={{ borderRadius: 2 }}>
                      Coming Soon
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="Add Customers"
                    secondary="Manage your customer relationships"
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" size="small" disabled sx={{ borderRadius: 2 }}>
                      Coming Soon
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Create Your First Invoice"
                    secondary="Start billing your customers"
                  />
                  <ListItemSecondaryAction>
                    <Button variant="outlined" size="small" disabled sx={{ borderRadius: 2 }}>
                      Coming Soon
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Card elevation={1} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Organization Details
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Legal Name
                    </Typography>
                    <Typography variant="body1">
                      {userOrganization.legal_name || 'Not specified'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">
                      {userOrganization.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Your Role
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {userOrganization.user_role}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card elevation={1} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Settings
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Currency
                    </Typography>
                    <Typography variant="body1">
                      {userOrganization.currency}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Timezone
                    </Typography>
                    <Typography variant="body1">
                      {userOrganization.timezone}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {new Date(userOrganization.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Stack>

        {/* Invite Team Member Dialog */}
        <Dialog
          open={inviteDialogOpen}
          onClose={() => {
            setInviteDialogOpen(false);
            setInviteError(null);
            setInviteSuccess(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogContent>
            {inviteError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {inviteError}
              </Alert>
            )}
            {inviteSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {inviteSuccess}
              </Alert>
            )}
            
            <TextField
              autoFocus
              margin="dense"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={inviteData.email}
              onChange={(e) =>
                setInviteData({ ...inviteData, email: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Role"
              select
              fullWidth
              variant="outlined"
              value={inviteData.role}
              onChange={(e) =>
                setInviteData({ ...inviteData, role: e.target.value })
              }
              SelectProps={{
                native: true,
              }}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setInviteDialogOpen(false);
              setInviteError(null);
              setInviteSuccess(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              variant="contained"
              disabled={!inviteData.email || isLoading}
            >
              Send Invitation
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MainLayout>
  );
};

export default Dashboard;