import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Tooltip, Popconfirm } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined } from '@ant-design/icons';
import moment from 'moment';

/**
 * 미션 목록 컴포넌트
 * 관리자가 모든 미션을 보고 관리할 수 있는 테이블 형태의 UI
 */
const MissionList = ({ missions, loading, onEdit, onDelete, onView, onDuplicate }) => {
  const [searchText, setSearchText] = useState('');
  const [filteredMissions, setFilteredMissions] = useState([]);

  useEffect(() => {
    if (missions) {
      setFilteredMissions(missions);
    }
  }, [missions]);

  // 검색 기능 구현
  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredMissions(missions);
      return;
    }

    const filtered = missions.filter(
      (mission) =>
        mission.title.toLowerCase().includes(value.toLowerCase()) ||
        mission.description.toLowerCase().includes(value.toLowerCase()) ||
        mission.status.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMissions(filtered);
  };

  // 미션 상태에 따른 태그 색상
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'draft':
        return 'blue';
      case 'completed':
        return 'gray';
      case 'scheduled':
        return 'purple';
      default:
        return 'default';
    }
  };

  // 난이도에 따른 태그 색상
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'green';
      case 'medium':
        return 'orange';
      case 'hard':
        return 'red';
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
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: (text) => <a>{text}</a>,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: '활성', value: 'active' },
        { text: '초안', value: 'draft' },
        { text: '완료', value: 'completed' },
        { text: '예약됨', value: 'scheduled' },
      ],
      onFilter: (value, record) => record.status.toLowerCase() === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: '난이도',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      filters: [
        { text: '쉬움', value: 'easy' },
        { text: '중간', value: 'medium' },
        { text: '어려움', value: 'hard' },
      ],
      onFilter: (value, record) => record.difficulty.toLowerCase() === value,
      render: (difficulty) => (
        <Tag color={getDifficultyColor(difficulty)}>{difficulty.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'XP 보상',
      dataIndex: 'xpReward',
      key: 'xpReward',
      width: 100,
      sorter: (a, b) => a.xpReward - b.xpReward,
    },
    {
      title: 'NEST 보상',
      dataIndex: 'tokenReward',
      key: 'tokenReward',
      width: 120,
      sorter: (a, b) => a.tokenReward - b.tokenReward,
    },
    {
      title: 'NFT 보상',
      dataIndex: 'nftReward',
      key: 'nftReward',
      width: 100,
      render: (hasNft) => (hasNft ? <Tag color="geekblue">있음</Tag> : <Tag>없음</Tag>),
    },
    {
      title: '참여자 수',
      dataIndex: 'participantCount',
      key: 'participantCount',
      width: 100,
      sorter: (a, b) => a.participantCount - b.participantCount,
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
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
          <Tooltip title="수정">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="복제">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => onDuplicate(record)}
            />
          </Tooltip>
          <Tooltip title="삭제">
            <Popconfirm
              title="이 미션을 삭제하시겠습니까?"
              onConfirm={() => onDelete(record)}
              okText="예"
              cancelText="아니오"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="mission-list">
      <div className="mission-list-header" style={{ marginBottom: 16 }}>
        <Input
          placeholder="미션 검색..."
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
        dataSource={filteredMissions}
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `총 ${total}개 미션`,
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default MissionList;
