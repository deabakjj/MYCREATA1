import React from 'react';
import { Typography, Descriptions, Tag, Button, Card, Divider, Statistic, Row, Col, Space, Table } from 'antd';
import { UserOutlined, TrophyOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';

const { Title, Text } = Typography;

/**
 * 미션 상세 정보 컴포넌트
 * 특정 미션의 모든 세부 정보와 통계를 표시
 */
const MissionDetail = ({ mission, onEdit, onDelete, onDuplicate, participationStats }) => {
  if (!mission) {
    return <div>미션 정보를 불러오는 중입니다...</div>;
  }

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

  // 참여자 통계 컬럼 정의
  const participantColumns = [
    {
      title: '사용자 ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: '사용자 이름',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '완료 시간',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '획득 XP',
      dataIndex: 'xpAwarded',
      key: 'xpAwarded',
    },
    {
      title: '획득 NEST',
      dataIndex: 'tokenAwarded',
      key: 'tokenAwarded',
    },
    {
      title: 'NFT 획득',
      dataIndex: 'nftAwarded',
      key: 'nftAwarded',
      render: (awarded) => (awarded ? <Tag color="geekblue">획득</Tag> : <Tag>미획득</Tag>),
    },
  ];

  return (
    <div className="mission-detail">
      <Card
        title={
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>{mission.title}</Title>
            <Tag color={getStatusColor(mission.status)}>{mission.status.toUpperCase()}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<EditOutlined />} onClick={() => onEdit(mission)}>
              수정
            </Button>
            <Button icon={<CopyOutlined />} onClick={() => onDuplicate(mission)}>
              복제
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(mission)}>
              삭제
            </Button>
          </Space>
        }
      >
        <Row gutter={24}>
          <Col span={16}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="ID" span={2}>
                {mission.id}
              </Descriptions.Item>
              <Descriptions.Item label="난이도">
                <Tag color={getDifficultyColor(mission.difficulty)}>
                  {mission.difficulty.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="공개 여부">
                <Tag color={mission.isPublic ? 'green' : 'orange'}>
                  {mission.isPublic ? '공개' : '비공개'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="생성일" span={2}>
                {moment(mission.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="기간" span={2}>
                {mission.startDate && mission.endDate ? (
                  <>
                    {moment(mission.startDate).format('YYYY-MM-DD HH:mm')} ~ 
                    {moment(mission.endDate).format('YYYY-MM-DD HH:mm')}
                  </>
                ) : (
                  '무기한'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="XP 보상">
                {mission.xpReward || 0}
              </Descriptions.Item>
              <Descriptions.Item label="NEST 보상">
                {mission.tokenReward || 0}
              </Descriptions.Item>
              <Descriptions.Item label="NFT 보상" span={2}>
                {mission.nftReward ? (
                  <Space>
                    <Text>{mission.nftReward.name}</Text>
                    <Text type="secondary">({mission.nftReward.maxSupply} 발행)</Text>
                    {mission.nftReward.imageUrl && (
                      <img 
                        src={mission.nftReward.imageUrl} 
                        alt={mission.nftReward.name} 
                        style={{ maxHeight: '40px', maxWidth: '40px' }}
                      />
                    )}
                  </Space>
                ) : (
                  <Text type="secondary">없음</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="사용 AI 모델">
                {mission.aiModel || 'GPT-4'}
              </Descriptions.Item>
              <Descriptions.Item label="최대 토큰 수">
                {mission.maxTokens || '제한 없음'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">미션 설명</Divider>
            <div
              className="mission-description"
              style={{
                padding: 16,
                border: '1px solid #d9d9d9',
                borderRadius: 2,
                minHeight: 200,
              }}
            >
              <ReactMarkdown>{mission.description}</ReactMarkdown>
            </div>

            <Divider orientation="left">AI 프롬프트</Divider>
            <div
              className="ai-prompt"
              style={{
                padding: 16,
                border: '1px solid #d9d9d9',
                borderRadius: 2,
                fontFamily: 'monospace',
              }}
            >
              {mission.aiPrompt || '프롬프트가 설정되지 않았습니다.'}
            </div>
          </Col>

          <Col span={8}>
            <Card title="미션 통계" bordered={false}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="총 참여자"
                    value={mission.participantCount || 0}
                    prefix={<UserOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="완료율"
                    value={
                      mission.participantCount && mission.completionCount
                        ? Math.round((mission.completionCount / mission.participantCount) * 100)
                        : 0
                    }
                    suffix="%"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="총 지급 XP"
                    value={mission.totalXpAwarded || 0}
                    prefix={<TrophyOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="총 지급 NEST"
                    value={mission.totalTokenAwarded || 0}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="NFT 발행량"
                    value={mission.nftMintedCount || 0}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="평균 완료 시간"
                    value={mission.averageCompletionTime || 0}
                    suffix="분"
                  />
                </Col>
              </Row>
            </Card>

            {mission.participantCount > 0 && (
              <Card title="최근 참여자" style={{ marginTop: 16 }} bordered={false}>
                <Table
                  columns={participantColumns}
                  dataSource={participationStats || []}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  scroll={{ x: 'max-content' }}
                />
              </Card>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default MissionDetail;
