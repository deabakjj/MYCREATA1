/**
 * Relay Transaction 컨트롤러
 * 
 * 외부 DApp의 트랜잭션 요청을 처리하는 API 엔드포인트를 제공합니다.
 * 서명 요청, 승인, 거부 등의 기능을 처리합니다.
 */

const RelayTransaction = require('../../../models/relay/relayTransaction');
const relayConnectionService = require('../../../services/relay/relayConnectionService');
const walletService = require('../../../services/walletService');
const responseHandler = require('../../../utils/responseHandler');
const logger = require('../../../utils/logger');

// 위험 평가 유틸리티 모듈 (별도 파일로 분리하는 것이 이상적)
const riskAssessment = {
  /**
   * 트랜잭션 위험 평가
   * 
   * @param {Object} transaction - 트랜잭션 객체
   * @returns {Object} 위험 평가 결과
   */
  assessTransaction: (transaction) => {
    const factors = [];
    let score = 0;
    
    // 코드 길이 위험 평가
    if (transaction.requestData.transaction && transaction.requestData.transaction.data) {
      const dataLength = transaction.requestData.transaction.data.length;
      if (dataLength > 1000) {
        score += 20;
        factors.push({
          name: 'complexCode',
          description: '복잡한 컨트랙트 코드입니다.',
          severity: 20
        });
      }
    }
    
    // 금액 위험 평가
    if (transaction.requestData.transaction && transaction.requestData.transaction.value) {
      const value = parseFloat(transaction.requestData.transaction.value);
      if (value > 10000) {
        score += 30;
        factors.push({
          name: 'highValue',
          description: '큰 금액의 거래입니다.',
          severity: 30
        });
      } else if (value > 1000) {
        score += 15;
        factors.push({
          name: 'mediumValue',
          description: '중간 정도 금액의 거래입니다.',
          severity: 15
        });
      }
    }
    
    // 알 수 없는 수신자 위험 평가
    if (transaction.requestData.transaction && transaction.requestData.transaction.to) {
      // 화이트리스트 주소가 아닌 경우 (예시)
      const whitelistedAddresses = [
        '0x1234567890abcdef1234567890abcdef12345678', 
        '0xabcdef1234567890abcdef1234567890abcdef12'
      ];
      
      if (!whitelistedAddresses.includes(transaction.requestData.transaction.to)) {
        score += 10;
        factors.push({
          name: 'unknownRecipient',
          description: '알려지지 않은 수신자 주소입니다.',
          severity: 10
        });
      }
    }
    
    // 최종 위험 점수 계산
    return {
      score: Math.min(score, 100), // 최대 100점
      factors
    };
  }
};

