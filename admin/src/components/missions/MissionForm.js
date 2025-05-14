import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  Button,
  Divider,
  Row,
  Col,
  Card,
  Upload,
  message,
  Space,
  Tooltip,
} from 'antd';
import { UploadOutlined, QuestionCircleOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * 미션 생성/편집 폼 컴포넌트
 * 미션의 상세 정보를 입력하고 저장할 수 있는 폼
 */
const MissionForm = ({ initialValues, onSubmit, onCancel, loading }) => {
  const [form] = Form.useForm();
  const [previewText, setPreviewText] = useState('');
  const [hasNftReward, setHasNftReward] = useState(
    initialValues ? initialValues.nftReward !== null : false
  );
  const [aiModel, setAiModel] = useState(
    initialValues ? initialValues.aiModel || 'gpt' : 'gpt'
  );

  useEffect(() => {
    if (initialValues) {
      // 날짜 필드 변환
      const formattedValues = {
        ...initialValues,
        missionPeriod: initialValues.startDate && initialValues.endDate
          ? [moment(initialValues.startDate), moment(initialValues.endDate)]
          : null,
      };
      form.setFieldsValue(formattedValues);
      setPreviewText(initialValues.description || '');
    }
  }, [initialValues, form]);

  const handleDescriptionChange = (e) => {
    setPreviewText(e.target.value);
  };

  const handleFormSubmit = (values) => {
    // 날짜 범위 처리
    const formattedValues = { ...values };
    if (values.missionPeriod) {
      formattedValues.startDate = values.missionPeriod[0].toISOString();
      formattedValues.endDate = values.missionPeriod[1].toISOString();
      delete formattedValues.missionPeriod;
    }

    // NFT 보상 설정이 꺼져 있으면 관련 필드 제거
    if (!hasNftReward) {
      formattedValues.nftReward = null;
    }

    onSubmit(formattedValues);
  };

  const difficultyOptions = [
    { value: 'easy', label: '쉬움' },
    { value: 'medium', label: '중간' },
    { value: 'hard', label: '어려움' },
  ];

  const statusOptions = [
    { value: 'draft', label: '초안' },
    { value: 'active', label: '활성' },
    { value: 'scheduled', label: '예약됨' },
    { value: 'completed', label: '완료' },
  ];

  const aiModelOptions = [
    { value: 'gpt', label: 'GPT-4' },
    { value: 'claude', label: 'Claude' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'gemini', label: 'Gemini' },
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFormSubmit}
      initialValues={{
        status: 'draft',
        difficulty: 'medium',
        xpReward: 100,
        tokenReward: 10,
        aiModel: 'gpt',
        isPublic: true,
      }}
    >
      <Row gutter={24}>
        {/* 왼쪽 컬럼 - 기본 정보 */}
        <Col span={14}>
          <Card title="미션 기본 정보" bordered={false}>
            <Form.Item
              name="title"
              label="미션 제목"
              rules={[{ required: true, message: '미션 제목을 입력해주세요' }]}
            >
              <Input placeholder="미션 제목을 입력하세요" />
            </Form.Item>

            <Form.Item
              name="description"
              label="미션 설명"
              rules={[{ required: true, message: '미션 설명을 입력해주세요' }]}
            >
              <TextArea
                rows={6}
                placeholder="마크다운을 지원하는 미션 설명을 입력하세요"
                onChange={handleDescriptionChange}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="상태"
                  rules={[{ required: true }]}
                >
                  <Select options={statusOptions} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="difficulty"
                  label="난이도"
                  rules={[{ required: true }]}
                >
                  <Select options={difficultyOptions} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="missionPeriod"
              label="미션 기간"
            >
              <RangePicker
                style={{ width: '100%' }}
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                placeholder={['시작 시간', '종료 시간']}
              />
            </Form.Item>

            <Form.Item
              name="isPublic"
              label="공개 여부"
              valuePropName="checked"
            >
              <Switch checkedChildren="공개" unCheckedChildren="비공개" />
            </Form.Item>
          </Card>

          <Card title="AI 모델 설정" bordered={false} style={{ marginTop: 16 }}>
            <Form.Item
              name="aiModel"
              label="사용 AI 모델"
              rules={[{ required: true, message: 'AI 모델을 선택해주세요' }]}
            >
              <Select 
                options={aiModelOptions} 
                onChange={(value) => setAiModel(value)}
              />
            </Form.Item>

            <Form.Item
              name="aiPrompt"
              label={
                <Space>
                  <span>AI 프롬프트</span>
                  <Tooltip title="AI 모델에 전달할 프롬프트를 입력하세요. {userInput}은 사용자 입력으로 대체됩니다.">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              rules={[{ required: true, message: 'AI 프롬프트를 입력해주세요' }]}
            >
              <TextArea
                rows={4}
                placeholder="예: 다음 주제에 대한 짧은 에세이를 작성하세요: {userInput}"
              />
            </Form.Item>

            <Form.Item
              name="maxTokens"
              label="최대 토큰 수"
            >
              <InputNumber min={1} max={8000} style={{ width: '100%' }} />
            </Form.Item>

            {aiModel === 'gpt' && (
              <Form.Item
                name="temperature"
                label={
                  <Space>
                    <span>Temperature</span>
                    <Tooltip title="높을수록 다양한 답변, 낮을수록 일관된 답변이 생성됩니다">
                      <QuestionCircleOutlined />
                    </Tooltip>
                  </Space>
                }
              >
                <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            )}
          </Card>
        </Col>

        {/* 오른쪽 컬럼 - 보상 및 미리보기 */}
        <Col span={10}>
          <Card title="보상 설정" bordered={false}>
            <Form.Item
              name="xpReward"
              label="XP 보상"
              rules={[{ required: true, message: 'XP 보상을 입력해주세요' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="tokenReward"
              label="NEST 토큰 보상"
              rules={[{ required: true, message: '토큰 보상을 입력해주세요' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <span>NFT 보상</span>
                  <Tooltip title="NFT 보상을 지급하려면 활성화하세요">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Switch
                checked={hasNftReward}
                onChange={setHasNftReward}
                checkedChildren="활성"
                unCheckedChildren="비활성"
              />
            </Form.Item>

            {hasNftReward && (
              <>
                <Form.Item
                  name="nftReward.name"
                  label="NFT 이름"
                  rules={[{ required: hasNftReward, message: 'NFT 이름을 입력해주세요' }]}
                >
                  <Input placeholder="NFT 이름을 입력하세요" />
                </Form.Item>

                <Form.Item
                  name="nftReward.description"
                  label="NFT 설명"
                  rules={[{ required: hasNftReward, message: 'NFT 설명을 입력해주세요' }]}
                >
                  <TextArea rows={2} placeholder="NFT 설명을 입력하세요" />
                </Form.Item>

                <Form.Item
                  name="nftReward.imageUrl"
                  label="NFT 이미지"
                  rules={[{ required: hasNftReward, message: 'NFT 이미지를 업로드해주세요' }]}
                >
                  <Upload
                    name="file"
                    action="/api/upload"
                    listType="picture"
                    maxCount={1}
                    beforeUpload={(file) => {
                      const isImage = file.type.startsWith('image/');
                      if (!isImage) {
                        message.error('이미지 파일만 업로드할 수 있습니다!');
                      }
                      return isImage ? true : Upload.LIST_IGNORE;
                    }}
                  >
                    <Button icon={<UploadOutlined />}>이미지 업로드</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="nftReward.maxSupply"
                  label="최대 발행량"
                  rules={[{ required: hasNftReward, message: '최대 발행량을 입력해주세요' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </>
            )}
          </Card>

          <Card title="미션 설명 미리보기" bordered={false} style={{ marginTop: 16 }}>
            <div className="markdown-preview" style={{ padding: '16px', minHeight: '200px', border: '1px solid #d9d9d9', borderRadius: '2px' }}>
              {previewText ? (
                <ReactMarkdown>{previewText}</ReactMarkdown>
              ) : (
                <div style={{ color: '#bfbfbf' }}>미리보기가 여기에 표시됩니다</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Form.Item>
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
          >
            저장
          </Button>
          <Button icon={<CloseOutlined />} onClick={onCancel}>
            취소
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default MissionForm;
