import React, { useState, useEffect } from 'react';
import { PageHeader, Button, message, Modal, Space, Upload } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { RewardList, RewardDetail, RewardForm } from '../../components/rewards';
import { rewardService, userService } from '../../services';
import { useNavigate } from 'react-router-dom';

/**
 * 보상 관리 페이지
 * 모든 보상 내역 조회 및 수동 보상 지급 기능 제공
 */
const RewardListPage = () => {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // 보상 내역 로드 함수
  const loadRewards = async () => {
    setLoading(true);
    try {
      // API 호출 예시 (실제 구현 필요)
      // const response = await rewardService.getRewards();
      // setRewards(response.data);
      
      // 임시 데이터
      setTimeout(() => {
        const dummyRewards = [
          {
            id: 1,
            type: 'token',
            amount: 100,
            reason: '미션 완료 보상',
            source: 'mission',
            isOnchain: true,
            status: 'completed',
            timestamp: '2025-05-01T14:30:00Z',
            completedAt: '2025-05-01T14:31:20Z',
            txHash: '0x1234567890abcdef1234567890abcdef12345678',
            blockNumber: 12345678,
            user: {
              id: 1,
              name: '홍길동',
              email: 'hong@example.com',
              nestId: 'honggildong',
              wallet: {
                address: '0x1234567890abcdef1234567890abcdef12345678',
                tokenBalance: 5200
              }
            },
            logs: [
              {
                timestamp: '2025-05-01T14:30:00Z',
                event: 'reward_created',
                description: '보상 지급 요청이 생성되었습니다.'
              },
              {
                timestamp: '2025-05-01T14:30:30Z',
                event: 'transaction_sent',
                description: '블록체인 트랜잭션이 전송되었습니다.'
              },
              {
                timestamp: '2025-05-01T14:31:20Z',
                event: 'reward_completed',
                description: '보상 지급이 완료되었습니다.'
              }
            ]
          },
          {
            id: 2,
            type: 'xp',
            amount: 50,
            reason: '댓글 작성 보상',
            source: 'system',
            isOnchain: false,
            status: 'completed',
            timestamp: '2025-05-02T09:15:00Z',
            completedAt: '2025-05-02T09:15:10Z',
            user: {
              id: 2,
              name: '김철수',
              email: 'kim@example.com',
              nestId: 'kimcs',
              wallet: {
                address: '0xabcdef1234567890abcdef1234567890abcdef12',
                tokenBalance: 1200
              }
            }
          },
          {
            id: 3,
            type: 'nft',
            tokenId: '123456',
            reason: '얼리 어답터 뱃지',
            source: 'admin',
            isOnchain: true,
            status: 'pending',
            timestamp: '2025-05-03T11:20:00Z',
            metadata: {
              name: '얼리 어답터 뱃지',
              description: 'Nest 플랫폼 초기 사용자 기념 뱃지',
              image: 'https://example.com/nft/early-adopter.jpg',
              attributes: [
                { trait_type: 'Rarity', value: 'Rare' },
                { trait_type: 'Category', value: 'Achievement' }
              ]
            },
            user: {
              id: 3,
              name: '이영희',
              email: 'lee@example.com',
              nestId: null,
              wallet: {
                address: '0x0987654321fedcba0987654321fedcba09876543',
                tokenBalance: 500
              }
            }
          },
          {
            id: 4,
            type: 'token',
            amount: -50,
            reason: '환불 처리',
            source: 'admin',
            isOnchain: true,
            status: 'failed',
            timestamp: '2025-05-04T16:45:00Z',
            error: '잔액 부족으로 처리 실패',
            user: {
              id: 4,
              name: '박민수',
              email: 'park@example.com',
              nestId: 'parkms',
              wallet: {
                address: '0xfedbca0987654321fedbca0987654321fedbca09',
                tokenBalance: 20
              }
            },
            logs: [
              {
                timestamp: '2025-05-04T16:45:00Z',
                event: 'reward_created',
                description: '보상 지급 요청이 생성되었습니다.'
              },
              {
                timestamp: '2025-05-04T16:45:30Z',
                event: 'transaction_sent',
                description: '블록체인 트랜잭션이 전송되었습니다.'
              },
              {
                timestamp: '2025-05-04T16:46:20Z',
                event: 'transaction_failed',
                description: '트랜잭션 실패: 잔액 부족'
              }
            ]
          },
          {
            id: 5,
            type: 'badge',
            tokenId: '789012',
            reason: '커뮤니티 기여 뱃지',
            source: 'admin',
            isOnchain: true,
            status: 'processing',
            timestamp: '2025-05-05T10:10:00Z',
            metadata: {
              name: '커뮤니티 기여 뱃지',
              description: 'Nest 커뮤니티 활성화에 기여한 사용자 기념 뱃지',
              image: 'https://example.com/nft/community-contributor.jpg',
              attributes: [
                { trait_type: 'Rarity', value: 'Epic' },
                { trait_type: 'Category', value: 'Community' }
              ]
            },
            user: {
              id: 1,
              name: '홍길동',
              email: 'hong@example.com',
              nestId: 'honggildong',
              wallet: {
                address: '0x1234567890abcdef1234567890abcdef12345678',
                tokenBalance: 5200
              }
            }
          }
        ];
        setRewards(dummyRewards);
        setLoading(false);
      }, 700);
    } catch (error) {
      console.error('보상 내역 로드 실패:', error);
      message.error('보상 내역을 불러오는 데 실패했습니다.');
      setLoading(false);
    }
  };

  // 사용자 목록 로드 함수
  const loadUsers = async () => {
    try {
      // API 호출 예시 (실제 구현 필요)
      // const response = await userService.getUsers();
      // const options = response.data.map(user => ({
      //   label: `${user.name} (${user.nestId || user.email})`,
      //   value: user.id
      // }));
      // setUserOptions(options);
      
      // 임시 데이터
      const dummyOptions = [
        { label: '홍길동 (honggildong)', value: 1 },
        { label: '김철수 (kimcs)', value: 2 },
        { label: '이영희 (lee@example.com)', value: 3 },
        { label: '박민수 (parkms)', value: 4 },
      ];
      setUserOptions(dummyOptions);
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error);
      message.error('사용자 목록을 불러오는 데 실패했습니다.');
    }
  };

  // 페이지 로드 시 데이터 로드
  useEffect(() => {
    loadRewards();
    loadUsers();
  }, []);

  // 보상 지급 모달 표시
  const showRewardForm = () => {
    setCurrentReward(null);
    setFormVisible(true);
  };

  // 보상 상세 모달 표시
  const showRewardDetail = (reward) => {
    setCurrentReward(reward);
    setDetailVisible(true);
  };

  // 보상 지급 폼 제출 처리
  const handleFormSubmit = async (values) => {
    setFormLoading(true);
    try {
      // API 호출 예시 (실제 구현 필요)
      // const response = await rewardService.issueReward(values);
      console.log('지급할 보상 데이터:', values);
      
      // 성공 메시지
      let successMsg = '';
      if (values.userIds && values.userIds.length > 0) {
        successMsg = `${values.userIds.length}명의 사용자에게 보상이 지급되었습니다.`;
      } else if (values.batchFile) {
        successMsg = '일괄 보상 지급이 요청되었습니다. 처리 결과는 로그에서 확인할 수 있습니다.';
      }
      
      message.success(successMsg);
      setFormVisible(false);
      loadRewards(); // 목록 새로고침
    } catch (error) {
      console.error('보상 지급 실패:', error);
      message.error('보상 지급에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  // 실패한 보상 재시도 처리
  const handleRetryReward = async (reward) => {
    try {
      // API 호출 예시 (실제 구현 필요)
      // await rewardService.retryFailedReward(reward.id);
      console.log('재시도할 보상 ID:', reward.id);
      
      message.success('보상 지급이 재시도되었습니다.');
      
      // 임시 상태 업데이트
      const updatedRewards = rewards.map(r => {
        if (r.id === reward.id) {
          return { ...r, status: 'processing' };
        }
        return r;
      });
      
      setRewards(updatedRewards);
      
      // 현재 상세 보기 중인 보상이라면 상태 업데이트
      if (currentReward && currentReward.id === reward.id) {
        setCurrentReward({ ...currentReward, status: 'processing' });
      }
      
      loadRewards(); // 목록 새로고침
    } catch (error) {
      console.error('보상 재시도 실패:', error);
      message.error('보상 재시도에 실패했습니다.');
    }
  };

  // 보상 취소 처리
  const handleCancelReward = async (reward, reason) => {
    try {
      // API 호출 예시 (실제 구현 필요)
      // await rewardService.cancelReward(reward.id, reason);
      console.log('취소할 보상 ID:', reward.id, '취소 사유:', reason);
      
      message.success('보상 지급이 취소되었습니다.');
      
      // 임시 상태 업데이트
      const updatedRewards = rewards.map(r => {
        if (r.id === reward.id) {
          return { ...r, status: 'cancelled', cancelReason: reason };
        }
        return r;
      });
      
      setRewards(updatedRewards);
      
      // 현재 상세 보기 중인 보상이라면 상태 업데이트
      if (currentReward && currentReward.id === reward.id) {
        setCurrentReward({ ...currentReward, status: 'cancelled', cancelReason: reason });
      }
    } catch (error) {
      console.error('보상 취소 실패:', error);
      message.error('보상 취소에 실패했습니다.');
    }
  };

  // 보상 상태 확인 처리
  const handleCheckStatus = async (reward) => {
    try {
      // API 호출 예시 (실제 구현 필요)
      // const response = await rewardService.checkBlockchainStatus(reward.id);
      // const newStatus = response.data.status;
      
      console.log('확인할 보상 ID:', reward.id);
      
      // 임시 처리 (실제로는 API에서 최신 상태를 가져와야 함)
      message.info('보상 상태가 확인되었습니다. 상태는 처리 중입니다.');
      
      // 실제 구현에서는 업데이트된 상태로 변경
      // loadRewards();
    } catch (error) {
      console.error('보상 상태 확인 실패:', error);
      message.error('보상 상태 확인에 실패했습니다.');
    }
  };

  // 보상 내역 내보내기 처리
  const handleExportRewards = async () => {
    setExportLoading(true);
    try {
      // API 호출 예시 (실제 구현 필요)
      // const blob = await rewardService.exportRewardLogs();
      
      // // 파일 다운로드
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `reward_logs_${moment().format('YYYY-MM-DD')}.xlsx`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
      
      console.log('보상 내역 내보내기 요청');
      
      // 임시 처리
      setTimeout(() => {
        message.success('보상 내역이 성공적으로 내보내졌습니다.');
        setExportLoading(false);
      }, 1000);
    } catch (error) {
      console.error('보상 내역 내보내기 실패:', error);
      message.error('보상 내역 내보내기에 실패했습니다.');
      setExportLoading(false);
    }
  };

  return (
    <div className="reward-list-page">
      <PageHeader
        title="보상 관리"
        subTitle="모든 보상 내역을 조회하고 수동 보상을 지급합니다"
        extra={[
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={handleExportRewards}
            loading={exportLoading}
          >
            내보내기
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={loadRewards}
            loading={loading}
          >
            새로고침
          </Button>,
          <Button
            key="issue"
            type="primary"
            icon={<PlusOutlined />}
            onClick={showRewardForm}
          >
            보상 지급
          </Button>,
        ]}
      />

      <RewardList
        rewards={rewards}
        loading={loading}
        onView={showRewardDetail}
        onRetry={handleRetryReward}
        onCancel={(reward) => handleCancelReward(reward, "관리자에 의한 취소")}
        onCheckStatus={handleCheckStatus}
      />

      {/* 보상 지급 모달 */}
      <Modal
        title="보상 지급"
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
        maskClosable={false}
      >
        <RewardForm
          onSubmit={handleFormSubmit}
          onCancel={() => setFormVisible(false)}
          loading={formLoading}
          userOptions={userOptions}
        />
      </Modal>

      {/* 보상 상세 모달 */}
      <Modal
        title="보상 상세 정보"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <RewardDetail
          reward={currentReward}
          onRetry={handleRetryReward}
          onCancel={handleCancelReward}
          onCheckStatus={handleCheckStatus}
        />
      </Modal>
    </div>
  );
};

export default RewardListPage;
