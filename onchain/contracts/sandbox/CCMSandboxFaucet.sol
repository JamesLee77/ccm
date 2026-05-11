// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICCMMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @title CCM Sandbox Faucet (TESTNET ONLY)
 * @notice Anyone can call `claim()` to receive a fixed amount of test CCM,
 *         subject to a per-address cooldown.
 *
 * @dev SAFETY:
 *   - This contract MUST NOT be deployed to mainnet. It exists solely so the
 *     public testnet sandbox at testnet.ccmnetwork.net can self-serve test
 *     CCM without admin intervention. Granting it MINTER_ROLE on a mainnet
 *     CCMToken would break the 5B hard-cap allocation policy.
 *   - The contract has no admin, no pause, no upgradability. Once granted
 *     MINTER_ROLE on a sandbox CCMToken it operates autonomously.
 *   - Hard cap defense: even if every address claims continuously, the rate
 *     is bounded by CLAIM_AMOUNT / COOLDOWN per address. The CCMToken's own
 *     ERC20Capped (5B) is the ultimate ceiling; the faucet cannot mint past
 *     it because mint() will revert on cap overflow.
 *   - Located in contracts/sandbox/ so deploy scripts targeting mainnet do
 *     not pick it up; only the testnet faucet deploy script references it.
 */
contract CCMSandboxFaucet {
    /// @notice The sandbox CCMToken. Set at construction; immutable forever.
    ICCMMintable public immutable token;

    /// @notice Amount minted per claim (100 CCM with 18 decimals).
    uint256 public constant CLAIM_AMOUNT = 100 * 10**18;

    /// @notice Minimum interval between claims by the same address.
    uint256 public constant COOLDOWN = 1 days;

    /// @notice Last unix timestamp at which `user` claimed (0 = never).
    mapping(address => uint256) public lastClaim;

    /// @notice Cumulative CCM minted through this faucet.
    uint256 public totalMinted;

    /// @notice Cumulative number of `claim()` calls.
    uint256 public claimCount;

    event Claimed(address indexed user, uint256 amount, uint256 nextClaimAt);

    constructor(address ccmToken) {
        require(ccmToken != address(0), "Faucet: token zero");
        token = ICCMMintable(ccmToken);
    }

    /**
     * @notice Mint CLAIM_AMOUNT test CCM to msg.sender.
     * @dev Reverts if the caller's cooldown is still active. Anyone may call.
     */
    function claim() external {
        uint256 last = lastClaim[msg.sender];
        require(
            last == 0 || block.timestamp >= last + COOLDOWN,
            "Faucet: cooldown active"
        );
        lastClaim[msg.sender] = block.timestamp;
        totalMinted += CLAIM_AMOUNT;
        unchecked { ++claimCount; }
        token.mint(msg.sender, CLAIM_AMOUNT);
        emit Claimed(msg.sender, CLAIM_AMOUNT, block.timestamp + COOLDOWN);
    }

    /// @notice Unix timestamp at which `user` may next claim. 0 if never claimed.
    function nextClaimAt(address user) external view returns (uint256) {
        uint256 last = lastClaim[user];
        return last == 0 ? 0 : last + COOLDOWN;
    }

    /// @notice Seconds remaining until `user` can claim again, or 0 if claimable now.
    function cooldownRemaining(address user) external view returns (uint256) {
        uint256 last = lastClaim[user];
        if (last == 0) return 0;
        uint256 next = last + COOLDOWN;
        return block.timestamp >= next ? 0 : next - block.timestamp;
    }
}
