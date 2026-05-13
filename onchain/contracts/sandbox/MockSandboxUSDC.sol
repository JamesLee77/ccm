// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockSandboxUSDC
 * @notice Test-USDC for the testnet sandbox. ERC20 with 6 decimals
 *         matching Circle's official USDC. Two faucet paths:
 *           1. Public self-faucet — anyone calls `faucet()` to mint
 *              `FAUCET_AMOUNT` (100 USDC) to msg.sender, 1h cooldown
 *              per address.
 *           2. Owner mint — operator mints arbitrary amount to any
 *              address (for LP seeding, initial distribution, etc.).
 *
 * @dev Refuses deployment on Base mainnet (chainId 8453). Sandbox only.
 *      The address-cooldown pattern matches CCMSandboxNFT so users have
 *      a consistent mental model across the playground.
 */
contract MockSandboxUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    uint256 public constant FAUCET_AMOUNT = 100 * 10 ** DECIMALS; // 100 USDC
    uint256 public constant FAUCET_COOLDOWN = 1 hours;

    mapping(address => uint256) public lastFaucetAt;

    event FaucetClaimed(address indexed user, uint256 amount);
    event OwnerMinted(address indexed to, uint256 amount);

    constructor(address initialOwner)
        ERC20("Sandbox USDC", "sUSDC")
        Ownable(initialOwner)
    {
        require(block.chainid != 8453, "sUSDC: refuses mainnet");
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /// @notice Anyone may claim FAUCET_AMOUNT once per cooldown window.
    function faucet() external {
        uint256 last = lastFaucetAt[msg.sender];
        require(last == 0 || block.timestamp >= last + FAUCET_COOLDOWN, "sUSDC: cooldown");
        lastFaucetAt[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Seconds remaining until `user` can call faucet() again, or 0 if ready.
    function cooldownRemaining(address user) external view returns (uint256) {
        uint256 last = lastFaucetAt[user];
        if (last == 0) return 0;
        uint256 nextAt = last + FAUCET_COOLDOWN;
        if (block.timestamp >= nextAt) return 0;
        return nextAt - block.timestamp;
    }

    /// @notice Owner can mint any amount. For LP seeding, demo distributions.
    function ownerMint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit OwnerMinted(to, amount);
    }
}
