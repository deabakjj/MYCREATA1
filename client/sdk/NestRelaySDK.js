/**
 * Nest Relay SDK
 * 
 * 외부 DApp에서 Nest 플랫폼의 기능을 쉽게 사용할 수 있도록 도와주는 SDK입니다.
 * 사용자 인증, 지갑 연결, 서명 요청 등의 기능을 제공합니다.
 * 
 * @version 1.0.0
 */

/**
 * Nest Relay SDK 클래스
 */
class NestRelaySDK {
  /**
   * SDK 초기화
   * 
   * @param {Object} options - 초기화 옵션
   * @param {string} options.apiUrl - API 서버 URL
   * @param {string} options.dappName - DApp 이름
   * @param {string} options.dappDomain - DApp 도메인
   * @param {string} options.dappLogo - DApp 로고 URL (선택 사항)
   * @param {string} options.dappDescription - DApp 설명 (선택 사항)
   */
  constructor(options) {
    if (!options || !options.apiUrl || !options.dappName || !options.dappDomain) {
      throw new Error('필수 옵션이 누락되었습니다: apiUrl, dappName, dappDomain');
    }

    this.apiUrl = options.apiUrl.endsWith('/') ? options.apiUrl.slice(0, -1) : options.apiUrl;
    this.dappInfo = {
      name: options.dappName,
      domain: options.dappDomain,
      logoUrl: options.dappLogo || null,
      description: options.dappDescription || null
    };

    // SDK 상태
    this.state = {
      initialized: true,
      connected: false,
      connecting: false,
      connectionKey: null,
      accessToken: null,
      expiresAt: null,
      nestId: null,
      walletAddress: null,
      permissions: null
    };

    // 이벤트 리스너
    this.eventListeners = {
      connect: [],
      disconnect: [],
      error: [],
      transactionRequest: [],
      transactionApproved: [],
      transactionRejected: []
    };

    // 스토리지 초기화
    this._initializeStorage();
    
    // 저장된 연결 복원 시도
    this._restoreConnection();
  }

