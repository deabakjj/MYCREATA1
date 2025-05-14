/**
 * 분석 모듈 인덱스
 * 
 * 모든 분석 모듈을 한 번에 가져올 수 있도록 내보냅니다.
 */

const userConversion = require('./userConversion');
const walletRetention = require('./walletRetention');
const tokenExchange = require('./tokenExchange');
const xpAccumulation = require('./xpAccumulation');
const nftOwnership = require('./nftOwnership');

module.exports = {
  userConversion,
  walletRetention,
  tokenExchange,
  xpAccumulation,
  nftOwnership
};
