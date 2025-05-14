import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Input, Tooltip, Switch, Avatar, Badge } from 'antd';
import { SearchOutlined, EditOutlined, EyeOutlined, StopOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import moment from 'moment';

/**
 * 사용자 목록 컴포넌트
 * 관리자가 모든 사용자를 보고 관리할 수 있는 테이블 형태의 UI
 */
const UserList = ({ users, loading, onView, onEdit, onToggleStatus }) => {
  const [searchText, setSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    if (users) {
      setFilteredUsers(users);
    }
  }, [users]);

  // 검색 기능 구현
  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(value.toLowerCase()) ||
        user.email?.toLowerCase().includes(value.toLowerCase()) ||
        user.nestId?.toLowerCase().includes(value.toLowerCase()) ||
        user.wallet?.address?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // 사용자 레벨에 따른 태그 색상
  const getLevelColor = (level) => {
    if (level >= 50) return 'gold';
    if (level >= 30) return 'purple';
    if (level >= 20) return 'blue';
    if (level >= 10) return 'cyan';
    return 'green';
  };

  // 상태에 따른 태그 색상
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'red';
      case 'pending':
        return 'orange';
      case 'blocked':
        return 'black';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: '프로필',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 60,
      render: (avatar, record) => (
        <Avatar
          src={avatar}
          size="large"
          style={{ backgroundColor: record.avatarColor || '#1890ff' }}
        >
          {!avatar && record.name ? record.name.charAt(0).toUpperCase() : 'U'}
        </Avatar>
      ),
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <span>{name}</span>
          <span style={{ fontSize: '12px', color: '#999' }}>{record.email}</span>
        </Space>
      ),
    },
    {
      title: 'Nest ID',
      dataIndex: 'nestId',
      key: 'nestId',
      render: (nestId) => nestId ? <Tag color="blue">{nestId}</Tag> : <Tag color="gray">없음</Tag>,
    },
    {
      title: '지갑 주소',
      dataIndex: ['wallet', 'address'],
      key: 'walletAddress',
      ellipsis: true,
      width: 160,
      render: (address) => (
        <Tooltip title={address}>
          {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '-'}
        </Tooltip>
      ),
    },
    {
      title: '레벨',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      sorter: (a, b) => a.level - b.level,
      render: (level) => <Tag color={getLevelColor(level)}>Lv.{level}</Tag>,
    },
    {
      title: 'XP',
      dataIndex: 'xp',
      key: 'xp',
      width: 100,
      sorter: (a, b) => a.xp - b.xp,
    },
    {
      title: 'NEST 보유량',
      dataIndex: ['wallet', 'tokenBalance'],
      key: 'tokenBalance',
      width: 120,
      sorter: (a, b) => a.wallet?.tokenBalance - b.wallet?.tokenBalance,
    },
    {
      title: 'NFT 보유',
      dataIndex: ['wallet', 'nftCount'],
      key: 'nftCount',
      width: 100,
      sorter: (a, b) => a.wallet?.nftCount - b.wallet?.nftCount,
    },
    {
      title: '가입일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      render: (date) => moment(date).format('YYYY-MM-DD'),
    },
    {
      title: '최근 활동',
      dataIndex: 'lastActive',
      key: 'lastActive',
      width: 120,
      sorter: (a, b) => moment(a.lastActive).unix() - moment(b.lastActive).unix(),
      render: (date) => (
        <Tooltip title={moment(date).format('YYYY-MM-DD HH:mm:ss')}>
          {moment(date).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '활성', value: 'active' },
        { text: '비활성', value: 'inactive' },
        { text: '대기중', value: 'pending' },
        { text: '차단됨', value: 'blocked' },
      ],
      onFilter: (value, record) => record.status.toLowerCase() === value,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: '활성화',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => onToggleStatus(record, checked)}
          checkedChildren="활성"
          unCheckedChildren="비활성"
          disabled={record.status === 'blocked'}
        />
      ),
    },
    {
      title: '작업',
      key: 'action',
      width: 120,
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
          {record.status !== 'blocked' ? (
            <Tooltip title="차단">
              <Button
                type="text"
                danger
                icon={<StopOutlined />}
                onClick={() => onToggleStatus(record, false, 'blocked')}
              />
            </Tooltip>
          ) : (
            <Tooltip title="차단 해제">
              <Button
                type="text"
                icon={<UnlockOutlined />}
                onClick={() => onToggleStatus(record, true, 'active')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="user-list">
      <div className="user-list-header" style={{ marginBottom: 16 }}>
        <Input
          placeholder="사용자 검색..."
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
        dataSource={filteredUsers}
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `총 ${total}명의 사용자`,
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default UserList;