/**
 * 서명 요청 생성 (DApp에서 호출)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.createSignatureRequest = async (req, res) => {
  try {
    const { connectionKey, requestType, requestData } = req.body;
    
    if (!connectionKey || !requestType || !requestData) {
      return responseHandler.badRequest(res, '필수 데이터가 누락되었습니다.');
    }
    
    // 도메인 검증 (Referer 또는 Origin 헤더로 확인)
    const requestDomain = req.headers.referer || req.headers.origin;
    if (!requestDomain) {
      return responseHandler.forbidden(res, '출처를 알 수 없는 요청입니다.');
    }
    
    // 연결 정보 조회
    const connection = await relayConnectionService.getConnectionByKey(connectionKey);
    
    // 도메인 일치 확인
    if (!requestDomain.includes(connection.dapp.domain)) {
      return responseHandler.forbidden(res, '허용되지 않은 도메인에서 요청되었습니다.');
    }
    
    // 연결 권한 확인
    if (!connection.permissions.requestSignature) {
      return responseHandler.forbidden(res, '서명 요청 권한이 없습니다.');
    }
    
    // 메타데이터 설정
    const metadata = {
      dappDomain: connection.dapp.domain,
      requestIp: req.ip,
      userAgent: req.headers['user-agent'],
      device: req.device || 'unknown'
    };
    
    // 거래 데이터 인간이 읽을 수 있는 형태로 변환
    const humanReadable = parseTransactionForHuman(requestType, requestData);
    
    // 새 서명 요청 생성
    const transaction = new RelayTransaction({
      connection: connection._id,
      user: connection.user,
      requestType,
      requestData: {
        ...requestData,
        humanReadable
      },
      metadata,
      gaslessTransaction: !!req.body.gaslessTransaction && connection.permissions.useGasless
    });
    
    // 위험 평가
    transaction.riskAssessment = riskAssessment.assessTransaction(transaction);
    
    // 자동 승인 가능 여부 확인
    const canAutoApprove = checkAutoApproveEligibility(connection, transaction);
    
    // 만료 시간 설정 (기본 10분)
    const expiresIn = req.body.expiresIn || 10 * 60 * 1000;
    transaction.timestamps.expiresAt = new Date(Date.now() + expiresIn);
    
    // 저장
    await transaction.save();
    
    // 자동 승인 가능한 경우 처리
    if (canAutoApprove) {
      // 지갑 서비스를 통해 서명 생성
      const wallet = await walletService.getWallet(connection.wallet);
      const signature = await walletService.signTransaction(wallet, transaction.requestData);
      
      // 자동 승인 처리
      await transaction.autoApprove(signature);
      
      // 연결 사용 로깅
      await connection.logSignatureRequest(true);
      
      // 응답 반환
      return responseHandler.success(res, {
        transactionId: transaction.transactionId,
        status: 'approved',
        signature,
        autoApproved: true
      });
    }
    
    // 일반 응답 반환
    return responseHandler.success(res, {
      transactionId: transaction.transactionId,
      status: 'pending',
      expiresAt: transaction.timestamps.expiresAt,
      autoApproved: false
    });
  } catch (error) {
    logger.error('서명 요청 생성 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 서명 요청 상태 조회 (DApp에서 호출)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getSignatureRequestStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // 트랜잭션 조회
    const transaction = await RelayTransaction.findOne({ transactionId });
    
    if (!transaction) {
      return responseHandler.notFound(res, '서명 요청을 찾을 수 없습니다.');
    }
    
    // 연결 정보 조회
    const connection = await relayConnectionService.getConnection(transaction.connection);
    
    // 도메인 검증 (Referer 또는 Origin 헤더로 확인)
    const requestDomain = req.headers.referer || req.headers.origin;
    if (!requestDomain || !requestDomain.includes(connection.dapp.domain)) {
      return responseHandler.forbidden(res, '허용되지 않은 도메인에서 요청되었습니다.');
    }
    
    // 응답 데이터 구성
    const responseData = {
      transactionId: transaction.transactionId,
      status: transaction.status,
      expiresAt: transaction.timestamps.expiresAt,
      autoApproved: transaction.autoApproved
    };
    
    // 승인된 경우 서명 추가
    if (transaction.status === 'approved') {
      responseData.signature = transaction.signatureResult.signature;
    }
    
    // 거부된 경우 에러 추가
    if (transaction.status === 'rejected') {
      responseData.error = transaction.signatureResult.error;
    }
    
    return responseHandler.success(res, responseData);
  } catch (error) {
    logger.error('서명 요청 상태 조회 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 사용자의 서명 요청 목록 조회
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, page = 1 } = req.query;
    
    // 쿼리 조건 구성
    const query = { user: userId };
    
    if (status) {
      query.status = status;
    }
    
    // 페이지네이션 설정
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 트랜잭션 조회
    const transactions = await RelayTransaction.find(query)
      .populate('connection', 'connectionKey name dapp.name dapp.domain dapp.logoUrl')
      .sort({ 'timestamps.requested': -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 전체 건수 조회
    const total = await RelayTransaction.countDocuments(query);
    
    return responseHandler.success(res, {
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('사용자 트랜잭션 목록 조회 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 서명 요청 상세 조회
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.getTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;
    
    // 트랜잭션 조회
    const transaction = await RelayTransaction.findOne({ transactionId })
      .populate('connection', 'connectionKey name dapp.name dapp.domain dapp.logoUrl');
    
    if (!transaction) {
      return responseHandler.notFound(res, '서명 요청을 찾을 수 없습니다.');
    }
    
    // 사용자 소유 확인
    if (transaction.user.toString() !== userId) {
      return responseHandler.forbidden(res, '이 서명 요청에 접근할 권한이 없습니다.');
    }
    
    return responseHandler.success(res, transaction);
  } catch (error) {
    logger.error('트랜잭션 상세 조회 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 서명 요청 승인
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.approveTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;
    
    // 트랜잭션 조회
    const transaction = await RelayTransaction.findOne({ transactionId });
    
    if (!transaction) {
      return responseHandler.notFound(res, '서명 요청을 찾을 수 없습니다.');
    }
    
    // 사용자 소유 확인
    if (transaction.user.toString() !== userId) {
      return responseHandler.forbidden(res, '이 서명 요청에 접근할 권한이 없습니다.');
    }
    
    // 이미 처리된 요청인지 확인
    if (transaction.status !== 'pending') {
      return responseHandler.badRequest(res, `이미 ${transaction.status} 상태인 요청입니다.`);
    }
    
    // 만료 확인
    if (new Date() > new Date(transaction.timestamps.expiresAt)) {
      await transaction.save(); // 상태 업데이트
      return responseHandler.badRequest(res, '만료된 서명 요청입니다.');
    }
    
    // 지갑 서비스를 통해 서명 생성
    const connection = await relayConnectionService.getConnection(transaction.connection);
    const wallet = await walletService.getWallet(connection.wallet);
    const signature = await walletService.signTransaction(wallet, transaction.requestData);
    
    // 승인 처리
    await transaction.approve(signature);
    
    // 연결 사용 로깅
    await connection.logSignatureRequest(true);
    
    return responseHandler.success(res, {
      transactionId: transaction.transactionId,
      status: 'approved',
      signature
    });
  } catch (error) {
    logger.error('트랜잭션 승인 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 서명 요청 거부
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.rejectTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    // 트랜잭션 조회
    const transaction = await RelayTransaction.findOne({ transactionId });
    
    if (!transaction) {
      return responseHandler.notFound(res, '서명 요청을 찾을 수 없습니다.');
    }
    
    // 사용자 소유 확인
    if (transaction.user.toString() !== userId) {
      return responseHandler.forbidden(res, '이 서명 요청에 접근할 권한이 없습니다.');
    }
    
    // 이미 처리된 요청인지 확인
    if (transaction.status !== 'pending') {
      return responseHandler.badRequest(res, `이미 ${transaction.status} 상태인 요청입니다.`);
    }
    
    // 만료 확인
    if (new Date() > new Date(transaction.timestamps.expiresAt)) {
      await transaction.save(); // 상태 업데이트
      return responseHandler.badRequest(res, '만료된 서명 요청입니다.');
    }
    
    // 거부 처리
    await transaction.reject(reason);
    
    // 연결 사용 로깅
    const connection = await relayConnectionService.getConnection(transaction.connection);
    await connection.logSignatureRequest(false);
    
    return responseHandler.success(res, {
      transactionId: transaction.transactionId,
      status: 'rejected'
    });
  } catch (error) {
    logger.error('트랜잭션 거부 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 트랜잭션 완료 보고 (DApp에서 호출)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.completeTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { txHash, blockNumber } = req.body;
    
    if (!txHash) {
      return responseHandler.badRequest(res, '트랜잭션 해시가 필요합니다.');
    }
    
    // 트랜잭션 조회
    const transaction = await RelayTransaction.findOne({ transactionId });
    
    if (!transaction) {
      return responseHandler.notFound(res, '서명 요청을 찾을 수 없습니다.');
    }
    
    // 연결 정보 조회
    const connection = await relayConnectionService.getConnection(transaction.connection);
    
    // 도메인 검증 (Referer 또는 Origin 헤더로 확인)
    const requestDomain = req.headers.referer || req.headers.origin;
    if (!requestDomain || !requestDomain.includes(connection.dapp.domain)) {
      return responseHandler.forbidden(res, '허용되지 않은 도메인에서 요청되었습니다.');
    }
    
    // 상태 확인
    if (transaction.status !== 'approved') {
      return responseHandler.badRequest(res, '승인되지 않은 요청은 완료할 수 없습니다.');
    }
    
    // 완료 처리
    await transaction.complete(txHash, blockNumber || 0);
    
    return responseHandler.success(res, {
      transactionId: transaction.transactionId,
      status: 'completed'
    });
  } catch (error) {
    logger.error('트랜잭션 완료 보고 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 트랜잭션 실패 보고 (DApp에서 호출)
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 */
exports.failTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { error } = req.body;
    
    // 트랜잭션 조회
    const transaction = await RelayTransaction.findOne({ transactionId });
    
    if (!transaction) {
      return responseHandler.notFound(res, '서명 요청을 찾을 수 없습니다.');
    }
    
    // 연결 정보 조회
    const connection = await relayConnectionService.getConnection(transaction.connection);
    
    // 도메인 검증 (Referer 또는 Origin 헤더로 확인)
    const requestDomain = req.headers.referer || req.headers.origin;
    if (!requestDomain || !requestDomain.includes(connection.dapp.domain)) {
      return responseHandler.forbidden(res, '허용되지 않은 도메인에서 요청되었습니다.');
    }
    
    // 상태 확인
    if (transaction.status !== 'approved') {
      return responseHandler.badRequest(res, '승인되지 않은 요청은 실패 보고할 수 없습니다.');
    }
    
    // 실패 처리
    await transaction.fail(error);
    
    return responseHandler.success(res, {
      transactionId: transaction.transactionId,
      status: 'failed'
    });
  } catch (error) {
    logger.error('트랜잭션 실패 보고 실패:', error);
    return responseHandler.error(res, error.message, error.statusCode);
  }
};

