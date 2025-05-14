import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Card,
  Space,
  Upload,
  Divider,
  Switch,
  Alert,
  Tooltip,
  Typography,
  Radio,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  TrophyOutlined,
  PictureOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

/**
 * 보상 지급 폼 컴포넌트
 * 관리자가 수동으로 보상을 지급할 때 사용하는 폼
 */
const RewardForm = ({ initialValues, onSubmit, onCancel, loading, userOptions }) => {
  const [form] = Form.useForm();
  const [rewardType, setRewardType] = useState(initialValues?.type || 'token');
  const [isOnchain, setIsOnchain] = useState(initialValues?.isOnchain || false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [fileList, setFileList] = useState([]);

  // 초기값 설정
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      setRewardType(initialValues.type);
      setIsOnchain(initialValues.isOnchain);
    }
  }, [initialValues, form]);

  // 보상 유형 변경 처리
  const handleRewardTypeChange = (value) => {
    setRewardType(value);
    // 보상 유형에 따라 필드 초기화
    form.setFieldsValue({
      amount: undefined,
      tokenId: undefined,
      metadata: undefined,
    });
  };

  // 사용자 선택 변경 처리
  const handleUserSelectChange = (value) => {
    setSelectedUserIds(value);
  };

  // 일괄 지급 모드 전환
  const handleBatchModeToggle = (checked) => {
    setIsBatchMode(checked);
    // 일괄 지급 모드로 전환 시 사용자 선택 필드 초기화
    if (checked) {
      form.setFieldsValue({ userIds: [] });
      setSelectedUserIds([]);
    } else {
      form.setFieldsValue({ batchFile: undefined });
      setFileList([]);
    }
  };

  // 엑셀 파일 업로드 처리
  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
    
    // 파일이 있으면 form 값 설정
    if (fileList.length > 0) {
      form.setFieldsValue({ batchFile: fileList[0] });
    } else {
      form.setFieldsValue({ batchFile: undefined });
    }
  };

  // 폼 제출 처리
  const handleSubmit = (values) => {
    // 일괄 지급 모드인 경우 파일 데이터 추가
    if (isBatchMode && fileList.length > 0) {
      values.batchFile = fileList[0];
    }
    
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        type: 'token',
        isOnchain: false,
        userIds: [],
        amount: undefined,
      }}
    >
      <Row gutter={24}>
        {/* 왼쪽 컬럼 - 기본 정보 */}
        <Col span={12}>
          <Card title="보상 기본 정보" bordered={false}>
            {/* 일괄 지급 모드 스위치 */}
            <Form.Item
              label={
                <Space>
                  <span>일괄 지급 모드</span>
                  <Tooltip title="다수의 사용자에게 보상을 일괄 지급합니다. Excel/CSV 파일을 업로드하세요.">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Switch
                checked={isBatchMode}
                onChange={handleBatchModeToggle}
                checkedChildren="일괄 지급"
                unCheckedChildren="개별 지급"
              />
            </Form.Item>

            {/* 개별 지급 모드 - 사용자 선택 */}
            {!isBatchMode && (
              <Form.Item
                name="userIds"
                label="사용자"
                rules={[{ required: true, message: '사용자를 선택해주세요' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="보상을 지급할 사용자를 선택하세요"
                  options={userOptions}
                  onChange={handleUserSelectChange}
                  optionFilterProp="label"
                  showSearch
                  style={{ width: '100%' }}
                />
              </Form.Item>
            )}

            {/* 일괄 지급 모드 - 파일 업로드 */}
            {isBatchMode && (
              <>
                <Form.Item
                  name="batchFile"
                  label="일괄 지급 파일"
                  rules={[{ required: true, message: '엑셀/CSV 파일을 업로드해주세요' }]}
                  extra="파일에는 각 행마다 사용자ID, 보상유형, 금액, 사유가 포함되어야 합니다."
                >
                  <Upload
                    accept=".xlsx,.xls,.csv"
                    maxCount={1}
                    fileList={fileList}
                    onChange={handleFileChange}
                    beforeUpload={() => false} // 수동 업로드 모드
                  >
                    <Button icon={<FileExcelOutlined />}>엑셀/CSV 파일 업로드</Button>
                  </Upload>
                </Form.Item>

                <Alert
                  message="파일 형식 안내"
                  description={
                    <>
                      <p>다음 열을 포함한 Excel 또는 CSV 파일을 업로드하세요:</p>
                      <ul>
                        <li>user_id 또는 nest_id (필수): 사용자 ID 또는 Nest ID</li>
                        <li>type (필수): 보상 유형 (token, xp, nft, badge)</li>
                        <li>amount (토큰/XP 필수): 지급할 금액</li>
                        <li>reason (필수): 지급 사유</li>
                        <li>is_onchain (선택): 온체인 여부 (true/false)</li>
                      </ul>
                      <a href="/samples/batch_reward_template.xlsx" download>
                        템플릿 다운로드
                      </a>
                    </>
                  }
                  type="info"
                  showIcon
                />
              </>
            )}

            {/* 공통 필드 - 보상 유형 */}
            {!isBatchMode && (
              <>
                <Form.Item
                  name="type"
                  label="보상 유형"
                  rules={[{ required: true, message: '보상 유형을 선택해주세요' }]}
                >
                  <Radio.Group onChange={(e) => handleRewardTypeChange(e.target.value)}>
                    <Space direction="vertical">
                      <Radio value="token">
                        <Space>
                          <DollarOutlined />
                          <span>NEST 토큰</span>
                        </Space>
                      </Radio>
                      <Radio value="xp">
                        <Space>
                          <TrophyOutlined />
                          <span>경험치 (XP)</span>
                        </Space>
                      </Radio>
                      <Radio value="nft">
                        <Space>
                          <PictureOutlined />
                          <span>NFT</span>
                        </Space>
                      </Radio>
                      <Radio value="badge">
                        <Space>
                          <PictureOutlined />
                          <span>뱃지</span>
                        </Space>
                      </Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                {/* 토큰 보상 필드 */}
                {rewardType === 'token' && (
                  <Form.Item
                    name="amount"
                    label="토큰 금액"
                    rules={[{ required: true, message: '토큰 금액을 입력해주세요' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="지급할 NEST 토큰 금액"
                      addonAfter="NEST"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                )}

                {/* XP 보상 필드 */}
                {rewardType === 'xp' && (
                  <Form.Item
                    name="amount"
                    label="XP 금액"
                    rules={[{ required: true, message: 'XP 금액을 입력해주세요' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="지급할 XP 금액"
                      addonAfter="XP"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                )}

                {/* NFT/뱃지 보상 필드 */}
                {(rewardType === 'nft' || rewardType === 'badge') && (
                  <>
                    <Form.Item
                      name="nftTemplate"
                      label="NFT 템플릿"
                      rules={[{ required: true, message: 'NFT 템플릿을 선택해주세요' }]}
                    >
                      <Select placeholder="발급할 NFT 템플릿 선택">
                        <Option value="early_supporter">얼리 서포터 뱃지</Option>
                        <Option value="mission_master">미션 마스터 뱃지</Option>
                        <Option value="crypto_guru">크립토 구루 뱃지</Option>
                        <Option value="community_builder">커뮤니티 빌더 뱃지</Option>
                        <Option value="content_creator">콘텐츠 크리에이터 뱃지</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="nftMetadata"
                      label="추가 메타데이터"
                    >
                      <TextArea
                        rows={4}
                        placeholder="JSON 형식의 추가 메타데이터 (선택 사항)"
                      />
                    </Form.Item>
                  </>
                )}

                {/* 블록체인 기록 옵션 */}
                {(rewardType === 'token' || rewardType === 'nft' || rewardType === 'badge') && (
                  <Form.Item
                    name="isOnchain"
                    label="블록체인 기록"
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren="온체인"
                      unCheckedChildren="오프체인"
                      onChange={setIsOnchain}
                    />
                  </Form.Item>
                )}

                {/* 사유 필드 */}
                <Form.Item
                  name="reason"
                  label="지급 사유"
                  rules={[{ required: true, message: '지급 사유를 입력해주세요' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="보상 지급 사유를 입력하세요"
                  />
                </Form.Item>
              </>
            )}
          </Card>
        </Col>

        {/* 오른쪽 컬럼 - 추가 정보 */}
        <Col span={12}>
          <Card title="소스 정보" bordered={false}>
            <Form.Item
              name="source"
              label="지급 소스"
              rules={[{ required: true, message: '지급 소스를 선택해주세요' }]}
              initialValue="admin"
            >
              <Select placeholder="보상 지급 소스 선택">
                <Option value="admin">관리자 수동 지급</Option>
                <Option value="system">시스템 자동 지급</Option>
                <Option value="airdrop">에어드롭</Option>
                <Option value="event">이벤트 보상</Option>
              </Select>
            </Form.Item>

            {!isBatchMode && selectedUserIds.length > 0 && (
              <Alert
                message={`${selectedUserIds.length}명의 사용자에게 보상이 지급됩니다.`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {isBatchMode && fileList.length > 0 && (
              <Alert
                message="일괄 지급 모드"
                description="파일의 모든 사용자에게 보상이 지급됩니다. 처리 전에 파일 내용을 다시 한번 확인해주세요."
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {isOnchain && (
              <Alert
                message="온체인 처리 안내"
                description="이 보상은 블록체인에 기록됩니다. 처리 시간이 더 오래 걸릴 수 있으며, 가스비가 발생합니다."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 폼 버튼 */}
      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            보상 지급 실행
          </Button>
          <Button onClick={onCancel}>
            취소
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default RewardForm;
