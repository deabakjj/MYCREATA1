import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Input, Tooltip, Popconfirm } from 'antd';
import { SearchOutlined, EyeOutlined, RedoOutlined, StopOutlined, CheckOutlined } from '@ant-design/icons';
import moment from 'moment';

/**
 * 보상 목록 컴포넌트
 * 관리자가 모든 보상 지급 내역을 확인하고 관리할 수 있는 테이블 형태의 UI
 */
const RewardList = ({ rewards, loading, onView, onRetry, onCancel, onCheckStatus }) => {
  const [searchText, setSearchText] = useState('');
  const [filteredRewards, setFilteredRewards] = useState([]);

  useEffect(() => {
    if (rewards) {
      setFilteredRewards(rewards);
    }
  }, [rewards]);

  // 검색 기능 구현
  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredRewards(rewards);
      return;
    }

    const filtered = rewards.filter(
      (reward) =>
        reward.user?.name?.toLowerCase().includes(value.toLowerCase()) ||
        reward.user?.email?.toLowerCase().includes(value.toLowerCase()) ||
        reward.user?.nestId?.toLowerCase().includes(value.toLowerCase()) ||
        reward.type?.toLowerCase().includes(value.toLowerCase()) ||
        reward.reason?.toLowerCase().includes(value.toLowerCase()) ||
        reward.status?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredRewards(filtered);
  };

  // 보상 유형에 따른 태그 색상
  const getRewardTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'token':
        return 'green';
      case 'xp':
        return 'blue';
      case 'nft':
        return 'purple';
      case 'badge':
        return 'orange';
      default:
        return 'default';
    }
  };

  // 보상 상태에 따른 태그 색상
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'blue';
      case 'processing':
        return 'orange';
      case 'failed':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '사용자',
      dataIndex: ['user', 'name'],
      key: 'userName',
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <span>{name}</span>
          {record.user?.nestId && (
            <Tag color="blue">{record.user.nestId}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '보상 유형',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      filters: [
        { text: '토큰', value: 'token' },
        { text: 'XP', value: 'xp' },
        { text: 'NFT', value: 'nft' },
        { text: '뱃지', value: 'badge' },
      ],
      onFilter: (value, record) => record.type.toLowerCase() === value,
      render: (type) => (
        <Tag color={getRewardTypeColor(type)}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: '금액/ID',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      sorter: (a, b) => {
        // NFT의 경우 ID 비교
        if (a.type === 'nft' || a.type === 'badge') {
          return a.tokenId?.localeCompare(b.tokenId);
        }
        // 토큰, XP의 경우 금액 비교
        return a.amount - b.amount;
      },
      render: (amount, record) => {
        if (record.type === 'token') {
          return <span>{amount} NEST</span>;
        } else if (record.type === 'xp') {
          return <span>{amount} XP</span>;
        } else if (record.type === 'nft' || record.type === 'badge') {
          return <span>ID: {record.tokenId}</span>;
        }
        return <span>{amount}</span>;
      },
    },
    {
      title: '사유',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: {
        showTitle: false,
      },
      render: (reason) => (
        <Tooltip title={reason}>
          <span>{reason}</span>
        </Tooltip>
      ),
    },
    {
      title: '소스',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      filters: [
        { text: '미션', value: 'mission' },
        { text: '관리자', value: 'admin' },
        { text: '시스템', value: 'system' },
        { text: '에어드롭', value: 'airdrop' },
      ],
      onFilter: (value, record) => record.source.toLowerCase() === value,
      render: (source) => {
        let color = 'default';
        if (source === 'mission') color = 'blue';
        if (source === 'admin') color = 'purple';
        if (source === 'system') color = 'cyan';
        if (source === 'airdrop') color = 'gold';
        return <Tag color={color}>{source.toUpperCase()}</Tag>;
      },
    },
    {
      title: '블록체인',
      dataIndex: 'isOnchain',
      key: 'isOnchain',
      width: 100,
      filters: [
        { text: '온체인', value: true },
        { text: '오프체인', value: false },
      ],
      onFilter: (value, record) => record.isOnchain === value,
      render: (isOnchain) => {
        return isOnchain ? (
          <Tag color="green">온체인</Tag>
        ) : (
          <Tag color="orange">오프체인</Tag>
        );
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: '완료', value: 'completed' },
        { text: '대기중', value: 'pending' },
        { text: '처리중', value: 'processing' },
        { text: '실패', value: 'failed' },
        { text: '취소됨', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status.toLowerCase() === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: '지급 시간',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      sorter: (a, b) => moment(a.timestamp).unix() - moment(b.timestamp).unix(),
      render: (timestamp) => moment(timestamp).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '트랜잭션 해시',
      dataIndex: 'txHash',
      key: 'txHash',
      width: 120,
      render: (txHash) => {
        if (!txHash) return <span>-</span>;
        
        return (
          <Tooltip title={txHash}>
            <a
              href={`https://catena.explorer.creatachain.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash.substring(0, 6)}...{txHash.substring(txHash.length - 4)}
            </a>
          </Tooltip>
        );
      },
    },
    {
      title: '작업',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="상세 보기">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          
          {record.status === 'failed' && (
            <Tooltip title="재시도">
              <Button
                type="text"
                icon={<RedoOutlined />}
                onClick={() => onRetry(record)}
              />
            </Tooltip>
          )}
          
          {(record.status === 'pending' || record.status === 'processing') && (
            <>
              <Tooltip title="상태 확인">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  onClick={() => onCheckStatus(record)}
                />
              </Tooltip>
              
              <Tooltip title="취소">
                <Popconfirm
                  title="이 보상 지급을 취소하시겠습니까?"
                  onConfirm={() => onCancel(record)}
                  okText="예"
                  cancelText="아니오"
                >
                  <Button type="text" danger icon={<StopOutlined />} />
                </Popconfirm>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="reward-list">
      <div className="reward-list-header" style={{ marginBottom: 16 }}>
        <Input
          placeholder="보상 검색..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300, marginRight: 16 }}
          allowClear
        />
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredRewards}
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `총 ${total}개 보상`,
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default RewardList;
