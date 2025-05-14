import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Sync as SyncIcon
} from '@mui/icons-material';

/**
 * 블록체인 설정 컴포넌트
 * 블록체인 관련 설정을 관리
 * 
 * @param {Object} props
 * @param {Object} props.settings - 블록체인 설정 데이터
 * @param {Function} props.onSave - 설정 저장 콜백
 * @param {boolean} props.saving - 저장 중 여부
 */
export const BlockchainSettings = ({ settings, onSave, saving }) => {
  const defaultSettings = {
    // 메인넷 설정
    mainnetRpcUrl: 'https://cvm.node.creatachain.com',
    mainnetChainId: '1000',
    mainnetExplorerUrl: 'https://catena.explorer.creatachain.com',
    
    // 테스트넷 설정
    testnetRpcUrl: 'https://consensus.testnet.cvm.creatachain.com',
    testnetChainId: '9000',
    testnetExplorerUrl: 'https://testnet.cvm.creatachain.com',
    
    // 가스 설정
    useGasStation: true,
    gasStationApiUrl: 'https://gasstation.creatachain.com/v1',
    defaultGasPrice: '10',
    defaultGasLimit: '300000',
    
    // 스마트 컨트랙트 주소
    nestTokenAddress: '0x...',
    nestNFTAddress: '0x...',
    nestNameRegistryAddress: '0x...',
    nestSwapAddress: '0x...',
    nestDAOAddress: '0x...',
    
    // 기타 설정
    useTestnet: false,
    autoGasPrice: true,
    autoRetry: true,
    maxRetryCount: 3,
    blockConfirmations: 2,
    paymasterEnabled: true,
    paymasterUrl: 'https://paymaster.creatachain.com',
    
    // 트랜잭션 설정
    transactionTimeout: 60000,
    batchTransactions: true,
    maxBatchSize: 5
  };

  // 현재 설정 또는 기본값 사용
  const [formData, setFormData] = useState({
    ...defaultSettings,
    ...(settings || {})
  });

  const [syncingContracts, setSyncingContracts] = useState(false);

  // 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // 컨트랙트 주소 동기화 핸들러
  const handleSyncContracts = async () => {
    try {
      setSyncingContracts(true);
      // 여기에서 실제 컨트랙트 주소 동기화 로직을 구현
      // 예: API 호출이나 블록체인 스캐닝 등
      
      // 임시 지연 (실제 구현에서는 제거)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 성공 후 폼 데이터 업데이트 (예시)
      setFormData({
        ...formData,
        nestTokenAddress: '0x1234567890abcdef1234567890abcdef12345678',
        nestNFTAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        nestNameRegistryAddress: '0x7890abcdef1234567890abcdef1234567890abcd',
        nestSwapAddress: '0xdef1234567890abcdef1234567890abcdef123456',
        nestDAOAddress: '0x567890abcdef1234567890abcdef1234567890abc'
      });
      
      // 알림 표시 로직 필요
    } catch (error) {
      console.error('Contract sync failed:', error);
      // 오류 알림 표시 로직 필요
    } finally {
      setSyncingContracts(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          블록체인 설정
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={syncingContracts ? <CircularProgress size={20} /> : <SyncIcon />}
          onClick={handleSyncContracts}
          disabled={syncingContracts}
          sx={{ mb: 1 }}
        >
          {syncingContracts ? '동기화 중...' : '컨트랙트 주소 동기화'}
        </Button>
      </Box>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        CreataChain 블록체인 연결 및 스마트 컨트랙트 설정을 관리합니다.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        블록체인 설정을 변경하면 시스템의 정상 작동에 영향을 줄 수 있습니다. 변경 전 반드시 백업을 진행하세요.
      </Alert>

      <Grid container spacing={3}>
        {/* 네트워크 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                네트워크 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="useTestnet"
                        checked={formData.useTestnet}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="테스트넷 사용 (활성화 시 테스트넷, 비활성화 시 메인넷)"
                  />
                </Grid>
              </Grid>

              {/* 메인넷 설정 */}
              <Accordion 
                defaultExpanded={!formData.useTestnet}
                sx={{ mt: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>메인넷 설정</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="메인넷 RPC URL"
                        name="mainnetRpcUrl"
                        value={formData.mainnetRpcUrl}
                        onChange={handleChange}
                        margin="normal"
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="메인넷 Chain ID"
                        name="mainnetChainId"
                        value={formData.mainnetChainId}
                        onChange={handleChange}
                        margin="normal"
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="메인넷 Explorer URL"
                        name="mainnetExplorerUrl"
                        value={formData.mainnetExplorerUrl}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* 테스트넷 설정 */}
              <Accordion 
                defaultExpanded={formData.useTestnet}
                sx={{ mt: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>테스트넷 설정</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="테스트넷 RPC URL"
                        name="testnetRpcUrl"
                        value={formData.testnetRpcUrl}
                        onChange={handleChange}
                        margin="normal"
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="테스트넷 Chain ID"
                        name="testnetChainId"
                        value={formData.testnetChainId}
                        onChange={handleChange}
                        margin="normal"
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="테스트넷 Explorer URL"
                        name="testnetExplorerUrl"
                        value={formData.testnetExplorerUrl}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* 가스 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                가스 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="useGasStation"
                        checked={formData.useGasStation}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="가스 스테이션 사용 (가스 가격 자동 조정)"
                  />
                </Grid>
                
                {formData.useGasStation && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="가스 스테이션 API URL"
                      name="gasStationApiUrl"
                      value={formData.gasStationApiUrl}
                      onChange={handleChange}
                      margin="normal"
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="기본 가스 가격 (Gwei)"
                    name="defaultGasPrice"
                    type="number"
                    value={formData.defaultGasPrice}
                    onChange={handleChange}
                    margin="normal"
                    disabled={formData.useGasStation}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="기본 가스 한도"
                    name="defaultGasLimit"
                    type="number"
                    value={formData.defaultGasLimit}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 21000 } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 스마트 컨트랙트 주소 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                스마트 컨트랙트 주소
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="NEST 토큰 컨트랙트 주소"
                    name="nestTokenAddress"
                    value={formData.nestTokenAddress}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="NEST NFT 컨트랙트 주소"
                    name="nestNFTAddress"
                    value={formData.nestNFTAddress}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nest 이름 레지스트리 컨트랙트 주소"
                    name="nestNameRegistryAddress"
                    value={formData.nestNameRegistryAddress}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CTA-NEST 스왑 컨트랙트 주소"
                    name="nestSwapAddress"
                    value={formData.nestSwapAddress}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nest DAO 컨트랙트 주소"
                    name="nestDAOAddress"
                    value={formData.nestDAOAddress}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 트랜잭션 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                트랜잭션 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="paymasterEnabled"
                        checked={formData.paymasterEnabled}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="Paymaster 사용 (사용자 가스비 제거)"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="autoRetry"
                        checked={formData.autoRetry}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="실패한 트랜잭션 자동 재시도"
                  />
                </Grid>
                
                {formData.paymasterEnabled && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Paymaster URL"
                      name="paymasterUrl"
                      value={formData.paymasterUrl}
                      onChange={handleChange}
                      margin="normal"
                    />
                  </Grid>
                )}
                
                {formData.autoRetry && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="최대 재시도 횟수"
                      name="maxRetryCount"
                      type="number"
                      value={formData.maxRetryCount}
                      onChange={handleChange}
                      margin="normal"
                      InputProps={{ inputProps: { min: 1, max: 10 } }}
                    />
                  </Grid>
                )}
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="트랜잭션 타임아웃 (ms)"
                    name="transactionTimeout"
                    type="number"
                    value={formData.transactionTimeout}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 10000 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="블록 확인 수"
                    name="blockConfirmations"
                    type="number"
                    value={formData.blockConfirmations}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1, max: 12 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="batchTransactions"
                        checked={formData.batchTransactions}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="대량 트랜잭션 일괄 처리"
                  />
                </Grid>
                
                {formData.batchTransactions && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="최대 일괄 처리 크기"
                      name="maxBatchSize"
                      type="number"
                      value={formData.maxBatchSize}
                      onChange={handleChange}
                      margin="normal"
                      InputProps={{ inputProps: { min: 2, max: 20 } }}
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 저장 버튼 */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
          disabled={saving}
        >
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </Box>
    </form>
  );
};

export default BlockchainSettings;
