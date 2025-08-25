import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tab,
  Tabs,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Breadcrumbs,
  Link,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Assessment as ReportsIcon,
  People as CustomersIcon,
  AttachMoney as RevenueIcon,
  ShoppingCart as OrdersIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { salesStatsApi, invoiceApi } from '../services/sales';
import { productApi, stockApi } from '../services/inventory';
import { customerApi } from '../services/customer';
import { formatCurrency } from '../utils/currency';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}


const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [salesData, setSalesData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [customerData, setCustomerData] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    fetchReportsData();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // Fetch all required data from real APIs
      const [
        statsResponse,
        invoicesResponse,
        productsStatsResponse,
        lowStockResponse,
        customersResponse,
        stockMovementsResponse
      ] = await Promise.all([
        salesStatsApi.get(),
        invoiceApi.list(),
        productApi.stats(),
        productApi.lowStock(),
        customerApi.list(),
        stockApi.movements()
      ]);

      setDashboardStats(statsResponse.data);
      setLowStockItems(lowStockResponse.data || []);
      
      // Process real invoice data for analytics
      await processRealAnalyticsData(
        invoicesResponse.data.results,
        productsStatsResponse.data,
        customersResponse.data.results,
        stockMovementsResponse.data.results || []
      );
      
    } catch (error) {
      console.error('Error fetching reports data:', error);
      // Fallback to basic stats if detailed analytics fail
      try {
        const statsResponse = await salesStatsApi.get();
        setDashboardStats(statsResponse.data);
      } catch (fallbackError) {
        console.error('Error fetching basic stats:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const processRealAnalyticsData = async (invoices: any[], productStats: any, customers: any[], stockMovements: any[]) => {
    // Process real revenue data from invoices
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const revenueByDay = last7Days.map(date => {
      const dayInvoices = invoices.filter(invoice => 
        invoice.invoice_date?.startsWith(date) && invoice.status === 'paid'
      );
      return {
        date: new Date(date).toLocaleDateString(),
        revenue: dayInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0),
        orders: dayInvoices.length,
      };
    });
    setRevenueData(revenueByDay);

    // Process real sales status data
    const statusCounts = invoices.reduce((acc, invoice) => {
      const status = invoice.status || 'draft';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusColors: Record<string, string> = {
      'paid': '#2e7d32',
      'sent': '#1976d2',
      'draft': '#757575',
      'overdue': '#d32f2f',
      'cancelled': '#d32f2f',
    };

    const salesStatusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: statusColors[status] || '#757575',
    }));
    setSalesData(salesStatusData);

    // Process inventory data by category (using real product stats)
    const inventoryByCategory = [
      { 
        category: 'All Products', 
        value: productStats.total_products || 0, 
        low_stock: productStats.low_stock_products || 0 
      }
    ];
    setInventoryData(inventoryByCategory);

    // Process real customer data over time
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date;
    });

    const customerGrowth = last6Months.map(date => {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString().split('T')[0];
      
      const newCustomersThisMonth = customers.filter(customer => 
        customer.created_at >= monthStart && customer.created_at < nextMonth
      ).length;

      return {
        month: date.toLocaleDateString('en', { month: 'short' }),
        new_customers: newCustomersThisMonth,
        active_customers: customers.length, // Total customers up to this point
      };
    });
    setCustomerData(customerGrowth);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link underline="hover" color="inherit" href="/">
          <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <ReportsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Reports & Analytics
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
          Reports & Analytics
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Comprehensive business insights and performance metrics
        </Typography>
      </Box>

      {/* Key Metrics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 4 }}>
        <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {formatCurrency(dashboardStats.total_revenue || 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Revenue
                </Typography>
              </Box>
              <RevenueIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Stack>
          </CardContent>
        </Card>
        
        <Card sx={{ background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {dashboardStats.total_orders || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Orders
                </Typography>
              </Box>
              <OrdersIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {dashboardStats.total_invoices || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Total Invoices
                </Typography>
              </Box>
              <CustomersIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ background: 'linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)', color: 'white' }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {lowStockItems.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Low Stock Items
                </Typography>
              </Box>
              <WarningIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* Date Range Filter */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={dateRange}
            label="Date Range"
            onChange={(e) => setDateRange(e.target.value)}
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 3 months</MenuItem>
            <MenuItem value="365">Last year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Sales Analytics" />
          <Tab label="Inventory Reports" />
          <Tab label="Customer Insights" />
          <Tab label="Financial Summary" />
        </Tabs>

        {/* Sales Analytics Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, mb: 3 }}>
            {/* Revenue Trend */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Trend (Last 7 Days)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as string), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sales Status Distribution */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales by Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {salesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Orders Trend */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Orders
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#2e7d32" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Inventory Reports Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3 }}>
            {/* Inventory by Category */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Inventory by Category
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1976d2" />
                    <Bar dataKey="low_stock" fill="#d32f2f" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon sx={{ mr: 1, color: '#ed6c02' }} />
                  Low Stock Alerts
                </Typography>
                {lowStockItems.map((item, index) => (
                  <Alert 
                    key={index} 
                    severity="warning" 
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="body2">
                      Current: {item.current} | Minimum: {item.minimum}
                    </Typography>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Customer Insights Tab */}
        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Customer Growth Trend
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={customerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="new_customers" stroke="#1976d2" name="New Customers" />
                  <Line type="monotone" dataKey="active_customers" stroke="#2e7d32" name="Active Customers" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Financial Summary Tab */}
        <TabPanel value={activeTab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Summary
              </Typography>
              <Box sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Comprehensive financial reports will be available here, including:
                </Typography>
                <ul>
                  <li>Profit & Loss statements</li>
                  <li>Cash flow analysis</li>
                  <li>Accounts receivable aging</li>
                  <li>Expense categorization</li>
                  <li>Tax summaries</li>
                </ul>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Reports;