  /**
   * localStorage 초기화
   * @private
   */
  _initializeStorage() {
    try {
      // 스토리지 키 설정 (DApp별로 유니크한 키 사용)
      this.storageKey = `nest_relay_${this.dappInfo.domain.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // 기존 데이터 로드
      const savedData = localStorage.getItem(this.storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData && parsedData.connectionKey && parsedData.accessToken) {
          this.state.connectionKey = parsedData.connectionKey;
          this.state.accessToken = parsedData.accessToken;
          this.state.expiresAt = parsedData.expiresAt;
        }
      }
    } catch (error) {
      console.error('스토리지 초기화 실패:', error);
    }
  }

  /**
   * 연결 정보 저장
   * @private
   */
  _saveConnection() {
    try {
      const dataToSave = {
        connectionKey: this.state.connectionKey,
        accessToken: this.state.accessToken,
        expiresAt: this.state.expiresAt
      };
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('연결 정보 저장 실패:', error);
    }
  }

  /**
   * 연결 정보 삭제
   * @private
   */
  _clearConnection() {
    try {
      localStorage.removeItem(this.storageKey);
      
      // 상태 초기화
      this.state.connected = false;
      this.state.connectionKey = null;
      this.state.accessToken = null;
      this.state.expiresAt = null;
      this.state.nestId = null;
      this.state.walletAddress = null;
      this.state.permissions = null;
    } catch (error) {
      console.error('연결 정보 삭제 실패:', error);
    }
  }

  /**
   * 저장된 연결 복원
   * @private
   */
  async _restoreConnection() {
    if (this.state.connectionKey && this.state.accessToken) {
      try {
        // 토큰 유효성 검증
        const isValid = await this._verifyToken(this.state.accessToken);
        
        if (isValid) {
          // 연결 정보 조회
          const connection = await this._fetchConnectionInfo(this.state.connectionKey);
          
          if (connection) {
            // 상태 업데이트
            this.state.connected = true;
            this.state.nestId = connection.nestId;
            this.state.walletAddress = connection.wallet?.address;
            this.state.permissions = connection.permissions;
            
            // 연결 이벤트 트리거
            this._triggerEvent('connect', {
              nestId: this.state.nestId,
              walletAddress: this.state.walletAddress,
              permissions: this.state.permissions
            });
            
            return true;
          }
        }
      } catch (error) {
        console.error('저장된 연결 복원 실패:', error);
        this._clearConnection();
      }
    }
    
    return false;
  }

  /**
   * API 요청 헬퍼
   * 
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} options - fetch 옵션
   * @returns {Promise<Object>} 응답 데이터
   * @private
   */
  async _fetchAPI(endpoint, options = {}) {
    try {
      const url = `${this.apiUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
      
      // 기본 헤더 설정
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      
      // 인증 토큰이 있으면 추가
      if (this.state.accessToken && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${this.state.accessToken}`;
      }
      
      // 요청 옵션 구성
      const fetchOptions = {
        ...options,
        headers
      };
      
      // API 요청
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      
      // 에러 확인
      if (!response.ok) {
        throw new Error(data.message || '알 수 없는 오류가 발생했습니다.');
      }
      
      return data;
    } catch (error) {
      this._triggerEvent('error', {
        message: error.message,
        endpoint
      });
      throw error;
    }
  }

  /**
   * 액세스 토큰 검증
   * 
   * @param {string} token - 액세스 토큰
   * @returns {Promise<boolean>} 유효성 여부
   * @private
   */
  async _verifyToken(token) {
    try {
      const response = await this._fetchAPI('/api/relay/dapp/verify-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
        skipAuth: true
      });
      
      return response && response.valid === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 연결 정보 조회
   * 
   * @param {string} connectionKey - 연결 키
   * @returns {Promise<Object>} 연결 정보
   * @private
   */
  async _fetchConnectionInfo(connectionKey) {
    try {
      const response = await this._fetchAPI(`/api/relay/dapp/connections/${connectionKey}`, {
        skipAuth: true
      });
      
      return response;
    } catch (error) {
      return null;
    }
  }

  /**
   * 이벤트 리스너 등록
   * 
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 콜백 함수
   */
  on(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].push(callback);
    } else {
      console.warn(`지원되지 않는 이벤트: ${event}`);
    }
  }

  /**
   * 이벤트 리스너 제거
   * 
   * @param {string} event - 이벤트 이름
   * @param {Function} callback - 제거할 콜백 함수
   */
  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * 이벤트 트리거
   * 
   * @param {string} event - 이벤트 이름
   * @param {Object} data - 이벤트 데이터
   * @private
   */
  _triggerEvent(event, data) {
    if (this.eventListeners[event]) {
      for (const callback of this.eventListeners[event]) {
        try {
          callback(data);
        } catch (error) {
          console.error(`이벤트 리스너 실행 중 오류 발생(${event}):`, error);
        }
      }
    }
  }

  /**
   * 연결 상태 확인
   * 
   * @returns {boolean} 연결 여부
   */
  isConnected() {
    return this.state.connected;
  }

  /**
   * 연결 권한 확인
   * 
   * @param {string} permission - 확인할 권한
   * @returns {boolean} 권한 보유 여부
   */
  hasPermission(permission) {
    return !!(this.state.permissions && this.state.permissions[permission]);
  }

  /**
   * 현재 Nest ID 정보 반환
   * 
   * @returns {Object|null} Nest ID 정보
   */
  getNestId() {
    return this.state.nestId;
  }

  /**
   * 현재 지갑 주소 반환
   * 
   * @returns {string|null} 지갑 주소
   */
  getWalletAddress() {
    return this.state.walletAddress;
  }

  /**
   * 권한 목록 반환
   * 
   * @returns {Object|null} 권한 목록
   */
  getPermissions() {
    return this.state.permissions;
  }

  /**
   * 연결 팝업 창 열기
   * 
   * @param {Object} options - 팝업 옵션
   * @returns {Window} 팝업 창 객체
   * @private
   */
  _openConnectPopup(options = {}) {
    const width = options.width || 480;
    const height = options.height || 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    // DApp 정보를 쿼리 파라미터로 인코딩
    const params = new URLSearchParams({
      dappName: this.dappInfo.name,
      dappDomain: this.dappInfo.domain,
      redirectUrl: window.location.href,
      ...(this.dappInfo.logoUrl && { dappLogo: this.dappInfo.logoUrl }),
      ...(this.dappInfo.description && { dappDescription: this.dappInfo.description })
    }).toString();
    
    // 팝업 URL 구성
    const popupUrl = `${this.apiUrl}/connect?${params}`;
    
    // 팝업 열기
    return window.open(
      popupUrl,
      'NestConnect',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
  }

  /**
   * Nest 플랫폼에 연결
   * 
   * @param {Object} options - 연결 옵션
   * @param {Object} options.permissions - 요청할 권한 (선택 사항)
   * @param {boolean} options.modal - 모달 사용 여부 (기본값: false)
   * @returns {Promise<Object>} 연결 결과
   */
  async connect(options = {}) {
    if (this.state.connecting) {
      throw new Error('이미 연결 중입니다.');
    }
    
    if (this.state.connected) {
      return {
        connected: true,
        nestId: this.state.nestId,
        walletAddress: this.state.walletAddress,
        permissions: this.state.permissions
      };
    }
    
    this.state.connecting = true;
    
    try {
      // 모달 또는 팝업 선택
      const useModal = options.modal === true;
      
      if (useModal) {
        // 모달 방식 (iframe 사용)
        const result = await this._connectWithModal(options);
        return result;
      } else {
        // 팝업 방식
        const result = await this._connectWithPopup(options);
        return result;
      }
    } catch (error) {
      this._triggerEvent('error', {
        message: error.message,
        action: 'connect'
      });
      throw error;
    } finally {
      this.state.connecting = false;
    }
  }

  /**
   * 팝업을 사용한 연결
   * 
   * @param {Object} options - 연결 옵션
   * @returns {Promise<Object>} 연결 결과
   * @private
   */
  _connectWithPopup(options) {
    return new Promise((resolve, reject) => {
      try {
        // 팝업 열기
        const popup = this._openConnectPopup();
        
        if (!popup) {
          throw new Error('팝업 창을 열 수 없습니다. 팝업 차단을 해제해주세요.');
        }
        
        // 팝업 메시지 이벤트 리스너
        const messageHandler = async (event) => {
          try {
            // 출처 검증
            if (!event.origin.includes(this.apiUrl.replace(/^https?:\/\//, ''))) {
              return;
            }
            
            // 메시지 검증
            if (!event.data || event.data.type !== 'NEST_CONNECT_RESULT') {
              return;
            }
            
            // 이벤트 리스너 제거
            window.removeEventListener('message', messageHandler);
            
            // 팝업 닫기
            if (!popup.closed) {
              popup.close();
            }
            
            // 오류 확인
            if (event.data.error) {
              reject(new Error(event.data.error));
              return;
            }
            
            // 연결 정보 설정
            this.state.connectionKey = event.data.connectionKey;
            this.state.accessToken = event.data.accessToken;
            this.state.expiresAt = event.data.expiresAt;
            this.state.connected = true;
            this.state.nestId = event.data.nestId;
            this.state.walletAddress = event.data.walletAddress;
            this.state.permissions = event.data.permissions;
            
            // 연결 정보 저장
            this._saveConnection();
            
            // 연결 이벤트 트리거
            this._triggerEvent('connect', {
              nestId: this.state.nestId,
              walletAddress: this.state.walletAddress,
              permissions: this.state.permissions
            });
            
            // 결과 반환
            resolve({
              connected: true,
              nestId: this.state.nestId,
              walletAddress: this.state.walletAddress,
              permissions: this.state.permissions
            });
          } catch (error) {
            reject(error);
          }
        };
        
        // 이벤트 리스너 등록
        window.addEventListener('message', messageHandler);
        
        // 팝업 닫힘 감지
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            
            // 연결이 아직 안 된 상태면 거부
            if (!this.state.connected) {
              reject(new Error('사용자가 연결을 취소했습니다.'));
            }
          }
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 모달을 사용한 연결
   * 
   * @param {Object} options - 연결 옵션
   * @returns {Promise<Object>} 연결 결과
   * @private
   */
  _connectWithModal(options) {
    return new Promise((resolve, reject) => {
      try {
        // 모달 컨테이너 생성
        const modalContainer = document.createElement('div');
        modalContainer.id = 'nest-connect-modal-container';
        modalContainer.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
        `;
        
        // 모달 프레임 생성
        const modalFrame = document.createElement('div');
        modalFrame.style.cssText = `
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          width: 480px;
          max-width: 100%;
          max-height: 90vh;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;
        
        // iframe 생성
        const iframe = document.createElement('iframe');
        
        // DApp 정보를 쿼리 파라미터로 인코딩
        const params = new URLSearchParams({
          dappName: this.dappInfo.name,
          dappDomain: this.dappInfo.domain,
          modal: 'true',
          redirectUrl: window.location.href,
          ...(this.dappInfo.logoUrl && { dappLogo: this.dappInfo.logoUrl }),
          ...(this.dappInfo.description && { dappDescription: this.dappInfo.description })
        }).toString();
        
        // iframe URL 구성
        const iframeUrl = `${this.apiUrl}/connect?${params}`;
        
        iframe.src = iframeUrl;
        iframe.style.cssText = `
          width: 100%;
          height: 700px;
          max-height: 90vh;
          border: none;
        `;
        
        // 모달 닫기 버튼
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.8);
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
        `;
        
        closeButton.addEventListener('click', () => {
          document.body.removeChild(modalContainer);
          reject(new Error('사용자가 연결을 취소했습니다.'));
        });
        
        // 모달 구성
        modalFrame.appendChild(iframe);
        modalContainer.appendChild(modalFrame);
        modalContainer.appendChild(closeButton);
        document.body.appendChild(modalContainer);
        
        // 메시지 이벤트 리스너
        const messageHandler = async (event) => {
          try {
            // 출처 검증
            if (!event.origin.includes(this.apiUrl.replace(/^https?:\/\//, ''))) {
              return;
            }
            
            // 메시지 검증
            if (!event.data || event.data.type !== 'NEST_CONNECT_RESULT') {
              return;
            }
            
            // 이벤트 리스너 제거
            window.removeEventListener('message', messageHandler);
            
            // 모달 제거
            if (document.body.contains(modalContainer)) {
              document.body.removeChild(modalContainer);
            }
            
            // 오류 확인
            if (event.data.error) {
              reject(new Error(event.data.error));
              return;
            }
            
            // 연결 정보 설정
            this.state.connectionKey = event.data.connectionKey;
            this.state.accessToken = event.data.accessToken;
            this.state.expiresAt = event.data.expiresAt;
            this.state.connected = true;
            this.state.nestId = event.data.nestId;
            this.state.walletAddress = event.data.walletAddress;
            this.state.permissions = event.data.permissions;
            
            // 연결 정보 저장
            this._saveConnection();
            
            // 연결 이벤트 트리거
            this._triggerEvent('connect', {
              nestId: this.state.nestId,
              walletAddress: this.state.walletAddress,
              permissions: this.state.permissions
            });
            
            // 결과 반환
            resolve({
              connected: true,
              nestId: this.state.nestId,
              walletAddress: this.state.walletAddress,
              permissions: this.state.permissions
            });
          } catch (error) {
            reject(error);
          }
        };
        
        // 이벤트 리스너 등록
        window.addEventListener('message', messageHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 연결 해제
   * 
   * @returns {Promise<Object>} 연결 해제 결과
   */
  async disconnect() {
    if (!this.state.connected || !this.state.connectionKey) {
      return { disconnected: true };
    }
    
    try {
      // 서버에 연결 철회 요청
      if (this.state.accessToken) {
        try {
          // 연결 정보 조회
          const connectionInfo = await this._fetchConnectionInfo(this.state.connectionKey);
          
          if (connectionInfo && connectionInfo.id) {
            // 연결 철회 요청
            await this._fetchAPI(`/api/relay/connections/${connectionInfo.id}`, {
              method: 'DELETE'
            });
          }
        } catch (error) {
          // 연결 철회 실패는 무시하고 진행
          console.warn('서버 연결 철회 실패:', error);
        }
      }
      
      // 로컬 연결 정보 삭제
      this._clearConnection();
      
      // 연결 해제 이벤트 트리거
      this._triggerEvent('disconnect', {});
      
      return { disconnected: true };
    } catch (error) {
      this._triggerEvent('error', {
        message: error.message,
        action: 'disconnect'
      });
      throw error;
    }
  }

  /**
   * 메시지 서명 요청
   * 
   * @param {Object} params - 서명 매개변수
   * @param {string} params.message - 서명할 메시지
   * @param {Object} options - 옵션
   * @returns {Promise<Object>} 서명 결과
   */
  async signMessage(params, options = {}) {
    if (!this.state.connected) {
      throw new Error('연결되어 있지 않습니다. 먼저 connect()를 호출하세요.');
    }
    
    if (!this.hasPermission('requestSignature')) {
      throw new Error('서명 요청 권한이 없습니다.');
    }
    
    if (!params || !params.message) {
      throw new Error('서명할 메시지가 필요합니다.');
    }
    
    try {
      // 서명 요청 데이터 구성
      const requestData = {
        raw: params.message
      };
      
      // 서명 요청
      return await this._requestSignature('signMessage', requestData, options);
    } catch (error) {
      this._triggerEvent('error', {
        message: error.message,
        action: 'signMessage'
      });
      throw error;
    }
  }

  /**
   * 개인 메시지 서명 요청
   * 
   * @param {Object} params - 서명 매개변수
   * @param {string} params.message - 서명할 메시지
   * @param {Object} options - 옵션
   * @returns {Promise<Object>} 서명 결과
   */
  async personalSign(params, options = {}) {
    if (!this.state.connected) {
      throw new Error('연결되어 있지 않습니다. 먼저 connect()를 호출하세요.');
    }
    
    if (!this.hasPermission('requestSignature')) {
      throw new Error('서명 요청 권한이 없습니다.');
    }
    
    if (!params || !params.message) {
      throw new Error('서명할 메시지가 필요합니다.');
    }
    
    try {
      // 서명 요청 데이터 구성
      const requestData = {
        raw: params.message
      };
      
      // 서명 요청
      return await this._requestSignature('personalSign', requestData, options);
    } catch (error) {
      this._triggerEvent('error', {
        message: error.message,
        action: 'personalSign'
      });
      throw error;
    }
  }

  /**
   * 타입 데이터 서명 요청 (EIP-712)
   * 
   * @param {Object} params - 서명 매개변수
   * @param {Object} params.typedData - 서명할 타입 데이터
   * @param {Object} options - 옵션
   * @returns {Promise<Object>} 서명 결과
   */
  async signTypedData(params, options = {}) {
    if (!this.state.connected) {
      throw new Error('연결되어 있지 않습니다. 먼저 connect()를 호출하세요.');
    }
    
    if (!this.hasPermission('requestSignature')) {
      throw new Error('서명 요청 권한이 없습니다.');
    }
    
    if (!params || !params.typedData) {
      throw new Error('서명할 타입 데이터가 필요합니다.');
    }
    
    try {
      // 타입 데이터가 문자열인 경우 파싱
      const typedData = typeof params.typedData === 'string'
        ? JSON.parse(params.typedData)
        : params.typedData;
      
      // 서명 요청 데이터 구성
      const requestData = {
        raw: typedData
      };
      
      // 서명 요청
      return await this._requestSignature('signTypedData', requestData, options);
    } catch (error) {
      this._triggerEvent('error', {
        message: error.message,
        action: 'signTypedData'
      });
      throw error;
    }
  }

  /**
   * 트랜잭션 서명 요청
   * 
   * @param {Object} transaction - 트랜잭션 객체
   * @param {Object} options - 옵션
   * @returns {Promise<Object>} 서명 결과
   */
  async signTransaction(transaction, options = {}) {
    if (!this.state.connected) {
      throw new Error('연결되어 있지 않습니다. 먼저 connect()를 호출하세요.');
    }
    
    if (!this.hasPermission('requestSignature')) {
      throw new Error('서명 요청 권한이 없습니다.');
    }
    
    if (!transaction) {
      throw new Error('서명할 트랜잭션이 필요합니다.');
    }
    
    try {
      // 서명 요청 데이터 구성
      const requestData = {
        transaction,
        chainId: transaction.chainId || 1000 // 기본 Catena 체인 ID
      };
      
      // 가스리스 트랜잭션 옵션
      if (options.gasless && this.hasPermission('useGasless')) {
        options.gaslessTransaction = true;
      }
      
      // 서명 요청
      return await this._requestSignature('signTransaction', requestData, options);
    } catch (error) {
      this._triggerEvent('error', {
        message: error.message,
        action: 'signTransaction'
      });
      throw error;
    }
  }

  /**
   * 서명 요청 공통 로직
   * 
   * @param {string} requestType - 요청 유형
   * @param {Object} requestData - 요청 데이터
   * @param {Object} options - 옵션
   * @returns {Promise<Object>} 서명 결과
   * @private
   */
  async _requestSignature(requestType, requestData, options = {}) {
    try {
      // 서명 요청 데이터 구성
      const payload = {
        connectionKey: this.state.connectionKey,
        requestType,
        requestData,
      };
      
      // 옵션 추가
      if (options.gaslessTransaction) {
        payload.gaslessTransaction = true;
      }
      
      if (options.expiresIn) {
        payload.expiresIn = options.expiresIn;
      }
      
      // 트랜잭션 요청 이벤트 트리거
      this._triggerEvent('transactionRequest', {
        type: requestType,
        data: requestData
      });
      
      // 서명 요청
      const response = await this._fetchAPI('/api/relay/dapp/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true
      });
      
      // 자동 승인된 경우 즉시 반환
      if (response.autoApproved) {
        // 트랜잭션 승인 이벤트 트리거
        this._triggerEvent('transactionApproved', {
          transactionId: response.transactionId,
          signature: response.signature,
          autoApproved: true
        });
        
        return {
          signature: response.signature,
          transactionId: response.transactionId
        };
      }
      
      // 모달 또는 폴링 방식으로 승인 대기
      if (options.modal === true) {
        return await this._waitForApprovalWithModal(response.transactionId, requestType, requestData);
      } else {
        return await this._waitForApprovalWithPolling(response.transactionId);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 폴링 방식으로 서명 승인 대기
   * 
   * @param {string} transactionId - 트랜잭션 ID
   * @returns {Promise<Object>} 서명 결과
   * @private
   */
  async _waitForApprovalWithPolling(transactionId) {
    return new Promise((resolve, reject) => {
      let pollCount = 0;
      const maxPolls = 120; // 최대 2분 대기 (1초마다 폴링)
      
      const checkStatus = async () => {
        try {
          pollCount++;
          
          if (pollCount > maxPolls) {
            reject(new Error('서명 요청 시간이 초과되었습니다.'));
            return;
          }
          
          // 상태 조회
          const response = await this._fetchAPI(`/api/relay/dapp/transactions/${transactionId}/status`, {
            skipAuth: true
          });
          
          // 승인된 경우
          if (response.status === 'approved') {
            // 트랜잭션 승인 이벤트 트리거
            this._triggerEvent('transactionApproved', {
              transactionId,
              signature: response.signature,
              autoApproved: response.autoApproved
            });
            
            resolve({
              signature: response.signature,
              transactionId
            });
            return;
          }
          
          // 거부된 경우
          if (response.status === 'rejected') {
            // 트랜잭션 거부 이벤트 트리거
            this._triggerEvent('transactionRejected', {
              transactionId,
              reason: response.error
            });
            
            reject(new Error(response.error || '사용자가 서명 요청을 거부했습니다.'));
            return;
          }
          
          // 만료된 경우
          if (response.status === 'expired') {
            reject(new Error('서명 요청이 만료되었습니다.'));
            return;
          }
          
          // 아직 진행 중인 경우 계속 폴링
          setTimeout(checkStatus, 1000);
        } catch (error) {
          reject(error);
        }
      };
      
      // 첫 번째 폴링 시작
      setTimeout(checkStatus, 1000);
    });
  }

  /**
   * 모달 방식으로 서명 승인 대기
   * 
   * @param {string} transactionId - 트랜잭션 ID
   * @param {string} requestType - 요청 유형
   * @param {Object} requestData - 요청 데이터
   * @returns {Promise<Object>} 서명 결과
   * @private
   */
  async _waitForApprovalWithModal(transactionId, requestType, requestData) {
    return new Promise((resolve, reject) => {
      try {
        // 모달 컨테이너 생성
        const modalContainer = document.createElement('div');
        modalContainer.id = 'nest-signature-modal-container';
        modalContainer.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
        `;
        
        // 모달 프레임 생성
        const modalFrame = document.createElement('div');
        modalFrame.style.cssText = `
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          width: 480px;
          max-width: 100%;
          max-height: 90vh;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;
        
        // iframe 생성
        const iframe = document.createElement('iframe');
        
        // 파라미터 구성
        const params = new URLSearchParams({
          transactionId,
          requestType,
          dappName: this.dappInfo.name,
          dappDomain: this.dappInfo.domain,
          modal: 'true',
          ...(this.dappInfo.logoUrl && { dappLogo: this.dappInfo.logoUrl })
        }).toString();
        
        // iframe URL 구성
        const iframeUrl = `${this.apiUrl}/approve-transaction?${params}`;
        
        iframe.src = iframeUrl;
        iframe.style.cssText = `
          width: 100%;
          height: 600px;
          max-height: 90vh;
          border: none;
        `;
        
        // 모달 닫기 버튼
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.8);
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100000;
        `;
        
        closeButton.addEventListener('click', () => {
          document.body.removeChild(modalContainer);
          reject(new Error('사용자가 서명 요청을 취소했습니다.'));
        });
        
        // 모달 구성
        modalFrame.appendChild(iframe);
        modalContainer.appendChild(modalFrame);
        modalContainer.appendChild(closeButton);
        document.body.appendChild(modalContainer);
        
        // 메시지 이벤트 리스너
        const messageHandler = async (event) => {
          try {
            // 출처 검증
            if (!event.origin.includes(this.apiUrl.replace(/^https?:\/\//, ''))) {
              return;
            }
            
            // 메시지 검증
            if (!event.data || event.data.type !== 'NEST_SIGNATURE_RESULT') {
              return;
            }
            
            // 이벤트 리스너 제거
            window.removeEventListener('message', messageHandler);
            
            // 모달 제거
            if (document.body.contains(modalContainer)) {
              document.body.removeChild(modalContainer);
            }
            
            // 오류 확인
            if (event.data.error) {
              // 트랜잭션 거부 이벤트 트리거
              this._triggerEvent('transactionRejected', {
                transactionId,
                reason: event.data.error
              });
              
              reject(new Error(event.data.error));
              return;
            }
            
            // 트랜잭션 승인 이벤트 트리거
            this._triggerEvent('transactionApproved', {
              transactionId,
              signature: event.data.signature,
              autoApproved: false
            });
            
            // 결과 반환
            resolve({
              signature: event.data.signature,
              transactionId
            });
          } catch (error) {
            reject(error);
          }
        };
        
        // 이벤트 리스너 등록
        window.addEventListener('message', messageHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 트랜잭션 완료 보고
   * 
   * @param {string} transactionId - 트랜잭션 ID
   * @param {string} txHash - 블록체인 트랜잭션 해시
   * @param {number} blockNumber - 블록 번호 (선택 사항)
   * @returns {Promise<Object>} 완료 결과
   */
  async completeTransaction(transactionId, txHash, blockNumber) {
    if (!transactionId || !txHash) {
      throw new Error('트랜잭션 ID와 해시가 필요합니다.');
    }
    
    try {
      const payload = {
        txHash,
        ...(blockNumber !== undefined && { blockNumber })
      };
      
      // 완료 보고
      const response = await this._fetchAPI(`/api/relay/dapp/transactions/${transactionId}/complete`, {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true
      });
      
      return response;
    } catch (error) {
      this._triggerEvent('error', {
        message: error.message,
        action: 'completeTransaction'
      });
      throw error;
    }
  }

  /**
   * 트랜잭션 실패 보고
   * 
   * @param {string} transactionId - 트랜잭션 ID
   * @param {string} error - 오류 메시지
   * @returns {Promise<Object>} 실패 결과
   */
  async failTransaction(transactionId, error) {
    if (!transactionId) {
      throw new Error('트랜잭션 ID가 필요합니다.');
    }
    
    try {
      const payload = {
        error: error || '알 수 없는 오류'
      };
      
      // 실패 보고
      const response = await this._fetchAPI(`/api/relay/dapp/transactions/${transactionId}/fail`, {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true
      });
      
      return response;
    } catch (error) {
      this._triggerEvent('error', {
        message: error.message,
        action: 'failTransaction'
      });
      throw error;
    }
  }
}

// 전역 객체에 등록
if (typeof window !== 'undefined') {
  window.NestRelaySDK = NestRelaySDK;
}

// 모듈 내보내기
module.exports = NestRelaySDK;
