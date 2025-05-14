# Nest Relay SDK

Nest Relay SDK는 외부 DApp에서 Nest 플랫폼의 기능을 쉽게 사용할 수 있도록 도와주는 클라이언트 라이브러리입니다. 이 SDK를 통해 사용자는 자신의 Nest ID와 지갑을 안전하게 연결하고, 서명 요청 등의 기능을 사용할 수 있습니다.

## 설치 방법

### NPM을 사용하는 경우

```bash
npm install nest-relay-sdk
```

### CDN을 사용하는 경우

```html
<script src="https://cdn.creatachain.com/nest/sdk/v1/nest-relay-sdk.min.js"></script>
```

## 기본 사용법

### SDK 초기화

```javascript
// SDK 초기화
const nestRelay = new NestRelaySDK({
  apiUrl: 'https://api.nest.creatachain.com',
  dappName: '내 DApp',
  dappDomain: 'mydapp.com',
  dappLogo: 'https://mydapp.com/logo.png', // 선택 사항
  dappDescription: '내 DApp 설명' // 선택 사항
});
```

### 이벤트 리스너 등록

```javascript
// 연결 이벤트 리스너
nestRelay.on('connect', (data) => {
  console.log('연결됨:', data);
  console.log('Nest ID:', data.nestId);
  console.log('지갑 주소:', data.walletAddress);
});

// 연결 해제 이벤트 리스너
nestRelay.on('disconnect', () => {
  console.log('연결 해제됨');
});

// 오류 이벤트 리스너
nestRelay.on('error', (error) => {
  console.error('오류 발생:', error);
});

// 트랜잭션 요청 이벤트 리스너
nestRelay.on('transactionRequest', (data) => {
  console.log('트랜잭션 요청:', data);
});

// 트랜잭션 승인 이벤트 리스너
nestRelay.on('transactionApproved', (data) => {
  console.log('트랜잭션 승인됨:', data);
});

// 트랜잭션 거부 이벤트 리스너
nestRelay.on('transactionRejected', (data) => {
  console.log('트랜잭션 거부됨:', data);
});
```

### 연결 및 연결 해제

```javascript
// 팝업으로 연결
async function connect() {
  try {
    const result = await nestRelay.connect();
    console.log('연결 성공:', result);
  } catch (error) {
    console.error('연결 실패:', error);
  }
}

// 모달로 연결
async function connectWithModal() {
  try {
    const result = await nestRelay.connect({ modal: true });
    console.log('연결 성공:', result);
  } catch (error) {
    console.error('연결 실패:', error);
  }
}

// 연결 해제
async function disconnect() {
  try {
    const result = await nestRelay.disconnect();
    console.log('연결 해제 성공:', result);
  } catch (error) {
    console.error('연결 해제 실패:', error);
  }
}
```

### 서명 요청

```javascript
// 메시지 서명
async function signMessage() {
  try {
    const message = 'Hello, Nest!';
    const result = await nestRelay.signMessage({ message });
    console.log('서명 결과:', result.signature);
    return result;
  } catch (error) {
    console.error('서명 실패:', error);
    throw error;
  }
}

// 개인 메시지 서명
async function personalSign() {
  try {
    const message = 'Hello, Nest!';
    const result = await nestRelay.personalSign({ message });
    console.log('서명 결과:', result.signature);
    return result;
  } catch (error) {
    console.error('서명 실패:', error);
    throw error;
  }
}

// 타입 데이터 서명 (EIP-712)
async function signTypedData() {
  try {
    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' }
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' }
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' }
        ]
      },
      primaryType: 'Mail',
      domain: {
        name: '내 DApp',
        version: '1',
        chainId: 1000,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
      },
      message: {
        from: {
          name: 'Alice',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
        },
        to: {
          name: 'Bob',
          wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
        },
        contents: 'Hello, Bob!'
      }
    };
    
    const result = await nestRelay.signTypedData({ typedData });
    console.log('서명 결과:', result.signature);
    return result;
  } catch (error) {
    console.error('서명 실패:', error);
    throw error;
  }
}

// 트랜잭션 서명
async function signTransaction() {
  try {
    // CTA 전송 트랜잭션 예시
    const transaction = {
      to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      value: '0.1', // CTA
      data: '0x',
      gasLimit: '21000',
      gasPrice: '5000000000',
      nonce: 0,
      chainId: 1000 // Catena 체인 ID
    };
    
    // 모달로 서명 요청
    const result = await nestRelay.signTransaction(transaction, { modal: true });
    console.log('서명 결과:', result.signature);
    
    // 트랜잭션 전송 (Web3.js 또는 ethers.js 사용)
    // ...
    
    // 트랜잭션이 성공적으로 전송된 경우 완료 보고
    await nestRelay.completeTransaction(result.transactionId, txHash, blockNumber);
    
    return result;
  } catch (error) {
    console.error('서명 실패:', error);
    throw error;
  }
}

// 가스리스 트랜잭션 서명
async function signGaslessTransaction() {
  try {
    // CTA 전송 트랜잭션 예시
    const transaction = {
      to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      value: '0.1', // CTA
      data: '0x',
      gasLimit: '21000',
      gasPrice: '0', // 가스리스 트랜잭션은 가스 가격이 0
      nonce: 0,
      chainId: 1000 // Catena 체인 ID
    };
    
    // 가스리스 옵션 활성화하여 서명 요청
    const result = await nestRelay.signTransaction(transaction, { gasless: true });
    console.log('서명 결과:', result.signature);
    
    // 트랜잭션 전송 (중계 서비스를 통해)
    // ...
    
    // 트랜잭션이 성공적으로 전송된 경우 완료 보고
    await nestRelay.completeTransaction(result.transactionId, txHash, blockNumber);
    
    return result;
  } catch (error) {
    console.error('서명 실패:', error);
    
    // 트랜잭션 실패 보고
    if (result && result.transactionId) {
      await nestRelay.failTransaction(result.transactionId, error.message);
    }
    
    throw error;
  }
}
```

