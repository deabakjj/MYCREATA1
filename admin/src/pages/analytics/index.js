import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import analytics pages
import UserConversionPage from './UserConversionPage';
import WalletRetentionPage from './WalletRetentionPage';
import TokenExchangePage from './TokenExchangePage';
import XpAccumulationPage from './XpAccumulationPage';
import NftOwnershipPage from './NftOwnershipPage';

/**
 * Analytics module main entry point component
 * Handles routing for all analytics sub-pages
 */
const AnalyticsModule = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="user-conversion" replace />} />
      <Route path="user-conversion" element={<UserConversionPage />} />
      <Route path="wallet-retention" element={<WalletRetentionPage />} />
      <Route path="token-exchange" element={<TokenExchangePage />} />
      <Route path="xp-accumulation" element={<XpAccumulationPage />} />
      <Route path="nft-ownership" element={<NftOwnershipPage />} />
    </Routes>
  );
};

export default AnalyticsModule;

// Named exports for direct imports
export { default as UserConversionPage } from './UserConversionPage';
export { default as WalletRetentionPage } from './WalletRetentionPage';
export { default as TokenExchangePage } from './TokenExchangePage';
export { default as XpAccumulationPage } from './XpAccumulationPage';
export { default as NftOwnershipPage } from './NftOwnershipPage';
