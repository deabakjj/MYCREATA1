import React, { useState } from 'react';
import {
  Card,
  Descriptions,
  Badge,
  Tabs,
  Tag,
  Divider,
  Button,
  Space,
  Avatar,
  Typography,
  Table,
  Row,
  Col,
  Statistic,
  Timeline,
  List,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
} from 'antd';
import {
  UserOutlined,
  WalletOutlined,
  MailOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  DollarOutlined,
  PlusOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

/**
 * 사용자 상세 정보 컴포넌트
 * 사용자의 모든 세부 정보와 통계, 활동 내역, 보유 자산 등을 표시
 */
const UserDetail = ({ user, onAdjustXp, onIssueTokens, onToggleStatus, onManageNestId }) => {
  const [isXpModalVisible, setIsXpModalVisible] = useState(false);
  const [isTokenModalVisible, setIsTokenModalVisible] = useState(false);
  const [isNestIdModalVisible, setIsNestIdModalVisible] = useState(false);
  const [xpForm] = Form.useForm();
  const [tokenForm] = Form.useForm();
  const [nestIdForm] = Form.useForm();

  if (!user) {
    return <div>사용자 정보를 불러오는 중입니다...</div>;
  }

  // 사용자 상태에 따른 뱃지 색상
  const getStatusBadgeStatus = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'pending':
        return 'processing';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  // NFT 목록 컬럼 정의
  const nftColumns = [
    {
      title: 'NFT',
      dataIndex: 'image',
      key: 'image',
      render: (image, nft) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={image || 'https://via.placeholder.com/40'}
            alt={nft.name}
            style={{ width: 40, height: 40, borderRadius: 4, marginRight: 8 }}
          />
          <span>{nft.name}</span>
        </div>
      ),
    },
    {
      title: '획득일',
      dataIndex: 'acquiredAt',
      key: 'acquiredAt',
      render: (date) => moment(date).format('YYYY-MM-DD'),
    },
    {
      title: '발행처',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: '희귀도',
      dataIndex: 'rarity',
      key: 'rarity',
      render: (rarity) => {
        let color = 'green';
        if (rarity === 'rare') color = 'blue';
        if (rarity === 'epic') color = 'purple';
        if (rarity === 'legendary') color = 'gold';
        return <Tag color={color}>{rarity.toUpperCase()}</Tag>;
      },
    },
    {
      title: '토큰 ID',
      dataIndex: 'tokenId',
      key: 'tokenId',
      render: (tokenId) => (
        <Text ellipsis style={{ maxWidth: 120 }} copyable>
          {tokenId}
        </Text>
      ),
    },
  ];

  // 활동 내역 컬럼 정의
  const activityColumns = [
    {
      title: '활동 시간',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '활동 유형',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = 'blue';
        if (type === 'login') color = 'green';
        if (type === 'mission_complete') color = 'purple';
        if (type === 'reward_received') color = 'gold';
        if (type === 'token_transaction') color = 'cyan';
        return <Tag color={color}>{type.toUpperCase().replace('_', ' ')}</Tag>;
      },
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '관련 데이터',
      dataIndex: 'metadata',
      key: 'metadata',
      render: (metadata) => {
        if (!metadata) return null;
        return Object.entries(metadata).map(([key, value]) => (
          <div key={key}>
            <Text type="secondary">{key}: </Text>
            <Text>{value}</Text>
          </div>
        ));
      },
    },
  ];

  // 토큰 거래 내역 컬럼 정의
  const transactionColumns = [
    {
      title: '거래 시간',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const color = type === 'receive' ? 'green' : 'red';
        return <Tag color={color}>{type === 'receive' ? '받음' : '보냄'}</Tag>;
      },
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <Text
          style={{ color: record.type === 'receive' ? '#52c41a' : '#f5222d' }}
          strong
        >
          {record.type === 'receive' ? '+' : '-'}{amount} NEST
        </Text>
      ),
    },
    {
      title: '상대방',
      dataIndex: 'counterparty',
      key: 'counterparty',
      render: (counterparty) => (
        counterparty ? (
          <Text ellipsis style={{ maxWidth: 120 }} copyable>
            {counterparty}
          </Text>
        ) : (
          <Text type="secondary">시스템</Text>
        )
      ),
    },
    {
      title: '메모',
      dataIndex: 'memo',
      key: 'memo',
    },
    {
      title: '트랜잭션 해시',
      dataIndex: 'txHash',
      key: 'txHash',
      render: (txHash) => (
        txHash ? (
          <Text ellipsis style={{ maxWidth: 120 }} copyable>
            {txHash}
          </Text>
        ) : (
          <Text type="secondary">오프체인</Text>
        )
      ),
    },
  ];

  // XP 조정 모달 처리
  const showXpModal = () => {
    xpForm.resetFields();
    setIsXpModalVisible(true);
  };

  const handleXpSubmit = (values) => {
    onAdjustXp(user.id, values);
    setIsXpModalVisible(false);
    message.success('XP가 성공적으로 조정되었습니다.');
  };

  // 토큰 지급 모달 처리
  const showTokenModal = () => {
    tokenForm.resetFields();
    setIsTokenModalVisible(true);
  };

  const handleTokenSubmit = (values) => {
    onIssueTokens(user.id, values);
    setIsTokenModalVisible(false);
    message.success('토큰이 성공적으로 지급되었습니다.');
  };

  // Nest ID 관리 모달 처리
  const showNestIdModal = () => {
    nestIdForm.setFieldsValue({ nestId: user.nestId || '' });
    setIsNestIdModalVisible(true);
  };

  const handleNestIdSubmit = (values) => {
    onManageNestId(user.id, values);
    setIsNestIdModalVisible(false);
    message.success('Nest ID가 성공적으로 업데이트되었습니다.');
  };

  return (
    <div className="user-detail">
      <Card>
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar
                src={user.avatar}
                size={120}
                icon={<UserOutlined />}
                style={{ backgroundColor: user.avatarColor || '#1890ff' }}
              />
              <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                {user.name}
              </Title>
              <Text type="secondary">{user.email}</Text>
              <div style={{ margin: '16px 0' }}>
                <Badge status={getStatusBadgeStatus(user.status)} text={user.status.toUpperCase()} />
              </div>
              <Space>
                <Button
                  type={user.isActive ? 'default' : 'primary'}
                  icon={user.isActive ? <LockOutlined /> : <UnlockOutlined />}
                  onClick={() => onToggleStatus(user, !user.isActive)}
                >
                  {user.isActive ? '비활성화' : '활성화'}
                </Button>
                <Button type="default" icon={<EditOutlined />}>
                  수정
                </Button>
              </Space>
            </div>
          </Col>

          <Col span={18}>
            <Descriptions bordered size="small" column={3}>
              <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
              <Descriptions.Item label="Nest ID">
                <Space>
                  {user.nestId ? (
                    <Tag color="blue">{user.nestId}</Tag>
                  ) : (
                    <Tag color="gray">없음</Tag>
                  )}
                  <Button type="link" size="small" onClick={showNestIdModal}>
                    관리
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="가입 소스">
                <Tag>{user.authProvider || 'email'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="가입일">
                {moment(user.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="최근 로그인">
                {moment(user.lastLoginAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="최근 활동">
                {moment(user.lastActive).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="지갑 주소" span={3}>
                <Text copyable>{user.wallet?.address || '지갑이 없습니다.'}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="레벨"
                    value={user.level}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Button type="link" size="small" onClick={showXpModal} style={{ marginTop: 8 }}>
                    XP 조정
                  </Button>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="XP"
                    value={user.xp}
                    precision={0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                    다음 레벨까지: {user.xpToNextLevel}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="NEST 토큰"
                    value={user.wallet?.tokenBalance || 0}
                    precision={0}
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Button type="link" size="small" onClick={showTokenModal} style={{ marginTop: 8 }}>
                    토큰 지급
                  </Button>
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="NFT 보유량"
                    value={user.wallet?.nftCount || 0}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider />

        <Tabs defaultActiveKey="activity">
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined />
                활동 내역
              </span>
            }
            key="activity"
          >
            <Table
              columns={activityColumns}
              dataSource={user.activities || []}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <TrophyOutlined />
                NFT 컬렉션
              </span>
            }
            key="nfts"
          >
            <Table
              columns={nftColumns}
              dataSource={user.nfts || []}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <WalletOutlined />
                토큰 거래 내역
              </span>
            }
            key="transactions"
          >
            <Table
              columns={transactionColumns}
              dataSource={user.transactions || []}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                <MailOutlined />
                미션 참여 내역
              </span>
            }
            key="missions"
          >
            <List
              itemLayout="horizontal"
              dataSource={user.missionParticipations || []}
              pagination={{ pageSize: 5 }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag color="blue">{item.status}</Tag>,
                    <Text>{moment(item.participatedAt).format('YYYY-MM-DD')}</Text>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.missionTitle}
                    description={
                      <Space>
                        <Tag color="green">+{item.xpAwarded} XP</Tag>
                        <Tag color="gold">+{item.tokenAwarded} NEST</Tag>
                        {item.nftAwarded && <Tag color="purple">NFT 획득</Tag>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* XP 조정 모달 */}
      <Modal
        title="XP 조정"
        open={isXpModalVisible}
        onCancel={() => setIsXpModalVisible(false)}
        footer={null}
      >
        <Form form={xpForm} layout="vertical" onFinish={handleXpSubmit}>
          <Form.Item
            name="amount"
            label="XP 금액"
            rules={[{ required: true, message: 'XP 금액을 입력해주세요' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="양수는 지급, 음수는 차감"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="사유"
            rules={[{ required: true, message: '조정 사유를 입력해주세요' }]}
          >
            <Input.TextArea rows={3} placeholder="XP 조정 사유를 입력하세요" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                XP 조정 적용
              </Button>
              <Button onClick={() => setIsXpModalVisible(false)}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 토큰 지급 모달 */}
      <Modal
        title="NEST 토큰 지급"
        open={isTokenModalVisible}
        onCancel={() => setIsTokenModalVisible(false)}
        footer={null}
      >
        <Form form={tokenForm} layout="vertical" onFinish={handleTokenSubmit}>
          <Form.Item
            name="amount"
            label="토큰 금액"
            rules={[{ required: true, message: '토큰 금액을 입력해주세요' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="양수는 지급, 음수는 차감"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              min={-10000000}
              max={10000000}
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="사유"
            rules={[{ required: true, message: '지급 사유를 입력해주세요' }]}
          >
            <Input.TextArea rows={3} placeholder="토큰 지급 사유를 입력하세요" />
          </Form.Item>
          <Form.Item
            name="isOnchain"
            label="블록체인 기록"
            initialValue={false}
            valuePropName="checked"
          >
            <Select>
              <Option value={false}>오프체인 처리 (내부 DB만 기록)</Option>
              <Option value={true}>온체인 처리 (블록체인에 기록)</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<DollarOutlined />}>
                토큰 지급 실행
              </Button>
              <Button onClick={() => setIsTokenModalVisible(false)}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Nest ID 관리 모달 */}
      <Modal
        title="Nest ID 관리"
        open={isNestIdModalVisible}
        onCancel={() => setIsNestIdModalVisible(false)}
        footer={null}
      >
        <Form form={nestIdForm} layout="vertical" onFinish={handleNestIdSubmit}>
          <Form.Item
            name="nestId"
            label="Nest ID"
            rules={[
              { 
                pattern: /^[a-z0-9_]+$/i,
                message: '영문자, 숫자, 언더스코어(_)만 사용할 수 있습니다'
              }
            ]}
            extra="사용자의 Nest ID는 고유해야 하며, '.nest' 접미사는 자동으로 추가됩니다."
          >
            <Input 
              placeholder="nestId" 
              addonAfter=".nest"
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                저장
              </Button>
              <Button onClick={() => setIsNestIdModalVisible(false)}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserDetail;
