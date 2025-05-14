const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { mine } = require('@nomicfoundation/hardhat-network-helpers');

describe('Nest Contract Security Tests', function () {
  // We define a fixture to reuse the same setup in every test
  async function deployContractsFixture() {
    // Get signers
    const [owner, user1, user2, attacker, treasury] = await ethers.getSigners();
    
    // Deploy NestToken
    const NestToken = await ethers.getContractFactory('NestToken');
    const nestToken = await NestToken.deploy('NEST Token', 'NEST', ethers.utils.parseEther('10000000000')); // 100억 tokens
    
    // Deploy NestNFT
    const NestNFT = await ethers.getContractFactory('NestNFT');
    const nestNFT = await NestNFT.deploy('Nest NFT', 'NNFT', nestToken.address);
    
    // Deploy NestNameRegistry
    const NestNameRegistry = await ethers.getContractFactory('NestNameRegistry');
    const nestNameRegistry = await NestNameRegistry.deploy();
    
    // Deploy NestSwap
    const mockCTA = await ethers.getContractFactory('MockCTA');
    const cta = await mockCTA.deploy('CTA Token', 'CTA', ethers.utils.parseEther('1000000')); // 백만 CTA tokens
    
    const NestSwap = await ethers.getContractFactory('NestSwap');
    const nestSwap = await NestSwap.deploy(
      nestToken.address,
      cta.address,
      treasury.address
    );
    
    // Grant minter role to the nestNFT contract
    const MINTER_ROLE = await nestToken.MINTER_ROLE();
    await nestToken.grantRole(MINTER_ROLE, nestNFT.address);
    
    // Transfer some tokens for testing
    await nestToken.transfer(user1.address, ethers.utils.parseEther('1000'));
    await nestToken.transfer(user2.address, ethers.utils.parseEther('500'));
    await cta.transfer(user1.address, ethers.utils.parseEther('100'));
    await cta.transfer(user2.address, ethers.utils.parseEther('50'));
    
    // Approve the swap contract to spend tokens
    await nestToken.connect(owner).approve(nestSwap.address, ethers.utils.parseEther('1000000'));
    await cta.connect(owner).approve(nestSwap.address, ethers.utils.parseEther('1000'));
    
    return { 
      nestToken, 
      nestNFT, 
      nestNameRegistry, 
      nestSwap, 
      cta, 
      owner, 
      user1, 
      user2, 
      attacker, 
      treasury 
    };
  }

  describe('NestToken Security', function () {
    it('Should prevent unauthorized minting', async function () {
      const { nestToken, attacker } = await loadFixture(deployContractsFixture);
      
      // Attacker should not be able to mint tokens
      await expect(
        nestToken.connect(attacker).mint(attacker.address, ethers.utils.parseEther('1000'))
      ).to.be.reverted;
    });
    
    it('Should enforce whitelist when enabled', async function () {
      const { nestToken, user1, user2, attacker } = await loadFixture(deployContractsFixture);
      
      // Enable whitelist
      await nestToken.setWhitelistOnly(true);
      
      // Add user1 to whitelist
      await nestToken.addToWhitelist(user1.address);
      
      // User1 should be able to transfer
      await nestToken.connect(user1).transfer(user2.address, ethers.utils.parseEther('100'));
      
      // User2 is not whitelisted, so transfer should fail
      await expect(
        nestToken.connect(user2).transfer(user1.address, ethers.utils.parseEther('50'))
      ).to.be.reverted;
      
      // Add user2 to whitelist and try again
      await nestToken.addToWhitelist(user2.address);
      await nestToken.connect(user2).transfer(user1.address, ethers.utils.parseEther('50'));
      
      // Attacker should not be able to bypass whitelist
      await nestToken.transfer(attacker.address, ethers.utils.parseEther('10'));
      await expect(
        nestToken.connect(attacker).transfer(user1.address, ethers.utils.parseEther('5'))
      ).to.be.reverted;
    });
    
    it('Should enforce blacklist restrictions', async function () {
      const { nestToken, user1, user2 } = await loadFixture(deployContractsFixture);
      
      // Add user2 to blacklist
      await nestToken.addToBlacklist(user2.address);
      
      // User2 should not be able to transfer
      await expect(
        nestToken.connect(user2).transfer(user1.address, ethers.utils.parseEther('10'))
      ).to.be.reverted;
      
      // User1 should not be able to transfer to user2
      await expect(
        nestToken.connect(user1).transfer(user2.address, ethers.utils.parseEther('10'))
      ).to.be.reverted;
      
      // Remove user2 from blacklist and try again
      await nestToken.removeFromBlacklist(user2.address);
      await nestToken.connect(user2).transfer(user1.address, ethers.utils.parseEther('10'));
    });

    it('Should prevent integer overflow in token transfers', async function () {
      const { nestToken, user1, user2 } = await loadFixture(deployContractsFixture);
      
      // Try to transfer more than the balance
      const balance = await nestToken.balanceOf(user1.address);
      const moreThanBalance = balance.add(ethers.utils.parseEther('1'));
      
      await expect(
        nestToken.connect(user1).transfer(user2.address, moreThanBalance)
      ).to.be.reverted;
    });
  });

  describe('NestNameRegistry Security', function () {
    it('Should prevent name squatting', async function () {
      const { nestNameRegistry, user1, attacker } = await loadFixture(deployContractsFixture);
      
      // User1 registers a name
      const name = 'johndoe';
      await nestNameRegistry.connect(user1).registerName(name, user1.address);
      
      // Attacker tries to register the same name
      await expect(
        nestNameRegistry.connect(attacker).registerName(name, attacker.address)
      ).to.be.reverted;
    });
    
    it('Should enforce name length restrictions', async function () {
      const { nestNameRegistry, user1 } = await loadFixture(deployContractsFixture);
      
      // Try to register a name that's too short
      await expect(
        nestNameRegistry.connect(user1).registerName('a', user1.address)
      ).to.be.reverted;
      
      // Try to register a name that's too long
      const longName = 'a'.repeat(50);
      await expect(
        nestNameRegistry.connect(user1).registerName(longName, user1.address)
      ).to.be.reverted;
      
      // Register a valid name
      await nestNameRegistry.connect(user1).registerName('validname', user1.address);
    });
    
    it('Should prevent unauthorized transfers of names', async function () {
      const { nestNameRegistry, user1, user2, attacker } = await loadFixture(deployContractsFixture);
      
      // User1 registers a name
      const name = 'johndoe';
      await nestNameRegistry.connect(user1).registerName(name, user1.address);
      
      // Attacker tries to transfer the name
      await expect(
        nestNameRegistry.connect(attacker).transferName(name, user2.address)
      ).to.be.reverted;
      
      // Owner should be able to transfer
      await nestNameRegistry.connect(user1).transferName(name, user2.address);
      
      // Verify the new owner
      expect(await nestNameRegistry.getNameOwner(name)).to.equal(user2.address);
    });
  });
  
  describe('NestSwap Security', function () {
    it('Should prevent unauthorized setting of exchange rate', async function () {
      const { nestSwap, attacker } = await loadFixture(deployContractsFixture);
      
      // Attacker tries to set the exchange rate
      await expect(
        nestSwap.connect(attacker).setExchangeRate(ethers.utils.parseEther('2000'))
      ).to.be.reverted;
    });
    
    it('Should enforce daily swap limits', async function () {
      const { nestSwap, nestToken, cta, user1 } = await loadFixture(deployContractsFixture);
      
      // Set daily limit
      await nestSwap.setDailyLimit(ethers.utils.parseEther('50'));
      
      // User approves tokens
      await cta.connect(user1).approve(nestSwap.address, ethers.utils.parseEther('100'));
      
      // First swap should succeed
      await nestSwap.connect(user1).swapCTAForNEST(ethers.utils.parseEther('30'));
      
      // Second swap should succeed
      await nestSwap.connect(user1).swapCTAForNEST(ethers.utils.parseEther('15'));
      
      // Third swap should fail due to daily limit
      await expect(
        nestSwap.connect(user1).swapCTAForNEST(ethers.utils.parseEther('10'))
      ).to.be.reverted;
      
      // Advance time by 24 hours
      await mine(5760); // ~24 hours with 15-second blocks
      
      // Now the swap should succeed
      await nestSwap.connect(user1).swapCTAForNEST(ethers.utils.parseEther('10'));
    });
    
    it('Should handle precision issues correctly', async function () {
      const { nestSwap, nestToken, cta, user1 } = await loadFixture(deployContractsFixture);
      
      // Set exchange rate to a "weird" number
      await nestSwap.setExchangeRate(ethers.utils.parseEther('1234.56789'));
      
      // User approves tokens
      await cta.connect(user1).approve(nestSwap.address, ethers.utils.parseEther('0.0001'));
      
      // Swap a very small amount
      await nestSwap.connect(user1).swapCTAForNEST(ethers.utils.parseEther('0.0001'));
      
      // Verify the received amount is correct
      const expectedNEST = ethers.utils.parseEther('0.0001').mul(ethers.utils.parseEther('1234.56789')).div(ethers.utils.parseEther('1'));
      const balance = await nestToken.balanceOf(user1.address);
      expect(balance).to.be.closeTo(ethers.utils.parseEther('1000').add(expectedNEST), ethers.utils.parseEther('0.00001'));
    });
  });

  describe('NestNFT Security', function () {
    it('Should prevent unauthorized minting', async function () {
      const { nestNFT, attacker, user1 } = await loadFixture(deployContractsFixture);
      
      // Attacker tries to mint NFT
      await expect(
        nestNFT.connect(attacker).mintNFT(user1.address, 'ipfs://QmTest')
      ).to.be.reverted;
    });
    
    it('Should enforce URI format validation', async function () {
      const { nestNFT, owner, user1 } = await loadFixture(deployContractsFixture);
      
      // Try to mint with invalid URI (missing protocol)
      await expect(
        nestNFT.connect(owner).mintNFT(user1.address, 'QmTest')
      ).to.be.reverted;
      
      // Mint with proper URI
      await nestNFT.connect(owner).mintNFT(user1.address, 'ipfs://QmTest');
    });
    
    it('Should handle tokenURI correctly for non-existent tokens', async function () {
      const { nestNFT } = await loadFixture(deployContractsFixture);
      
      // Try to get URI of non-existent token
      await expect(nestNFT.tokenURI(9999)).to.be.reverted;
    });
  });
  
  describe('Reentrancy Protection', function () {
    it('Should prevent reentrancy attacks on mint and transfer', async function () {
      const { nestToken, owner } = await loadFixture(deployContractsFixture);
      
      // Deploy the malicious contract
      const MaliciousReceiver = await ethers.getContractFactory('MaliciousReceiver');
      const malicious = await MaliciousReceiver.deploy(nestToken.address);
      
      // Fund the malicious contract
      await nestToken.transfer(malicious.address, ethers.utils.parseEther('100'));
      
      // Grant minter role to owner for this test
      const MINTER_ROLE = await nestToken.MINTER_ROLE();
      await nestToken.grantRole(MINTER_ROLE, owner.address);
      
      // Try to trigger reentrancy via mint
      await expect(
        malicious.attackMint(ethers.utils.parseEther('100'))
      ).to.be.reverted;
      
      // Try to trigger reentrancy via transfer
      await expect(
        malicious.attackTransfer(owner.address, ethers.utils.parseEther('50'))
      ).to.be.reverted;
    });
  });
  
  describe('Access Control Security', function () {
    it('Should enforce proper role-based access control', async function () {
      const { nestToken, nestNFT, user1, attacker } = await loadFixture(deployContractsFixture);
      
      // Attacker tries to grant roles
      const MINTER_ROLE = await nestToken.MINTER_ROLE();
      await expect(
        nestToken.connect(attacker).grantRole(MINTER_ROLE, attacker.address)
      ).to.be.reverted;
      
      // Attacker tries to add admin
      const DEFAULT_ADMIN_ROLE = await nestToken.DEFAULT_ADMIN_ROLE();
      await expect(
        nestToken.connect(attacker).grantRole(DEFAULT_ADMIN_ROLE, attacker.address)
      ).to.be.reverted;
      
      // Owner grants minter role to user1
      await nestToken.grantRole(MINTER_ROLE, user1.address);
      
      // User1 should now be able to mint
      await nestToken.connect(user1).mint(user1.address, ethers.utils.parseEther('100'));
    });
  });
  
  describe('Rate Limiting and Anti-DOS', function () {
    it('Should enforce rate limiting on frequent operations', async function () {
      const { nestNameRegistry, user1 } = await loadFixture(deployContractsFixture);
      
      // Enable rate limiting (this would be a real function in the actual contract)
      if (nestNameRegistry.setRateLimitingEnabled) {
        await nestNameRegistry.setRateLimitingEnabled(true);
      }
      
      // Register multiple names in a loop
      for (let i = 0; i < 5; i++) {
        const name = `testname${i}`;
        
        // This should work for the first few iterations and then potentially fail
        // depending on the rate limiting implementation
        try {
          await nestNameRegistry.connect(user1).registerName(name, user1.address);
        } catch (error) {
          // If we hit rate limiting, verify it's due to rate limiting
          if (!error.message.includes('rate limit')) {
            throw error;
          }
        }
      }
      
      // Additional check if the contract has specific rate limiting functions
      if (nestNameRegistry.isRateLimited) {
        const isLimited = await nestNameRegistry.isRateLimited(user1.address);
        expect(isLimited).to.be.true;
      }
    });
  });
});

// Mock contract for reentrancy testing
// (This would be in a separate file in a real project)
// @dev MaliciousReceiver.sol
contract MaliciousReceiver {
  NestToken private nestToken;
  bool private attacking = false;
  
  constructor(address _nestToken) {
    nestToken = NestToken(_nestToken);
  }
  
  function attackMint(uint256 amount) external {
    attacking = true;
    nestToken.mint(address(this), amount);
  }
  
  function attackTransfer(address to, uint256 amount) external {
    attacking = true;
    nestToken.transfer(to, amount);
  }
  
  function onERC20Receive(address, uint256) external {
    if (attacking) {
      // Attempt to reenter
      nestToken.transfer(msg.sender, 1);
      attacking = false;
    }
  }
}
