import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Tooltip,
  Divider,
  Avatar
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import api from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all'
  });

  // 사용자 데이터 로드
  const loadUsers = async () => {
    setLoading(true);
    try {
      // 실제 API 연결 - 현재는 목업 데이터 사용
      // const response = await api.get('/users');
      // const data = response.data;
      
      // 목업 데이터
      const mockData = [
        {
          id: 1,
          name: '김지훈',
          email: 'jihoon.kim@example.com',
          profileImage: '',
          socialProvider: 'google',
          role: 'user',
          isActive: true,
          level: 12,
          xp: 1205,
          walletAddress: '0x8f7492d8d29b34d7c3ab1a06b5b798a473b356ae',
          nestId: 'jihoon.nest',
          tokenBalance: 1520,
          nftCount: 3,
          registerDate: '2025-03-15',
          lastLogin: '2025-05-15'
        },
        {
          id: 2,
          name: '이지영',
          email: 'jiyoung.lee@example.com',
          profileImage: '',
          socialProvider: 'kakao',
          role: 'user',
          isActive: true,
          level: 8,
          xp: 780,
          walletAddress: '0x9c7362d8d29b34d7c3ab1a06b5b798a473b983bc',
          nestId: 'jiyoung.nest',
          tokenBalance: 850,
          nftCount: 2,
          registerDate: '2025-04-02',
          lastLogin: '2025-05-14'
        },
        {
          id: 3,
          name: '박민수',
          email: 'minsu.park@example.com',
          profileImage: '',
          socialProvider: 'local',
          role: 'admin',
          isActive: true,
          level: 20,
          xp: 2100,
          walletAddress: '0x3a6482d8d29b34d7c3ab1a06b5b798a473b789de',
          nestId: 'minsu.nest',
          tokenBalance: 5000,
          nftCount: 8,
          registerDate: '2025-02-28',
          lastLogin: '2025-05-16'
        },
        {
          id: 4,
          name: '최유진',
          email: 'yujin.choi@example.com',
          profileImage: '',
          socialProvider: 'apple',
          role: 'user',
          isActive: false,
          level: 5,
          xp: 450,
          walletAddress: '0x5e7612d8d29b34d7c3ab1a06b5b798a473b321ef',
          nestId: 'yujin.nest',
          tokenBalance: 300,
          nftCount: 1,
          registerDate: '2025-04-18',
          lastLogin: '2025-05-01'
        },
        {
          id: 5,
          name: '정대현',
          email: 'daehyun.jung@example.com',
          profileImage: '',
          socialProvider: 'google',
          role: 'user',
          isActive: true,
          level: 15,
          xp: 1570,
          walletAddress: '0x2b8942d8d29b34d7c3ab1a06b5b798a473b654cc',
          nestId: 'daehyun.nest',
          tokenBalance: 2200,
          nftCount: 5,
          registerDate: '2025-03-22',
          lastLogin: '2025-05-16'
        }
      ];
      
      setUsers(mockData);
    } catch (error) {
      console.error('사용자 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시, 데이터 로드
  useEffect(() => {
    loadUsers();
  }, []);

  // 사용자 상태 변경 처리
  const handleToggleStatus = async (id) => {
    try {
      const userToUpdate = users.find(user => user.id === id);
      const newStatus = !userToUpdate.isActive;
      
      // API 호출 (목업)
      // await api.patch(`/users/${id}`, { isActive: newStatus });
      
      const updatedUsers = users.map(user => 
        user.id === id 
          ? { ...user, isActive: newStatus } 
          : user
      );
      
      setUsers(updatedUsers);
    } catch (error) {
      console.error('사용자 상태 변경 오류:', error);
    }
  };

  // 검색 및 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    // 검색어 필터링
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.nestId && user.nestId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 상태 필터링
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && user.isActive) ||
                         (filters.status === 'inactive' && !user.isActive);
    
    // 역할 필터링
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // DataGrid 열 정의
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'name', 
      headerName: '이름', 
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ width: 30, height: 30, mr: 1 }}
            src={params.row.profileImage}
          >
            {params.row.name.charAt(0)}
          </Avatar>
          {params.row.name}
        </Box>
      )
    },
    { field: 'email', headerName: '이메일', flex: 1, minWidth: 200 },
    { 
      field: 'socialProvider', 
      headerName: '로그인 방식', 
      width: 120,
      renderCell: (params) => {
        const providerColors = {
          local: '#2196f3',
          google: '#ea4335',
          kakao: '#ffcd00',
          apple: '#000000'
        };
        
        const providerLabels = {
          local: '이메일',
          google: 'Google',
          kakao: 'Kakao',
          apple: 'Apple'
        };
        
        return (
          <Chip 
            label={providerLabels[params.value] || params.value}
            size="small"
            sx={{ 
              bgcolor: `${providerColors[params.value]}20`, 
              color: providerColors[params.value],
              fontWeight: 'medium'
            }}
          />
        );
      }
    },
    { 
      field: 'role', 
      headerName: '역할', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'admin' ? '관리자' : '사용자'}
          size="small"
          color={params.value === 'admin' ? 'primary' : 'default'}
          variant={params.value === 'admin' ? 'filled' : 'outlined'}
        />
      )
    },
    { 
      field: 'isActive', 
      headerName: '상태', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? '활성' : '비활성'}
          size="small"
          color={params.value ? 'success' : 'error'}
          variant={params.value ? 'filled' : 'outlined'}
        />
      )
    },
    { 
      field: 'level', 
      headerName: '레벨', 
      width: 100,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Lv.{params.value}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {params.row.xp} XP
          </Typography>
        </Box>
      )
    },
    { 
      field: 'nestId', 
      headerName: 'Nest ID', 
      width: 150,
    },
    { 
      field: 'tokenBalance', 
      headerName: 'NEST 토큰', 
      width: 120,
      renderCell: (params) => params.value.toLocaleString()
    },
    { 
      field: 'nftCount', 
      headerName: 'NFT 보유', 
      width: 120,
      renderCell: (params) => params.value.toLocaleString()
    },
    { 
      field: 'lastLogin', 
      headerName: '최근 로그인', 
      width: 150,
    },
    {
      field: 'actions',
      headerName: '관리',
      sortable: false,
      width: 150,
      renderCell: (params) => (
        <Box>
          <Tooltip title="상세 보기">
            <IconButton
              color="info"
              size="small"
              onClick={() => console.log('사용자 상세 보기:', params.row)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="편집">
            <IconButton
              color="primary"
              size="small"
              onClick={() => console.log('사용자 편집:', params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.isActive ? '비활성화' : '활성화'}>
            <IconButton
              color={params.row.isActive ? 'error' : 'success'}
              size="small"
              onClick={() => handleToggleStatus(params.row.id)}
            >
              {params.row.isActive ? 
                <BlockIcon fontSize="small" /> : 
                <CheckCircleIcon fontSize="small" />
              }
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          사용자 관리
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadUsers}
        >
          새로고침
        </Button>
      </Box>
      
      {/* 검색 및 필터링 */}
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="사용자 검색"
              placeholder="이름, 이메일, Nest ID로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>상태</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="상태"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="active">활성</MenuItem>
                  <MenuItem value="inactive">비활성</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>역할</InputLabel>
                <Select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  label="역할"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="admin">관리자</MenuItem>
                  <MenuItem value="user">사용자</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid>
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  status: 'all',
                  role: 'all'
                });
                loadUsers();
              }}
            >
              초기화
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 사용자 목록 */}
      <Paper elevation={0} sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          loading={loading}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
            }
          }}
        />
      </Paper>
    </Box>
  );
};

export default UserManagement;
