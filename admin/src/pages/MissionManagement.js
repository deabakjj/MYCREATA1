import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import api from '../services/api';

const MissionManagement = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('create'); // 'create', 'edit', 'delete', 'view'
  const [selectedMission, setSelectedMission] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    difficulty: 'medium',
    xpReward: 0,
    tokenReward: 0,
    nftReward: false,
    status: 'active'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    difficulty: 'all'
  });

  // 미션 데이터 로드
  const loadMissions = async () => {
    setLoading(true);
    try {
      // 실제 API 연결 - 현재는 목업 데이터 사용
      // const response = await api.get('/missions');
      // const data = response.data;
      
      // 목업 데이터
      const mockData = [
        {
          id: 1,
          title: 'AI 기반 소설 쓰기',
          description: 'AI 도구를 사용하여 500자 이상의 짧은 소설을 작성하세요.',
          type: 'ai_writing',
          difficulty: 'medium',
          xpReward: 100,
          tokenReward: 50,
          nftReward: true,
          status: 'active',
          participantCount: 328,
          completionRate: 82,
          createdAt: '2025-04-15'
        },
        {
          id: 2,
          title: '일일 출석 체크',
          description: '매일 플랫폼에 접속하여 출석 체크를 완료하세요.',
          type: 'daily_check',
          difficulty: 'easy',
          xpReward: 20,
          tokenReward: 10,
          nftReward: false,
          status: 'active',
          participantCount: 952,
          completionRate: 95,
          createdAt: '2025-04-10'
        },
        {
          id: 3,
          title: 'Web3 기초 지식 퀴즈',
          description: '블록체인과 Web3 기초 지식에 관한, 10문제 퀴즈를 풀어보세요.',
          type: 'quiz',
          difficulty: 'medium',
          xpReward: 80,
          tokenReward: 30,
          nftReward: false,
          status: 'active',
          participantCount: 215,
          completionRate: 76,
          createdAt: '2025-04-22'
        },
        {
          id: 4,
          title: 'AI 이미지 생성',
          description: 'AI 도구를 사용하여 Nest 테마에 맞는 이미지를 생성하세요.',
          type: 'ai_image',
          difficulty: 'hard',
          xpReward: 150,
          tokenReward: 75,
          nftReward: true,
          status: 'inactive',
          participantCount: 189,
          completionRate: 68,
          createdAt: '2025-04-05'
        },
        {
          id: 5,
          title: '커뮤니티 댓글 작성',
          description: '다른 사용자의 게시물에 5개 이상의 의미 있는 댓글을 작성하세요.',
          type: 'community',
          difficulty: 'easy',
          xpReward: 30,
          tokenReward: 15,
          nftReward: false,
          status: 'active',
          participantCount: 476,
          completionRate: 88,
          createdAt: '2025-04-18'
        }
      ];
      
      setMissions(mockData);
    } catch (error) {
      console.error('미션 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadMissions();
  }, []);

  // 다이얼로그 열기
  const handleOpenDialog = (type, mission = null) => {
    setDialogType(type);
    setSelectedMission(mission);
    
    if (type === 'create') {
      setFormData({
        title: '',
        description: '',
        type: '',
        difficulty: 'medium',
        xpReward: 0,
        tokenReward: 0,
        nftReward: false,
        status: 'active'
      });
    } else if (mission) {
      setFormData({
        title: mission.title,
        description: mission.description,
        type: mission.type,
        difficulty: mission.difficulty,
        xpReward: mission.xpReward,
        tokenReward: mission.tokenReward,
        nftReward: mission.nftReward,
        status: mission.status
      });
    }
    
    setOpenDialog(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMission(null);
  };

  // 폼 데이터 변경 처리
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 미션 생성/수정 제출 처리
  const handleSubmit = async () => {
    try {
      if (dialogType === 'create') {
        // API 호출 (목업)
        // await api.post('/missions', formData);
        const newMission = {
          id: missions.length + 1,
          ...formData,
          participantCount: 0,
          completionRate: 0,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setMissions([...missions, newMission]);
      } else if (dialogType === 'edit' && selectedMission) {
        // API 호출 (목업)
        // await api.put(`/missions/${selectedMission.id}`, formData);
        const updatedMissions = missions.map(mission => 
          mission.id === selectedMission.id 
            ? { ...mission, ...formData } 
            : mission
        );
        setMissions(updatedMissions);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('미션 저장 오류:', error);
    }
  };

  // 미션 삭제 처리
  const handleDelete = async () => {
    if (!selectedMission) return;
    
    try {
      // API 호출 (목업)
      // await api.delete(`/missions/${selectedMission.id}`);
      const filteredMissions = missions.filter(
        mission => mission.id !== selectedMission.id
      );
      setMissions(filteredMissions);
      
      handleCloseDialog();
    } catch (error) {
      console.error('미션 삭제 오류:', error);
    }
  };

  // 미션 상태 토글 (활성/비활성)
  const handleToggleStatus = async (id) => {
    try {
      const missionToUpdate = missions.find(mission => mission.id === id);
      const newStatus = missionToUpdate.status === 'active' ? 'inactive' : 'active';
      
      // API 호출 (목업)
      // await api.patch(`/missions/${id}`, { status: newStatus });
      
      const updatedMissions = missions.map(mission => 
        mission.id === id 
          ? { ...mission, status: newStatus } 
          : mission
      );
      
      setMissions(updatedMissions);
    } catch (error) {
      console.error('미션 상태 변경 오류:', error);
    }
  };

  // 검색 및 필터링된 미션 목록
  const filteredMissions = missions.filter(mission => {
    // 검색어 필터링
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 상태 필터링
    const matchesStatus = filters.status === 'all' || mission.status === filters.status;
    
    // 타입 필터링
    const matchesType = filters.type === 'all' || mission.type === filters.type;
    
    // 난이도 필터링
    const matchesDifficulty = filters.difficulty === 'all' || mission.difficulty === filters.difficulty;
    
    return matchesSearch && matchesStatus && matchesType && matchesDifficulty;
  });

  // DataGrid 열 정의
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'title', headerName: '미션명', flex: 1, minWidth: 200 },
    { 
      field: 'type', 
      headerName: '타입', 
      width: 150,
      renderCell: (params) => {
        const typeLabels = {
          ai_writing: 'AI 글쓰기',
          ai_image: 'AI 이미지',
          daily_check: '출석 체크',
          quiz: '퀴즈',
          community: '커뮤니티'
        };
        
        return typeLabels[params.value] || params.value;
      }
    },
    { 
      field: 'difficulty', 
      headerName: '난이도', 
      width: 120,
      renderCell: (params) => {
        const difficultyColors = {
          easy: '#4caf50',
          medium: '#ff9800',
          hard: '#f44336'
        };
        
        const difficultyLabels = {
          easy: '쉬움',
          medium: '보통',
          hard: '어려움'
        };
        
        return (
          <Chip 
            label={difficultyLabels[params.value] || params.value}
            size="small"
            sx={{ 
              bgcolor: `${difficultyColors[params.value]}20`, 
              color: difficultyColors[params.value],
              fontWeight: 'bold'
            }}
          />
        );
      }
    },
    { 
      field: 'xpReward', 
      headerName: 'XP 보상', 
      width: 120,
      renderCell: (params) => `${params.value} XP`
    },
    { 
      field: 'tokenReward', 
      headerName: '토큰 보상', 
      width: 120,
      renderCell: (params) => `${params.value} NEST`
    },
    { 
      field: 'nftReward', 
      headerName: 'NFT 보상', 
      width: 120,
      renderCell: (params) => (
        params.value ? 
          <Chip label="있음" size="small" color="primary" variant="outlined" /> : 
          <Chip label="없음" size="small" color="default" variant="outlined" />
      )
    },
    { 
      field: 'status', 
      headerName: '상태', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'active' ? '활성' : '비활성'}
          size="small"
          color={params.value === 'active' ? 'success' : 'default'}
        />
      )
    },
    { 
      field: 'participantCount', 
      headerName: '참여자 수', 
      width: 120,
      renderCell: (params) => params.value.toLocaleString()
    },
    { 
      field: 'completionRate', 
      headerName: '완료율', 
      width: 120,
      renderCell: (params) => `${params.value}%`
    },
    { 
      field: 'createdAt', 
      headerName: '생성일', 
      width: 120
    },
    {
      field: 'actions',
      headerName: '관리',
      sortable: false,
      width: 180,
      renderCell: (params) => (
        <Box>
          <Tooltip title="상세 보기">
            <IconButton
              color="info"
              size="small"
              onClick={() => handleOpenDialog('view', params.row)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="수정">
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleOpenDialog('edit', params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="상태 변경">
            <IconButton
              color={params.row.status === 'active' ? 'error' : 'success'}
              size="small"
              onClick={() => handleToggleStatus(params.row.id)}
            >
              {params.row.status === 'active' ? 
                <VisibilityOffIcon fontSize="small" /> : 
                <VisibilityIcon fontSize="small" />
              }
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton
              color="error"
              size="small"
              onClick={() => handleOpenDialog('delete', params.row)}
            >
              <DeleteIcon fontSize="small" />
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
          미션 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          새 미션 생성
        </Button>
      </Box>
      
      {/* 검색 및 필터링 */}
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="미션 검색"
              placeholder="미션명 또는 설명으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
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
                <InputLabel>타입</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  label="타입"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="ai_writing">AI 글쓰기</MenuItem>
                  <MenuItem value="ai_image">AI 이미지</MenuItem>
                  <MenuItem value="daily_check">출석 체크</MenuItem>
                  <MenuItem value="quiz">퀴즈</MenuItem>
                  <MenuItem value="community">커뮤니티</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>난이도</InputLabel>
                <Select
                  value={filters.difficulty}
                  onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                  label="난이도"
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="easy">쉬움</MenuItem>
                  <MenuItem value="medium">보통</MenuItem>
                  <MenuItem value="hard">어려움</MenuItem>
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
                  type: 'all',
                  difficulty: 'all'
                });
                loadMissions();
              }}
            >
              초기화
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 미션 목록 */}
      <Paper elevation={0} sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredMissions}
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
      
      {/* 미션 생성/수정/상세/삭제 다이얼로그 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'create' && '새 미션 생성'}
          {dialogType === 'edit' && '미션 수정'}
          {dialogType === 'view' && '미션 상세 정보'}
          {dialogType === 'delete' && '미션 삭제 확인'}
        </DialogTitle>
        <Divider />
        
        <DialogContent>
          {dialogType === 'delete' ? (
            <Typography>
              정말로 "{selectedMission?.title}" 미션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </Typography>
          ) : dialogType === 'view' ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ height: '100%', bgcolor: '#f9f9f9' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>미션 정보</Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">ID</Typography>
                        <Typography variant="body1">{selectedMission?.id}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">타입</Typography>
                        <Typography variant="body1">
                          {selectedMission?.type === 'ai_writing' && 'AI 글쓰기'}
                          {selectedMission?.type === 'ai_image' && 'AI 이미지'}
                          {selectedMission?.type === 'daily_check' && '출석 체크'}
                          {selectedMission?.type === 'quiz' && '퀴즈'}
                          {selectedMission?.type === 'community' && '커뮤니티'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">난이도</Typography>
                        <Chip 
                          label={
                            selectedMission?.difficulty === 'easy' ? '쉬움' :
                            selectedMission?.difficulty === 'medium' ? '보통' : '어려움'
                          }
                          size="small"
                          sx={{ 
                            bgcolor: selectedMission?.difficulty === 'easy' ? '#4caf5020' :
                                    selectedMission?.difficulty === 'medium' ? '#ff980020' : '#f4433620',
                            color: selectedMission?.difficulty === 'easy' ? '#4caf50' :
                                    selectedMission?.difficulty === 'medium' ? '#ff9800' : '#f44336',
                            fontWeight: 'bold'
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">상태</Typography>
                        <Chip 
                          label={selectedMission?.status === 'active' ? '활성' : '비활성'}
                          size="small"
                          color={selectedMission?.status === 'active' ? 'success' : 'default'}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">생성일</Typography>
                        <Typography variant="body1">{selectedMission?.createdAt}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>보상 정보</Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">XP 보상</Typography>
                        <Typography variant="body1">{selectedMission?.xpReward} XP</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">토큰 보상</Typography>
                        <Typography variant="body1">{selectedMission?.tokenReward} NEST</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">NFT 보상</Typography>
                        <Typography variant="body1">
                          {selectedMission?.nftReward ? '있음' : '없음'}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>참여 현황</Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">총 참여자 수</Typography>
                        <Typography variant="body1">{selectedMission?.participantCount.toLocaleString()}명</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">완료율</Typography>
                        <Typography variant="body1">{selectedMission?.completionRate}%</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card elevation={0}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>미션 내용</Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">미션명</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedMission?.title}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">미션 설명</Typography>
                        <Typography variant="body1">{selectedMission?.description}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box component="form" noValidate sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="미션명"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="미션 설명"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>미션 타입</InputLabel>
                    <Select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      label="미션 타입"
                    >
                      <MenuItem value="ai_writing">AI 글쓰기</MenuItem>
                      <MenuItem value="ai_image">AI 이미지</MenuItem>
                      <MenuItem value="daily_check">출석 체크</MenuItem>
                      <MenuItem value="quiz">퀴즈</MenuItem>
                      <MenuItem value="community">커뮤니티</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>난이도</InputLabel>
                    <Select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleFormChange}
                      label="난이도"
                    >
                      <MenuItem value="easy">쉬움</MenuItem>
                      <MenuItem value="medium">보통</MenuItem>
                      <MenuItem value="hard">어려움</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    required
                    fullWidth
                    label="XP 보상"
                    name="xpReward"
                    type="number"
                    value={formData.xpReward}
                    onChange={handleFormChange}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    required
                    fullWidth
                    label="토큰 보상 (NEST)"
                    name="tokenReward"
                    type="number"
                    value={formData.tokenReward}
                    onChange={handleFormChange}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>NFT 보상</InputLabel>
                    <Select
                      name="nftReward"
                      value={formData.nftReward}
                      onChange={(e) => setFormData({
                        ...formData,
                        nftReward: e.target.value === 'true'
                      })}
                      label="NFT 보상"
                    >
                      <MenuItem value="true">있음</MenuItem>
                      <MenuItem value="false">없음</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>상태</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      label="상태"
                    >
                      <MenuItem value="active">활성</MenuItem>
                      <MenuItem value="inactive">비활성</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {dialogType === 'delete' ? (
            <>
              <Button onClick={handleCloseDialog}>취소</Button>
              <Button 
                onClick={handleDelete} 
                variant="contained" 
                color="error"
              >
                삭제
              </Button>
            </>
          ) : dialogType === 'view' ? (
            <>
              <Button onClick={handleCloseDialog}>닫기</Button>
              <Button 
                onClick={() => {
                  handleCloseDialog();
                  handleOpenDialog('edit', selectedMission);
                }} 
                variant="contained"
              >
                수정
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCloseDialog}>취소</Button>
              <Button 
                onClick={handleSubmit} 
                variant="contained"
                disabled={!formData.title || !formData.description || !formData.type}
              >
                저장
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MissionManagement;
