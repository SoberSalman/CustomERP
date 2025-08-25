import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Inventory,
  People,
  Receipt,
  Analytics,
  Settings,
  AccountCircle,
  ExitToApp,
  Business,
  PersonAdd,
  Home,
  Category,
  LocalShipping,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [inventoryExpanded, setInventoryExpanded] = useState(true);
  const [salesExpanded, setSalesExpanded] = useState(true);
  
  const { user, logout } = useAuth();
  const { userTenants } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();

  const userOrganization = userTenants.length > 0 ? userTenants[0] : null;
  const isAdmin = userOrganization?.user_role === 'admin';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      color: '#1976d2',
    },
    {
      text: 'Inventory',
      icon: <Inventory />,
      path: '/inventory',
      color: '#2e7d32',
      expandable: true,
      section: 'inventory',
      subItems: [
        {
          text: 'Products',
          icon: <Inventory />,
          path: '/products',
        },
        {
          text: 'Categories',
          icon: <Category />,
          path: '/categories',
        },
        {
          text: 'Suppliers',
          icon: <LocalShipping />,
          path: '/suppliers',
        },
      ],
    },
    {
      text: 'Customers',
      icon: <People />,
      path: '/customers',
      color: '#ed6c02',
    },
    {
      text: 'Sales',
      icon: <Receipt />,
      path: '/sales',
      color: '#9c27b0',
      expandable: true,
      section: 'sales',
      subItems: [
        {
          text: 'Sales Orders',
          icon: <Receipt />,
          path: '/sales-orders',
        },
        {
          text: 'Invoices',
          icon: <Receipt />,
          path: '/invoices',
        },
        {
          text: 'Payments',
          icon: <Receipt />,
          path: '/payments',
        },
      ],
    },
    {
      text: 'Reports & Analytics',
      icon: <Analytics />,
      path: '/reports',
      color: '#d32f2f',
    },
  ];

  const adminMenuItems = [
    {
      text: 'Team Members',
      icon: <PersonAdd />,
      path: '/team',
      color: '#0288d1',
      comingSoon: true,
    },
    {
      text: 'Organization Settings',
      icon: <Settings />,
      path: '/settings',
      color: '#5d4037',
      comingSoon: true,
    },
  ];

  const handleNavigation = (path: string, comingSoon?: boolean, expandable?: boolean, section?: string) => {
    if (comingSoon) {
      return; // Don't navigate for coming soon items
    }
    if (expandable) {
      if (section === 'inventory') {
        setInventoryExpanded(!inventoryExpanded);
      } else if (section === 'sales') {
        setSalesExpanded(!salesExpanded);
      }
      return;
    }
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Organization Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        {userOrganization ? (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Business fontSize="large" />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {userOrganization.name}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {userOrganization.legal_name}
            </Typography>
            <Chip
              label={userOrganization.user_role}
              size="small"
              sx={{ 
                mt: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '& .MuiChip-label': {
                  textTransform: 'capitalize'
                }
              }}
            />
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Home fontSize="large" sx={{ mb: 1 }} />
            <Typography variant="h6">Custom ERP</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              No Organization
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Main Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ pt: 2 }}>
          {menuItems.map((item) => (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path, (item as any).comingSoon, item.expandable, (item as any).section)}
                  selected={!item.expandable && location.pathname === item.path}
                  disabled={(item as any).comingSoon && !item.expandable}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: `${item.color}20`,
                      borderLeft: `4px solid ${item.color}`,
                      '& .MuiListItemIcon-root': {
                        color: item.color,
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: 'bold',
                        color: item.color,
                      },
                    },
                    '&:hover': {
                      bgcolor: (item as any).comingSoon && !item.expandable ? 'transparent' : `${item.color}10`,
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: (item as any).comingSoon && !item.expandable ? 'text.disabled' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text}
                    secondary={(item as any).comingSoon && !item.expandable ? 'Coming Soon' : undefined}
                    sx={{
                      '& .MuiListItemText-primary': {
                        color: (item as any).comingSoon && !item.expandable ? 'text.disabled' : 'text.primary',
                      },
                      '& .MuiListItemText-secondary': {
                        fontSize: '0.75rem',
                        color: 'text.disabled',
                      },
                    }}
                  />
                  {item.expandable && (
                    (item.section === 'inventory' ? inventoryExpanded : salesExpanded) ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItemButton>
              </ListItem>
              
              {/* Sub-items */}
              {item.expandable && item.subItems && (item.section === 'inventory' ? inventoryExpanded : salesExpanded) && (
                <List sx={{ pl: 2 }}>
                  {item.subItems.map((subItem) => {
                    const isSelected = location.pathname === subItem.path;
                    return (
                      <ListItem key={subItem.text} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                          onClick={() => handleNavigation(subItem.path)}
                          selected={isSelected}
                          sx={{
                            mx: 1,
                            borderRadius: 2,
                            '&.Mui-selected': {
                              bgcolor: `${item.color}20`,
                              borderLeft: `4px solid ${item.color}`,
                              '& .MuiListItemIcon-root': {
                                color: item.color,
                              },
                              '& .MuiListItemText-primary': {
                                fontWeight: 'bold',
                                color: item.color,
                              },
                            },
                            '&:hover': {
                              bgcolor: `${item.color}10`,
                            },
                          }}
                        >
                          <ListItemIcon sx={{ color: isSelected ? item.color : 'text.secondary' }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={subItem.text}
                            sx={{
                              '& .MuiListItemText-primary': {
                                fontSize: '0.9rem',
                              },
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </React.Fragment>
          ))}
        </List>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <Divider sx={{ mx: 2, my: 2 }} />
            <Typography 
              variant="overline" 
              sx={{ px: 3, color: 'text.secondary', fontWeight: 'bold' }}
            >
              Administration
            </Typography>
            <List>
              {adminMenuItems.map((item) => (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path, (item as any).comingSoon)}
                    selected={location.pathname === item.path}
                    disabled={(item as any).comingSoon}
                    sx={{
                      mx: 1,
                      borderRadius: 2,
                      '&.Mui-selected': {
                        bgcolor: `${item.color}20`,
                        borderLeft: `4px solid ${item.color}`,
                        '& .MuiListItemIcon-root': {
                          color: item.color,
                        },
                        '& .MuiListItemText-primary': {
                          fontWeight: 'bold',
                          color: item.color,
                        },
                      },
                      '&:hover': {
                        bgcolor: (item as any).comingSoon ? 'transparent' : `${item.color}10`,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: (item as any).comingSoon ? 'text.disabled' : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      secondary={(item as any).comingSoon ? 'Coming Soon' : undefined}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: (item as any).comingSoon ? 'text.disabled' : 'text.primary',
                        },
                        '& .MuiListItemText-secondary': {
                          fontSize: '0.75rem',
                          color: 'text.disabled',
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>

      {/* User Info at Bottom */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block'
              }}
            >
              {user?.email}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {userOrganization ? userOrganization.name : 'Custom ERP'}
          </Typography>

          <IconButton
            size="large"
            aria-label="account menu"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose} disabled>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {user?.first_name} {user?.last_name}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleMenuClose} disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'grey.50',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;