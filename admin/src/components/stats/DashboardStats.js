import React from 'react';
import { Card, Row, Col, Statistic, Typography, Divider, Progress, Space, Tooltip } from 'antd';
import {
  UserOutlined,
  RiseOutlined,
  FallOutlined,
  DollarOutlined,
  TrophyOutlined,
  FileImageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * 대시보드 통계 컴포넌트
 * 관리자 대시보드에 표시할 핵심 통계 정보를 보여주는 컴포넌트
 */
const DashboardStats = ({ data, loading }) => {
  if (!data) {
    return <div>데이터를 불러오는 중입니다...</div>;
  }

  const {
    usersTotal,
    usersActive,
    usersGrowth,
    missionsTotal,
    missionsActive,
    missionsCompleted,
    tokensTotal,
    tokensCirculating,
    xpTotal,
    nftsTotal,
    retentionRate,
    conversionRate,
  } = data;

  // 통계 카드 공통 스타일
  const cardStyle = {
    height: '100%',
    borderRadius: '8px',
  };

  return (
    <div className="dashboard-stats">
      <Row gutter={[16, 16]}>
        {/* 사용자 통계 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card title="사용자" loading={loading} style={cardStyle}>
            <Statistic
              title="총 사용자"
              value={usersTotal}
              prefix={<UserOutlined />}
              loading={loading}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>활성 사용자</Text>
                <Text type="secondary">{usersActive}</Text>
              </div>
              <Progress
                percent={Math.round((usersActive / usersTotal) * 100)}
                size="small"
                status="active"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>전월 대비</Text>
                <Space>
                  {usersGrowth > 0 ? (
                    <RiseOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <FallOutlined style={{ color: '#f5222d' }} />
                  )}
                  <Text
                    style={{
                      color: usersGrowth > 0 ? '#52c41a' : '#f5222d',
                    }}
                  >
                    {usersGrowth > 0 ? '+' : ''}{usersGrowth}%
                  </Text>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 미션 통계 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card title="미션" loading={loading} style={cardStyle}>
            <Statistic
              title="총 미션"
              value={missionsTotal}
              prefix={<CheckCircleOutlined />}
              loading={loading}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>활성 미션</Text>
                <Text type="secondary">{missionsActive}</Text>
              </div>
              <Progress
                percent={Math.round((missionsActive / missionsTotal) * 100)}
                size="small"
                status="active"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>완료된 미션</Text>
                <Text type="secondary">{missionsCompleted}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 토큰 통계 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card title="NEST 토큰" loading={loading} style={cardStyle}>
            <Statistic
              title="총 발행량"
              value={tokensTotal}
              prefix={<DollarOutlined />}
              loading={loading}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>유통량</Text>
                <Text type="secondary">{tokensCirculating}</Text>
              </div>
              <Progress
                percent={Math.round((tokensCirculating / tokensTotal) * 100)}
                size="small"
                status="active"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Tooltip title="발행량 대비 유통량 비율">
                  <Space>
                    <Text>유통 비율</Text>
                    <InfoCircleOutlined />
                  </Space>
                </Tooltip>
                <Text type="secondary">
                  {Math.round((tokensCirculating / tokensTotal) * 100)}%
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* XP 통계 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card title="경험치 (XP)" loading={loading} style={cardStyle}>
            <Statistic
              title="총 지급 XP"
              value={xpTotal}
              prefix={<TrophyOutlined />}
              loading={loading}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>사용자 평균 XP</Text>
                <Text type="secondary">
                  {Math.round(xpTotal / usersTotal).toLocaleString()}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>미션당 평균 XP</Text>
                <Text type="secondary">
                  {Math.round(xpTotal / missionsTotal).toLocaleString()}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* NFT 통계 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card title="NFT" loading={loading} style={cardStyle}>
            <Statistic
              title="총 발행 NFT"
              value={nftsTotal}
              prefix={<FileImageOutlined />}
              loading={loading}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>사용자 평균 보유</Text>
                <Text type="secondary">
                  {(nftsTotal / usersTotal).toFixed(2)}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>NFT 보유 사용자</Text>
                <Text type="secondary">
                  {Math.round(usersTotal * 0.75).toLocaleString()} ({Math.round(0.75 * 100)}%)
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* 사용자 유지율 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card title="사용자 유지율" loading={loading} style={cardStyle}>
            <Statistic
              title="30일 유지율"
              value={`${retentionRate}%`}
              prefix={<TeamOutlined />}
              loading={loading}
              valueStyle={{
                color: retentionRate > 50 ? '#52c41a' : retentionRate > 30 ? '#faad14' : '#f5222d',
              }}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Progress
              percent={retentionRate}
              size="small"
              status={
                retentionRate > 50 ? 'success' : retentionRate > 30 ? 'normal' : 'exception'
              }
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                지난 30일 동안 서비스에 재방문한 사용자 비율입니다.
              </Text>
            </div>
          </Card>
        </Col>

        {/* Web2→Web3 전환율 */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card title="Web2→Web3 전환율" loading={loading} style={cardStyle}>
            <Statistic
              title="지갑 활성화율"
              value={`${conversionRate}%`}
              prefix={<RiseOutlined />}
              loading={loading}
              valueStyle={{
                color: conversionRate > 50 ? '#52c41a' : conversionRate > 30 ? '#faad14' : '#f5222d',
              }}
            />
            <Divider style={{ margin: '12px 0' }} />
            <Progress
              percent={conversionRate}
              size="small"
              status={
                conversionRate > 50 ? 'success' : conversionRate > 30 ? 'normal' : 'exception'
              }
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">
                Web2 사용자가 지갑을 활성화하고 Web3 기능을 적극적으로 사용하는 비율입니다.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardStats;
