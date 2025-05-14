import React, { useState, useEffect } from 'react';
import { PageHeader, Button, message, Modal, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { MissionList, MissionForm, MissionDetail } from '../../components/missions';
import { useNavigate, Link } from 'react-router-dom';

/**
 * 미션 목록 페이지
 * 모든 미션 조회 및 관리 기능 제공
 */
const MissionListPage = () => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentMission, setCurrentMission] = useState(null);
  const [participationStats, setParticipationStats] = useState([]);
  const [formMode, setFormMode] = useState('create'); // 'create' 또는 'edit'
  const [formLoading, setFormLoading] = useState(false);

  // 미션 목록 로드 함수
  const loadMissions = async () => {
    setLoading(true);
    try {
      // API 호출 예시 (실제 구현 필요)
      // const response = await missionService.getMissions();
      // setMissions(response.data);
      
      // 임시 데이터
      setTimeout(() => {
        const dummyMissions = [
          {
            id: 1,
            title: 'AI를 활용한 에세이 작성하기',
            description: '인공지능에 대한 짧은 에세이를 작성해보세요.',
            status: 'active',
            difficulty: 'medium',
            xpReward: 100,
            tokenReward: 20,
            nftReward: null,
            participantCount: 125,
            completionCount: 98,
            totalXpAwarded: 9800,
            totalTokenAwarded: 1960,
            createdAt: '2025-04-30T09:00:00Z',
            startDate: '2025-05-01T00:00:00Z',
            endDate: '2025-05-31T23:59:59Z',
            isPublic: true,
            aiModel: 'gpt',
            aiPrompt: '다음 주제에 대한 300단어 에세이를 작성하세요: {userInput}',
            maxTokens: 2000,
          },
          {
            id: 2,
            title: '크립토 지식 퀴즈 풀기',
            description: '블록체인과 암호화폐에 대한 퀴즈를 풀어 보상을 받으세요.',
            status: 'active',
            difficulty: 'easy',
            xpReward: 50,
            tokenReward: 10,
            nftReward: {
              name: '크립토 마스터 뱃지',
              description: '크립토 퀴즈 완료 기념 NFT',
              imageUrl: 'https://example.com/nft/crypto-badge.jpg',
              maxSupply: 1000,
            },
            participantCount: 250,
            completionCount: 200,
            totalXpAwarded: 10000,
            totalTokenAwarded: 2000,
            nftMintedCount: 200,
            createdAt: '2025-04-15T10:30:00Z',
            isPublic: true,
            aiModel: 'claude',
            aiPrompt: '블록체인 관련 퀴즈를 생성하고 사용자의 답변을 평가하세요.',
            maxTokens: 1500,
          },
          {
            id: 3,
            title: 'NFT 아트 생성 미션',
            description: 'AI를 활용하여 독특한 NFT 아트 콘셉트를 제작하세요.',
            status: 'draft',
            difficulty: 'hard',
            xpReward: 200,
            tokenReward: 50,
            nftReward: {
              name: 'AI 아티스트 뱃지',
              description: 'NFT 아트 미션 완료 기념 NFT',
              imageUrl: 'https://example.com/nft/artist-badge.jpg',
              maxSupply: 500,
            },
            participantCount: 0,
            completionCount: 0,
            totalXpAwarded: 0,
            totalTokenAwarded: 0,
            nftMintedCount: 0,
            createdAt: '2025-05-01T15:45:00Z',
            isPublic: false,
            aiModel: 'gemini',
            aiPrompt: '다음 주제에 대한 NFT 아트 콘셉트를 설명하세요: {userInput}',
            maxTokens: 3000,
          },
        ];
        setMissions(dummyMissions);
        setLoading(false);
      }, 700);
    } catch (error) {
      console.error('미션 로드 실패:', error);
      message.error('미션 목록을 불러오는 데 실패했습니다.');
      setLoading(false);
    }
  };

  // 미션 상세 정보와 참여 통계 로드
  const loadMissionDetails = async (missionId) => {
    try {
      // API 호출 예시 (실제 구현 필요)
      // const response = await missionService.getMissionParticipation(missionId);
      // setParticipationStats(response.data);
      
      // 임시 데이터
      setTimeout(() => {
        const dummyStats = [
          {
            userId: 'user123',
            userName: '홍길동',
            completedAt: '2025-05-02T14:30:00Z',
            xpAwarded: 100,
            tokenAwarded: 20,
            nftAwarded: true,
          },
          {
            userId: 'user456',
            userName: '김철수',
            completedAt: '2025-05-02T15:15:00Z',
            xpAwarded: 100,
            tokenAwarded: 20,
            nftAwarded: false,
          },
          {
            userId: 'user789',
            userName: '박영희',
            completedAt: '2025-05-03T09:45:00Z',
            xpAwarded: 100,
            tokenAwarded: 20,
            nftAwarded: true,
          },
        ];
        setParticipationStats(dummyStats);
      }, 500);
    } catch (error) {
      console.error('미션 참여 정보 로드 실패:', error);
      message.error('미션 참여 정보를 불러오는 데 실패했습니다.');
    }
  };

  // 페이지 로드 시 미션 목록 로드
  useEffect(() => {
    loadMissions();
  }, []);

  // 새 미션 생성 모달 표시
  const showCreateForm = () => {
    setCurrentMission(null);
    setFormMode('create');
    setFormVisible(true);
  };

  // 미션 수정 모달 표시
  const showEditForm = (mission) => {
    setCurrentMission(mission);
    setFormMode('edit');
    setFormVisible(true);
  };

  // 미션 상세 모달 표시
  const showMissionDetail = (mission) => {
    setCurrentMission(mission);
    loadMissionDetails(mission.id);
    setDetailVisible(true);
  };

  // 미션 폼 제출 처리
  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      if (formMode === 'create') {
        // 새 미션 생성 API 호출 (실제 구현 필요)
        // await missionService.createMission(values);
        console.log('생성할 미션 데이터:', values);
        message.success('미션이 성공적으로 생성되었습니다.');
      } else {
        // 미션 수정 API 호출 (실제 구현 필요)
        // await missionService.updateMission(currentMission.id, values);
        console.log('수정할 미션 데이터:', { ...currentMission, ...values });
        message.success('미션이 성공적으로 수정되었습니다.');
      }
      setFormVisible(false);
      loadMissions(); // 목록 새로고침
    } catch (error) {
      console.error('미션 저장 실패:', error);
      message.error('미션 저장에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  // 미션 삭제 처리
  const handleDeleteMission = async (mission) => {
    Modal.confirm({
      title: '미션 삭제',
      content: `"${mission.title}" 미션을 정말 삭제하시겠습니까?`,
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: async () => {
        try {
          // 미션 삭제 API 호출 (실제 구현 필요)
          // await missionService.deleteMission(mission.id);
          console.log('삭제할 미션 ID:', mission.id);
          message.success('미션이 성공적으로 삭제되었습니다.');
          if (detailVisible) {
            setDetailVisible(false);
          }
          loadMissions(); // 목록 새로고침
        } catch (error) {
          console.error('미션 삭제 실패:', error);
          message.error('미션 삭제에 실패했습니다.');
        }
      },
    });
  };

  // 미션 복제 처리
  const handleDuplicateMission = (mission) => {
    const duplicatedMission = {
      ...mission,
      title: `${mission.title} (복사본)`,
      id: null, // 새 ID로 생성되도록
      status: 'draft', // 항상 초안 상태로
      createdAt: null, // 새 생성일자로
    };
    setCurrentMission(duplicatedMission);
    setFormMode('create');
    setFormVisible(true);
  };

  return (
    <div className="mission-list-page">
      <PageHeader
        title="미션 관리"
        subTitle="모든 미션을 관리하고 새 미션을 생성합니다"
        extra={[
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={loadMissions}
            loading={loading}
          >
            새로고침
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateForm}
          >
            새 미션 생성
          </Button>,
        ]}
      />

      <MissionList
        missions={missions}
        loading={loading}
        onEdit={showEditForm}
        onDelete={handleDeleteMission}
        onView={showMissionDetail}
        onDuplicate={handleDuplicateMission}
      />

      {/* 미션 생성/수정 모달 */}
      <Modal
        title={formMode === 'create' ? '새 미션 생성' : '미션 수정'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
        maskClosable={false}
      >
        <MissionForm
          initialValues={currentMission}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormVisible(false)}
          loading={formLoading}
        />
      </Modal>

      {/* 미션 상세 모달 */}
      <Modal
        title="미션 상세 정보"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <MissionDetail
          mission={currentMission}
          participationStats={participationStats}
          onEdit={showEditForm}
          onDelete={handleDeleteMission}
          onDuplicate={handleDuplicateMission}
        />
      </Modal>
    </div>
  );
};

export default MissionListPage;
