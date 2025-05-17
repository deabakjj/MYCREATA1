import React, { useEffect } from 'react';
import { 
  Container,
  Typography,
  Paper,
  Button,
  Stack,
  Divider
} from '@mui/material';
import useApiCall from '../../hooks/useApiCall';
import { Loading, ErrorMessage, EmptyState } from '../../components/common/StatusComponents';
import missionService from '../../services/missionService';

/**
 * 미션 목록 페이지
 * API 호출 상태 관리 및 데이터 표시 예제
 */
const MissionListExample = () => {
  // API 호출 상태 관리를 위한 훅 사용
  const {
    loading,
    error,
    data: missions,
    callApi,
    clearError
  } = useApiCall();

  // 페이지 로드 시 미션 목록 불러오기
  useEffect(() => {
    loadMissions();
  }, []);

  // 미션 목록 불러오기 함수
  const loadMissions = async () => {
    await callApi(missionService.getMissions, [{
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }]);
  };

  // 미션 삭제 함수
  const handleDeleteMission = async (id) => {
    if (window.confirm('정말 이 미션을 삭제하시겠습니까?')) {
      await callApi(missionService.deleteMission, [id], 
        // 성공 시 목록 새로고침
        () => loadMissions(), 
        // 오류 처리
        (err) => console.error('미션 삭제 오류:', err)
      );
    }
  };

  // 렌더링 로직
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        미션 목록
      </Typography>
      
      {/* 에러 메시지 */}
      <ErrorMessage 
        error={error} 
        onRetry={() => {
          clearError();
          loadMissions();
        }}
      />
      
      {/* 로딩 상태 */}
      {loading && <Loading message="미션 목록을 불러오는 중입니다..." />}
      
      {/* 데이터 표시 */}
      {!loading && !error && (
        <>
          {/* 빈 데이터 상태 */}
          {(!missions || missions.length === 0) ? (
            <EmptyState 
              message="등록된 미션이 없습니다."
              action={
                <Button variant="contained" color="primary" onClick={loadMissions}>
                  다시 불러오기
                </Button>
              }
            />
          ) : (
            // 미션 목록 표시
            <Stack spacing={2}>
              {missions.map(mission => (
                <Paper key={mission.id} sx={{ p: 2 }}>
                  <Typography variant="h6">{mission.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mission.description}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleDeleteMission(mission.id)}
                    >
                      삭제
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => {/* 편집 로직 */}}
                    >
                      편집
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </>
      )}
    </Container>
  );
};

export default MissionListExample;
