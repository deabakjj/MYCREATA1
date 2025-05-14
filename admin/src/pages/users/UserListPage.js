import React, { useState, useEffect } from 'react';
import { PageHeader, Button, message, Modal, Space, Input } from 'antd';
import { ReloadOutlined, ExportOutlined, ImportOutlined } from '@ant-design/icons';
import { UserList, UserDetail } from '../../components/users';
import { userService } from '../../services';
import { useNavigate } from 'react-router-dom';

/**
 * 사용자 목록 페이지
 * 모든 사용자 조회 및 관리 기능 제공
 */
const UserListPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // 사용자 목록 로드 함수
  const loadUsers = async () => {
    setLoading(true);
    try {
      // API 호출 예시 (실제 구현 필요)
      // const response = await userService.getUsers();
      // setUsers(response.data);
      
      // 임시 데이터
      setTimeout(() => {
        const dummyUsers = [
          {
            id: 1,
            name: '홍길동',
            email: 'hong@example.com',
            nestId: 'honggildong',
            level: 25,
            xp: 2580,
            xpToNextLevel: 420,
            status: 'active',
            isActive: true,
            avatar: null,
            avatarColor: '#1890ff',
            wallet: {
              address: '0x1234567890abcdef1234567890abcdef12345678',
              tokenBalance: 5200,
              nftCount: 8
            },
            createdAt: '2025-01-15T08:30:00Z',
            lastActive: '2025-05-05T10:15:00Z',
            lastLoginAt: '2025-05-05T09:30:00Z',
            authProvider: 'google',
            activities: [
              {
                id: 1,
                timestamp: '2025-05-05T10:15:00Z',
                type: 'mission_complete',
                description: 'AI 에세이 작성 미션 완료',
                metadata: {
                  missionId: 1,
                  missionTitle: 'AI를 활용한 에세이 작성하기'
                }
              },
              {
                id: 2,
                timestamp: '2025-05-05T09:30:00Z',
                type: 'login',
                description: '로그인'
              },
              {
                id: 3,
                timestamp: '2025-05-04T14:20:00Z',
                type: 'reward_received',
                description: '미션 보상 수령',
                metadata: {
                  xp: 100,
                  token: 20
                }
              }
            ],
            nfts: [
              {
                id: 1,
                name: '크립토 마스터 뱃지',
                image: 'https://example.com/nft/crypto-badge.jpg',
                acquiredAt: '2025-04-20T15:40:00Z',
                source: '크립토 지식 퀴즈',
                rarity: 'rare',
                tokenId: '123456'
              },
              {
                id: 2,
                name: '얼리 어답터 뱃지',
                image: 'https://example.com/nft/early-adopter.jpg',
                acquiredAt: '2025-01-20T11:30:00Z',
                source: '초기 가입 보상',
                rarity: 'common',
                tokenId: '123457'
              }
            ],
            transactions: [
              {
                id: 1,
                timestamp: '2025-05-04T14:20:00Z',
                type: 'receive',
                amount: 20,
                counterparty: null,
                memo: '미션 보상',
                txHash: null
              },
              {
                id: 2,
                timestamp: '2025-05-02T09:15:00Z',
                type: 'send',
                amount: 50,
                counterparty: 'kimuser.nest',
                memo: '친구에게 선물',
                txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
              }
            ],
            missionParticipations: [
              {
                missionId: 1,
                missionTitle: 'AI를 활용한 에세이 작성하기',
                participatedAt: '2025-05-05T09:45:00Z',
                status: 'completed',
                xpAwarded: 100,
                tokenAwarded: 20,
                nftAwarded: false
              },
              {
                missionId: 2,
                missionTitle: '크립토 지식 퀴즈 풀기',
                participatedAt: '2025-04-20T15:20:00Z',
                status: 'completed',
                xpAwarded: 50,
                tokenAwarded: 10,
                nftAwarded: true
              }
            ]
          },
          {
            id: 2,
            name: '김철수',
            email: 'kim@example.com',
            nestId: 'kimcs',
            level: 10,
            xp: 1050,
            xpToNextLevel: 150,
            status: 'active',
            isActive: true,
            avatar: 'https://example.com/avatar/kim.jpg',
            wallet: {
              address: '0xabcdef1234567890abcdef1234567890abcdef12',
              tokenBalance: 1200,
              nftCount: 3
            },
            createdAt: '2025-02-10T14:20:00Z',
            lastActive: '2025-05-04T16:30:00Z',
            lastLoginAt: '2025-05-04T16:30:00Z',
            authProvider: 'kakao'
          },
          {
            id: 3,
            name: '이영희',
            email: 'lee@example.com',
            nestId: null,
            level: 5,
            xp: 520,
            xpToNextLevel: 80,
            status: 'inactive',
            isActive: false,
            avatar: null,
            avatarColor: '#722ed1',
            wallet: {
              address: '0x0987654321fedcba0987654321fedcba09876543',
              tokenBalance: 500,
              nftCount: 1
            },
            createdAt: '2025-03-05T09:10:00Z',
            lastActive: '2025-04-10T11:45:00Z',
            lastLoginAt: '2025-04-10T11:45:00Z',
            authProvider: 'email'
          },
          {
            id: 4,
            name: '박민수',
            email: 'park@example.com',
            nestId: 'parkms',
            level: 32,
            xp: 3250,
            xpToNextLevel: 750,
            status: 'active',
            isActive: true,
            avatar: 'https://example.com/avatar/park.jpg',
            wallet: {
              address: '0xfedbca0987654321fedbca0987654321fedbca09',
              tokenBalance: 8900,
              nftCount: 15
            },
            createdAt: '2025-01-05T16:40:00Z',
            lastActive: '2025-05-05T08:20:00Z',
            lastLoginAt: '2025-05-05T08:20:00Z',
            authProvider: 'apple'
          }
        ];
        setUsers(dummyUsers);
        setLoading(false);
      }, 700);
    } catch (error) {
      console.error('사용자 로드 실패:', error);
      message.error('사용자 목록을 불러오는 데 실패했습니다.');
      setLoading(false);
    }
  };

  // 페이지 로드 시 사용자 목록 로드
  useEffect(() => {
    loadUsers();
  }, []);

  // 사용자 상세 정보 보기
  const handleViewUser = (user) => {
    setCurrentUser(user);
    setDetailVisible(true);
  };

  // 사용자 상태 변경 (활성화/비활성화/차단)
  const handleToggleUserStatus = async (user, isActive, status = null) => {
    try {
      setConfirmLoading(true);
      const newStatus = status || (isActive ? 'active' : 'inactive');
      
      // API 호출 예시 (실제 구현 필요)
      // await userService.toggleUserStatus(user.id, isActive, newStatus);
      console.log(`사용자 ${user.id} 상태 변경: isActive=${isActive}, status=${newStatus}`);
      
      // 임시 상태 업데이트
      const updatedUsers = users.map(u => {
        if (u.id === user.id) {
          return { ...u, isActive, status: newStatus };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      
      // 현재 상세 보기 중인 사용자라면 상태 업데이트
      if (currentUser && currentUser.id === user.id) {
        setCurrentUser({ ...currentUser, isActive, status: newStatus });
      }
      
      message.success(`사용자 상태가 ${newStatus}로 변경되었습니다.`);
    } catch (error) {
      console.error('사용자 상태 변경 실패:', error);
      message.error('사용자 상태 변경에 실패했습니다.');
    } finally {
      setConfirmLoading(false);
    }
  };

  // XP 조정 처리
  const handleAdjustXp = async (userId, xpData) => {
    try {
      // API 호출 예시 (실제 구현 필요)
      // await userService.adjustXp(userId, xpData);
      console.log(`사용자 ${userId}의 XP 조정: `, xpData);
      
      // 임시 상태 업데이트
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { 
            ...u, 
            xp: u.xp + xpData.amount 
          };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      
      // 현재 상세 보기 중인 사용자라면 상태 업데이트
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ 
          ...currentUser, 
          xp: currentUser.xp + xpData.amount 
        });
      }
      
      message.success(`XP가 성공적으로 ${xpData.amount > 0 ? '지급' : '차감'}되었습니다.`);
    } catch (error) {
      console.error('XP 조정 실패:', error);
      message.error('XP 조정에 실패했습니다.');
    }
  };

  // 토큰 지급 처리
  const handleIssueTokens = async (userId, tokenData) => {
    try {
      // API 호출 예시 (실제 구현 필요)
      // await userService.issueTokens(userId, tokenData);
      console.log(`사용자 ${userId}에게 토큰 지급: `, tokenData);
      
      // 임시 상태 업데이트
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { 
            ...u, 
            wallet: {
              ...u.wallet,
              tokenBalance: u.wallet.tokenBalance + tokenData.amount
            }
          };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      
      // 현재 상세 보기 중인 사용자라면 상태 업데이트
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ 
          ...currentUser, 
          wallet: {
            ...currentUser.wallet,
            tokenBalance: currentUser.wallet.tokenBalance + tokenData.amount
          }
        });
      }
      
      message.success(`토큰이 성공적으로 ${tokenData.amount > 0 ? '지급' : '차감'}되었습니다.`);
    } catch (error) {
      console.error('토큰 지급 실패:', error);
      message.error('토큰 지급에 실패했습니다.');
    }
  };

  // Nest ID 관리 처리
  const handleManageNestId = async (userId, nestIdData) => {
    try {
      // API 호출 예시 (실제 구현 필요)
      // await userService.manageNestId(userId, nestIdData);
      console.log(`사용자 ${userId}의 Nest ID 관리: `, nestIdData);
      
      // 임시 상태 업데이트
      const updatedUsers = users.map(u => {
        if (u.id === userId) {
          return { ...u, nestId: nestIdData.nestId };
        }
        return u;
      });
      
      setUsers(updatedUsers);
      
      // 현재 상세 보기 중인 사용자라면 상태 업데이트
      if (currentUser && currentUser.id === userId) {
        setCurrentUser({ ...currentUser, nestId: nestIdData.nestId });
      }
      
      message.success('Nest ID가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('Nest ID 관리 실패:', error);
      message.error('Nest ID 업데이트에 실패했습니다.');
    }
  };

  return (
    <div className="user-list-page">
      <PageHeader
        title="사용자 관리"
        subTitle="모든 사용자 정보를 조회하고 관리합니다"
        extra={[
          <Button
            key="export"
            icon={<ExportOutlined />}
            onClick={() => message.info('사용자 데이터 내보내기 기능 준비 중')}
          >
            내보내기
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={loadUsers}
            loading={loading}
          >
            새로고침
          </Button>,
        ]}
      />

      <UserList
        users={users}
        loading={loading}
        onView={handleViewUser}
        onEdit={handleViewUser} // 현재는 상세 보기와 동일한 기능
        onToggleStatus={handleToggleUserStatus}
      />

      {/* 사용자 상세 모달 */}
      <Modal
        title="사용자 상세 정보"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <UserDetail
          user={currentUser}
          onAdjustXp={handleAdjustXp}
          onIssueTokens={handleIssueTokens}
          onToggleStatus={handleToggleUserStatus}
          onManageNestId={handleManageNestId}
        />
      </Modal>
    </div>
  );
};

export default UserListPage;