/**
 * 트랜잭션 데이터를 인간이 읽을 수 있는 형태로 변환
 * 
 * @param {string} requestType - 요청 유형
 * @param {Object} requestData - 요청 데이터
 * @returns {Object} 인간이 읽을 수 있는 형태의 데이터
 * @private
 */
function parseTransactionForHuman(requestType, requestData) {
  const humanReadable = {};
  
  // 요청 유형에 따라 다르게 처리
  switch (requestType) {
    case 'signTransaction':
      if (requestData.transaction) {
        // 수신자 주소 확인 및 처리
        if (requestData.transaction.to) {
          humanReadable.actionType = 'Transaction';
          humanReadable.actionDescription = `Send to ${requestData.transaction.to.substring(0, 8)}...`;
        }
        
        // 값 확인 및 처리
        if (requestData.transaction.value) {
          // 16진수 값을 10진수로 변환
          let value = requestData.transaction.value;
          if (value.startsWith('0x')) {
            value = parseInt(value, 16);
          } else {
            value = parseFloat(value);
          }
          
          humanReadable.amount = `${value} CTA`;
          humanReadable.assetType = 'CTA';
        }
        
        // 데이터 확인 및 처리
        if (requestData.transaction.data && requestData.transaction.data.length > 0) {
          // 데이터로 함수 시그니처 분석 (다양한 컨트랙트 함수에 대한 처리가 필요)
          const signature = requestData.transaction.data.substring(0, 10);
          
          // 일반적인 ERC20 전송 (transfer)
          if (signature === '0xa9059cbb') {
            humanReadable.actionType = 'Token Transfer';
            humanReadable.assetType = 'Token';
            humanReadable.actionDescription = 'Transfer tokens to address';
          }
          // 일반적인 ERC721 전송 (safeTransferFrom)
          else if (signature === '0x42842e0e') {
            humanReadable.actionType = 'NFT Transfer';
            humanReadable.assetType = 'NFT';
            humanReadable.actionDescription = 'Transfer NFT to address';
          }
          // 컨트랙트 호출
          else {
            humanReadable.actionType = 'Contract Interaction';
            humanReadable.actionDescription = 'Call smart contract function';
          }
        }
      }
      break;
      
    case 'signMessage':
      humanReadable.actionType = 'Sign Message';
      humanReadable.actionDescription = 'Sign a message with your wallet';
      
      // 메시지 내용의 일부 표시
      if (requestData.raw) {
        let message = requestData.raw;
        
        // 16진수 인코딩된 경우 디코딩 시도
        if (message.startsWith('0x')) {
          try {
            const hex = message.substring(2);
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
              str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            message = str;
          } catch (e) {
            // 디코딩 실패 시 원본 사용
          }
        }
        
        // 메시지 요약 (최대 50자)
        if (message.length > 50) {
          humanReadable.actionDescription = `Sign: "${message.substring(0, 50)}..."`;
        } else {
          humanReadable.actionDescription = `Sign: "${message}"`;
        }
      }
      break;
      
    case 'personalSign':
      humanReadable.actionType = 'Personal Sign';
      humanReadable.actionDescription = 'Personally sign a message';
      
      // 메시지 내용의 일부 표시
      if (requestData.raw) {
        let message = requestData.raw;
        
        // 16진수 인코딩된 경우 디코딩 시도
        if (message.startsWith('0x')) {
          try {
            const hex = message.substring(2);
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
              str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            message = str;
          } catch (e) {
            // 디코딩 실패 시 원본 사용
          }
        }
        
        // 메시지 요약 (최대 50자)
        if (message.length > 50) {
          humanReadable.actionDescription = `Sign: "${message.substring(0, 50)}..."`;
        } else {
          humanReadable.actionDescription = `Sign: "${message}"`;
        }
      }
      break;
      
    case 'signTypedData':
      humanReadable.actionType = 'Sign Typed Data';
      humanReadable.actionDescription = 'Sign typed data (EIP-712)';
      
      // 타입 데이터의 도메인 이름 표시
      if (requestData.raw && typeof requestData.raw === 'object') {
        try {
          const domain = requestData.raw.domain;
          if (domain && domain.name) {
            humanReadable.actionDescription = `Sign data for ${domain.name}`;
          }
        } catch (e) {
          // 파싱 실패 시 기본값 사용
        }
      }
      break;
      
    default:
      humanReadable.actionType = 'Unknown';
      humanReadable.actionDescription = `Unknown request type: ${requestType}`;
  }
  
  return humanReadable;
}

/**
 * 자동 승인 가능 여부 확인
 * 
 * @param {Object} connection - 연결 객체
 * @param {Object} transaction - 트랜잭션 객체
 * @returns {boolean} 자동 승인 가능 여부
 * @private
 */
function checkAutoApproveEligibility(connection, transaction) {
  // 자동 승인 권한이 없으면 불가능
  if (!connection.permissions.autoSign) {
    return false;
  }
  
  // 위험도가 높으면 불가능
  if (transaction.riskAssessment.score > 30) {
    return false;
  }
  
  // 메시지 서명이 아니라 거래인 경우, 금액 확인
  if (transaction.requestType === 'signTransaction' && 
      transaction.requestData.transaction &&
      transaction.requestData.transaction.value) {
    
    // 값 확인
    let value = transaction.requestData.transaction.value;
    
    // 16진수 값을 10진수로 변환
    if (value.startsWith('0x')) {
      value = parseInt(value, 16) / 1e18; // ETH 단위 변환
    } else {
      value = parseFloat(value);
    }
    
    // 자동 승인 가능 금액 이하인지 확인
    if (value > connection.permissions.autoSignMaxAmount) {
      return false;
    }
  }
  
  // 모든 조건 통과하면 자동 승인 가능
  return true;
}