### 유틸리티 함수

```javascript
// 연결 상태 확인
function checkConnection() {
  const isConnected = nestRelay.isConnected();
  console.log('연결됨:', isConnected);
  
  if (isConnected) {
    const nestId = nestRelay.getNestId();
    const walletAddress = nestRelay.getWalletAddress();
    const permissions = nestRelay.getPermissions();
    
    console.log('Nest ID:', nestId);
    console.log('지갑 주소:', walletAddress);
    console.log('권한:', permissions);
  }
  
  return isConnected;
}

// 권한 확인
function checkPermission(permission) {
  const hasPermission = nestRelay.hasPermission(permission);
  console.log(`${permission} 권한:`, hasPermission);
  return hasPermission;
}
```

## React에서 사용하기

```jsx
import React, { useState, useEffect } from 'react';
import NestRelaySDK from 'nest-relay-sdk';

// SDK 인스턴스 생성
const nestRelay = new NestRelaySDK({
  apiUrl: 'https://api.nest.creatachain.com',
  dappName: '내 React DApp',
  dappDomain: 'myreactdapp.com',
  dappLogo: 'https://myreactdapp.com/logo.png',
});

function NestConnectButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [nestId, setNestId] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // 이벤트 리스너 등록
    nestRelay.on('connect', (data) => {
      setIsConnected(true);
      setNestId(data.nestId);
    });
    
    nestRelay.on('disconnect', () => {
      setIsConnected(false);
      setNestId(null);
    });
    
    nestRelay.on('error', (error) => {
      setError(error.message);
    });
    
    // 컴포넌트 마운트 시 연결 상태 확인
    if (nestRelay.isConnected()) {
      setIsConnected(true);
      setNestId(nestRelay.getNestId());
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      nestRelay.off('connect');
      nestRelay.off('disconnect');
      nestRelay.off('error');
    };
  }, []);
  
  const handleConnect = async () => {
    try {
      setError(null);
      await nestRelay.connect({ modal: true });
    } catch (error) {
      setError(error.message);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setError(null);
      await nestRelay.disconnect();
    } catch (error) {
      setError(error.message);
    }
  };
  
  return (
    <div>
      {isConnected ? (
        <div>
          <p>연결됨: {nestId?.name}</p>
          <button onClick={handleDisconnect}>연결 해제</button>
        </div>
      ) : (
        <button onClick={handleConnect}>Nest로 연결</button>
      )}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default NestConnectButton;
```

## 전체 API 문서

자세한 API 문서는 [https://docs.nest.creatachain.com/sdk](https://docs.nest.creatachain.com/sdk)에서 확인할 수 있습니다.

## 지원 및 문의

문제가 발생하거나 질문이 있으시면 [GitHub 이슈](https://github.com/creatachain/nest-relay-sdk/issues)를 통해 문의해주세요.
