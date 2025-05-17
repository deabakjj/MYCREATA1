import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  IconButton, 
  Typography, 
  Menu, 
  MenuItem, 
  Container, 
  Avatar, 
  Button, 
  Tooltip, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  useMediaQuery,
  useTheme,
  Badge
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon,
  Person as ProfileIcon,
  Assignment as MissionIcon,
  Collections as NftIcon,
  CurrencyExchange as TokenIcon,
  Logout as LogoutIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useToken } from '../../context/TokenContext';

const drawerWidth = 240;

/**
 * 메인 레이아웃 컴포넌트
 * 
 * 앱의 공통 레이아웃을 정의합니다.
 * 네비게이션 바, 사이드바, 푸터를 포함합니다.
 */
const Layout = () => {
  const { user, logout } = useAuth();
  const { balance } = useToken();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotification, setAnchorElNotification] = useState(null);
  
  // 알림 데이터 예시
  const notifications = [
    { id: 1, message: '새로운 미션이 추가되었습니다.', read: false },
    { id: 2, message: 'NFT 보상이 지급되었습니다.', read: false },
    { id: 3, message: '1,000 NEST 토큰이 지급되었습니다.', read: true }
  ];
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // 모바일 메뉴 토글
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // 사용자 메뉴 열기
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  
  // 사용자 메뉴 닫기
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  // 알림 메뉴 열기
  const handleOpenNotificationMenu = (event) => {
    setAnchorElNotification(event.currentTarget);
  };
  
  // 알림 메뉴 닫기
  const handleCloseNotificationMenu = () => {
    setAnchorElNotification(null);
  };
  
  // 로그아웃 처리
  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate('/');
  };
  
  // 네비게이션 항목
  const navItems = user ? [
    { label: '대시보드', path: '/dashboard', icon: <DashboardIcon /> },
    { label: '프로필', path: '/profile', icon: <ProfileIcon /> },
    { label: '미션', path: '/missions', icon: <MissionIcon /> },
    { label: 'NFT 컬렉션', path: '/nfts', icon: <NftIcon /> },
    { label: '토큰 스왑', path: '/tokens/swap', icon: <TokenIcon /> }
  ] : [
    { label: '홈', path: '/', icon: null }
  ];
  
  // 사이드바 내용
  const drawer = (
    <Box sx={{ width: drawerWidth }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            textDecoration: 'none',
            mb: 2
          }}
        >
          NEST 플랫폼
        </Typography>
        
        {user && (
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Avatar
              alt={user.name}
              src={user.profileImage}
              sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.nestId || user.email}
            </Typography>
            {balance && (
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                {balance.toLocaleString()} NEST
              </Typography>
            )}
          </Box>
        )}
      </Box>
      
      <Divider />
      
      <List>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* 앱바 */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* 모바일 메뉴 아이콘 */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            {/* 로고 (데스크톱) */}
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none'
              }}
            >
              NEST 플랫폼
            </Typography>
            
            {/* 로고 (모바일) */}
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontWeight: 700,
                color: 'primary.main',
                textDecoration: 'none'
              }}
            >
              NEST
            </Typography>
            
            {/* 주 메뉴 (데스크톱) */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={Link}
                  to={item.path}
                  sx={{
                    my: 2,
                    color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                    display: 'block',
                    fontWeight: location.pathname === item.path ? 'bold' : 'medium'
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
            
            {/* 알림 아이콘 */}
            {user && (
              <Box sx={{ flexGrow: 0, mr: 2 }}>
                <Tooltip title="알림">
                  <IconButton onClick={handleOpenNotificationMenu} sx={{ p: 0 }}>
                    <Badge badgeContent={unreadCount} color="error">
                      <NotificationIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="notification-menu"
                  anchorEl={anchorElNotification}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElNotification)}
                  onClose={handleCloseNotificationMenu}
                >
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <MenuItem key={notification.id} onClick={handleCloseNotificationMenu}>
                        <Typography
                          textAlign="center"
                          sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                        >
                          {notification.message}
                        </Typography>
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem onClick={handleCloseNotificationMenu}>
                      <Typography textAlign="center">알림이 없습니다</Typography>
                    </MenuItem>
                  )}
                </Menu>
              </Box>
            )}
            
            {/* 사용자 메뉴 */}
            {user ? (
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="계정 설정">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar alt={user.name} src={user.profileImage} />
                  </IconButton>
                </Tooltip>
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem onClick={() => {
                    handleCloseUserMenu();
                    navigate('/profile');
                  }}>
                    <ListItemIcon>
                      <ProfileIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography textAlign="center">내 프로필</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography textAlign="center">로그아웃</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/login')}
              >
                로그인
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* 사이드바 */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* 모바일 드로어 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // 모바일 성능 향상
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* 데스크톱 드로어 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* 메인 컨텐츠 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // 앱바 높이
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
