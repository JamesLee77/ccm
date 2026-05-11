// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title CCM Sandbox USDC (TESTNET ONLY)
 * @notice Trivial 6-decimal ERC-20 used as the borrow asset in the
 *         §7.4 vault-lending demo. Anyone can `claim()` 1,000 USDC
 *         once per 24h. No real value, no admin, no pause.
 *
 * @dev Constructor refuses chainId 8453. The mainnet integration will
 *      use real Circle USDC, not this contract.
 */
contract CCMSandboxUSDC is ERC20 {
    uint256 public constant CLAIM_AMOUNT = 1_000 * 10**6;
    uint256 public constant COOLDOWN = 1 days;
    mapping(address => uint256) public lastClaim;
    uint256 public totalClaimed;

    event Claimed(address indexed user, uint256 amount, uint256 nextClaimAt);

    constructor() ERC20("CCM Sandbox USDC", "USDC-sand") {
        require(block.chainid != 8453, "SandboxUSDC: refuse mainnet");
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function claim() external {
        uint256 last = lastClaim[msg.sender];
        require(
            last == 0 || block.timestamp >= last + COOLDOWN,
            "SandboxUSDC: cooldown"
        );
        lastClaim[msg.sender] = block.timestamp;
        totalClaimed += CLAIM_AMOUNT;
        _mint(msg.sender, CLAIM_AMOUNT);
        emit Claimed(msg.sender, CLAIM_AMOUNT, block.timestamp + COOLDOWN);
    }

    function cooldownRemaining(address user) external view returns (uint256) {
        uint256 last = lastClaim[user];
        if (last == 0) return 0;
        uint256 next = last + COOLDOWN;
        return block.timestamp >= next ? 0 : next - block.timestamp;
    }
}
