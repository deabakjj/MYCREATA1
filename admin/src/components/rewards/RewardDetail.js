import React from 'react';
import {
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Divider,
  Timeline,
  Statistic,
  Table,
  Tooltip,
  Modal,
  Input,
  Form,
  message,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  PictureOutlined,
  ClockCircleOutlined,
  RedoOutlined,
  StopOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 보상 상세 정보 컴포넌트
 * 보상 지급에 대한 모든 세부 정보를 표시하는 컴포넌트
 */
const RewardDetail = ({ reward, loading, onRetry, onCancel, onCheckStatus }) => {
  const [cancelForm] = Form.useForm();

  if (!reward) {
    return <div>보상 정보를 불러오는 중입니다...</div>;
  }

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

  // 취소 모달 표시
  const showCancelModal = () => {
    Modal.confirm({
      title: '보상 지급 취소',
      icon: <ExclamationCircleOutlined />,
      content: (
        <Form form={cancelForm} layout="vertical">
          <Form.Item
            name="reason"
            label="취소 사유"
            rules={[{ required: true, message: '취소 사유를 입력해주세요' }]}
          >
            <TextArea rows={3} placeholder="취소 사유를 입력하세요" />
          </Form.Item>
        </Form>
      ),
      okText: '취소 확인',
      cancelText: '돌아가기',
      onOk: () => {
        cancelForm
          .validateFields()
          .then((values) => {
            onCancel(reward, values.reason);
            message.success('보상 지급이 취소되었습니다.');
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      },
    });
  };

  // 트랜잭션 이벤트 로그 항목
  const LogItem = ({ time, title, description, color, dot }) => (
    <Timeline.Item dot={dot} color={color}>
      <div>
        <Text strong>{title}</Text>
        <div>
          <Text type="secondary">{moment(time).format('YYYY-MM-DD HH:mm:ss')}</Text>
        </div>
        {description && <div style={{ marginTop: 8 }}>{description}</div>}
      </div>
    </Timeline.Item>
  );

  // NFT 메타데이터 테이블 컬럼
  const metadataColumns = [
    {
      title: '키',
      dataIndex: 'key',
      key: 'key',
      width: '30%',
    },
    {
      title: '값',
      dataIndex: 'value',
      key: 'value',
      render: (value) => {
        if (typeof value === 'object') {
          return <pre>{JSON.stringify(value, null, 2)}</pre>;
        }
        return value;
      },
    },
  ];

  // NFT 메타데이터 테이블 데이터
  const getMetadataTableData = (metadata) => {
    if (!metadata) return [];
    
    return Object.entries(metadata).map(([key, value], index) => ({
      key: index,
      key: key,
      value: value,
    }));
  };

  return (
    <div className="reward-detail">
      <Card>
        <Row gutter={24}>
          {/* 왼쪽: 기본 정보 */}
          <Col span={16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <Space direction="vertical" size={0}>
                <Title level={4} style={{ margin: 0 }}>
                  보상 ID: {reward.id}
                </Title>
                <Space size="small">
                  <Tag color={getRewardTypeColor(reward.type)}>
                    {reward.type.toUpperCase()}
                  </Tag>
                  <Tag color={getStatusColor(reward.status)}>
                    {reward.status.toUpperCase()}
                  </Tag>
                  {reward.isOnchain ? (
                    <Tag color="green">온체인</Tag>
                  ) : (
                    <Tag color="orange">오프체인</Tag>
                  )}
                </Space>
              </Space>

              <Space>
                {reward.status === 'failed' && (
                  <Button
                    type="primary"
                    icon={<RedoOutlined />}
                    onClick={() => onRetry(reward)}
                  >
                    재시도
                  </Button>
                )}
                
                {(reward.status === 'pending' || reward.status === 'processing') && (
                  <>
                    <Button
                      icon={<CheckOutlined />}
                      onClick={() => onCheckStatus(reward)}
                    >
                      상태 확인
                    </Button>
                    
                    <Button
                      danger
                      icon={<StopOutlined />}
                      onClick={showCancelModal}
                    >
                      취소
                    </Button>
                  </>
                )}
              </Space>
            </div>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="보상 유형" span={1}>
                <Tag color={getRewardTypeColor(reward.type)}>
                  {reward.type.toUpperCase()}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="소스" span={1}>
                <Tag color={
                  reward.source === 'mission' ? 'blue' :
                  reward.source === 'admin' ? 'purple' :
                  reward.source === 'system' ? 'cyan' :
                  reward.source === 'airdrop' ? 'gold' : 'default'
                }>
                  {reward.source.toUpperCase()}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="사용자" span={2}>
                <Space size="small">
                  <UserOutlined /> {reward.user?.name}
                  {reward.user?.nestId && (
                    <Tag color="blue">{reward.user.nestId}</Tag>
                  )}
                  <Text copyable={{ text: reward.user?.wallet?.address }}>
                    {reward.user?.wallet?.address.substring(0, 6)}...{reward.user?.wallet?.address.substring(reward.user?.wallet?.address.length - 4)}
                  </Text>
                </Space>
              </Descriptions.Item>

              {reward.type === 'token' && (
                <Descriptions.Item label="토큰 금액" span={2}>
                  <Text strong style={{ fontSize: 16 }}>
                    {reward.amount} NEST
                  </Text>
                  {reward.amount < 0 && <Tag color="red">차감</Tag>}
                </Descriptions.Item>
              )}

              {reward.type === 'xp' && (
                <Descriptions.Item label="XP 금액" span={2}>
                  <Text strong style={{ fontSize: 16 }}>
                    {reward.amount} XP
                  </Text>
                  {reward.amount < 0 && <Tag color="red">차감</Tag>}
                </Descriptions.Item>
              )}

              {(reward.type === 'nft' || reward.type === 'badge') && (
                <Descriptions.Item label="NFT ID" span={2}>
                  <Text copyable>
                    {reward.tokenId}
                  </Text>
                </Descriptions.Item>
              )}

              <Descriptions.Item label="지급 시간" span={1}>
                {moment(reward.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>

              <Descriptions.Item label="완료 시간" span={1}>
                {reward.completedAt ? (
                  moment(reward.completedAt).format('YYYY-MM-DD HH:mm:ss')
                ) : (
                  '미완료'
                )}
              </Descriptions.Item>

              <Descriptions.Item label="사유" span={2}>
                {reward.reason}
              </Descriptions.Item>

              {reward.missionId && (
                <Descriptions.Item label="미션 정보" span={2}>
                  <Space direction="vertical">
                    <Text>미션 ID: {reward.missionId}</Text>
                    {reward.missionTitle && <Text>미션 제목: {reward.missionTitle}</Text>}
                  </Space>
                </Descriptions.Item>
              )}

              {reward.txHash && (
                <Descriptions.Item label="트랜잭션 해시" span={2}>
                  <Text copyable={{ text: reward.txHash }}>
                    <a
                      href={`https://catena.explorer.creatachain.com/tx/${reward.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {reward.txHash}
                    </a>
                  </Text>
                </Descriptions.Item>
              )}

              {reward.blockNumber && (
                <Descriptions.Item label="블록 번호" span={2}>
                  <a
                    href={`https://catena.explorer.creatachain.com/block/${reward.blockNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {reward.blockNumber}
                  </a>
                </Descriptions.Item>
              )}

              {reward.error && (
                <Descriptions.Item label="오류 메시지" span={2}>
                  <Text type="danger">{reward.error}</Text>
                </Descriptions.Item>
              )}

              {reward.cancelReason && (
                <Descriptions.Item label="취소 사유" span={2}>
                  <Text type="secondary">{reward.cancelReason}</Text>
                </Descriptions.Item>
              )}

              {reward.adminId && (
                <Descriptions.Item label="처리 관리자" span={2}>
                  {reward.adminName || reward.adminId}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 거래 로그 타임라인 */}
            {reward.logs && reward.logs.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Divider orientation="left">이벤트 로그</Divider>
                <Timeline mode="left">
                  {reward.logs.map((log, index) => (
                    <LogItem
                      key={index}
                      time={log.timestamp}
                      title={log.event}
                      description={log.description}
                      color={
                        log.event.includes('error') || log.event.includes('fail')
                          ? 'red'
                          : log.event.includes('complete')
                          ? 'green'
                          : log.event.includes('cancel')
                          ? 'gray'
                          : 'blue'
                      }
                      dot={
                        log.event.includes('error') || log.event.includes('fail') ? (
                          <ExclamationCircleOutlined style={{ fontSize: '16px' }} />
                        ) : null
                      }
                    />
                  ))}
                </Timeline>
              </div>
            )}
          </Col>

          {/* 오른쪽: NFT 미리보기, 메타데이터 */}
          <Col span={8}>
            {(reward.type === 'nft' || reward.type === 'badge') && reward.metadata && (
              <>
                {reward.metadata.image && (
                  <Card
                    title="NFT 이미지"
                    bordered={false}
                    style={{ marginBottom: 16 }}
                    cover={
                      <img
                        alt={reward.metadata.name || 'NFT'}
                        src={reward.metadata.image}
                        style={{ maxWidth: '100%', maxHeight: 300 }}
                      />
                    }
                  >
                    <Card.Meta
                      title={reward.metadata.name}
                      description={reward.metadata.description}
                    />
                  </Card>
                )}

                <Card title="NFT 메타데이터" bordered={false}>
                  <Table
                    columns={metadataColumns}
                    dataSource={getMetadataTableData(reward.metadata)}
                    pagination={false}
                    size="small"
                    scroll={{ y: 300 }}
                  />
                </Card>
              </>
            )}

            {reward.type === 'token' && (
              <Card bordered={false}>
                <Statistic
                  title="총 토큰 잔액 (지급 후)"
                  value={reward.user?.wallet?.tokenBalance || 0}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix="NEST"
                />
              </Card>
            )}

            {reward.type === 'xp' && (
              <Card bordered={false}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="현재 레벨"
                      value={reward.user?.level || 0}
                      prefix={<TrophyOutlined />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="총 XP"
                      value={reward.user?.xp || 0}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              </Card>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RewardDetail;
