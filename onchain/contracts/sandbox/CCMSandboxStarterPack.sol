// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICCMMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @title CCMSandboxStarterPack
 * @notice One-click starter pack for new testnet visitors. Mints
 *         CCM_AMOUNT of CCM and transfers SUSDC_AMOUNT of sUSDC to
 *         the caller. Per-address cooldown prevents drainage.
 *
 * @dev Requires:
 *   - MINTER_ROLE on the sandbox CCMToken (granted by deployer).
 *   - sUSDC balance preloaded by deployer (transferred to this contract).
 * Refuses deployment on Base mainnet (chainId 8453).
 */
contract CCMSandboxStarterPack is Ownable {
    IERC20 public immutable sUSDC;
    ICCMMintable public immutable ccm;

    uint256 public constant CCM_AMOUNT = 50 * 10 ** 18;     // 50 CCM
    uint256 public constant SUSDC_AMOUNT = 100 * 10 ** 6;   // 100 sUSDC
    uint256 public constant COOLDOWN = 1 hours;

    mapping(address => uint256) public lastClaimedAt;

    event StarterPackClaimed(address indexed user, uint256 ccmAmount, uint256 susdcAmount);
    event sUSDCWithdrawn(address indexed to, uint256 amount);

    error CooldownActive(uint256 secondsRemaining);
    error InsufficientSUsdcBalance(uint256 needed, uint256 have);

    constructor(address ccmAddress, address sUsdcAddress, address initialOwner) Ownable(initialOwner) {
        require(block.chainid != 8453, "StarterPack: refuses mainnet");
        require(ccmAddress != address(0) && sUsdcAddress != address(0), "StarterPack: zero addr");
        ccm = ICCMMintable(ccmAddress);
        sUSDC = IERC20(sUsdcAddress);
    }

    /// @notice Claim CCM_AMOUNT CCM + SUSDC_AMOUNT sUSDC. 1h cooldown per address.
    function claim() external {
        uint256 last = lastClaimedAt[msg.sender];
        if (last != 0 && block.timestamp < last + COOLDOWN) {
            revert CooldownActive(last + COOLDOWN - block.timestamp);
        }
        uint256 sBal = sUSDC.balanceOf(address(this));
        if (sBal < SUSDC_AMOUNT) revert InsufficientSUsdcBalance(SUSDC_AMOUNT, sBal);

        lastClaimedAt[msg.sender] = block.timestamp;
        ccm.mint(msg.sender, CCM_AMOUNT);
        // ERC20 transfer — sandbox sUSDC always returns true; if it didn't,
        // we'd want SafeERC20. Sandbox-only, kept minimal.
        require(sUSDC.transfer(msg.sender, SUSDC_AMOUNT), "StarterPack: sUSDC xfer failed");
        emit StarterPackClaimed(msg.sender, CCM_AMOUNT, SUSDC_AMOUNT);
    }

    /// @notice Seconds remaining until `user` can claim again. 0 if ready.
    function cooldownRemaining(address user) external view returns (uint256) {
        uint256 last = lastClaimedAt[user];
        if (last == 0) return 0;
        uint256 next = last + COOLDOWN;
        if (block.timestamp >= next) return 0;
        return next - block.timestamp;
    }

    /// @notice Owner can drain sUSDC back (e.g., rotate to a v2 starter pack).
    function withdrawSUsdc(address to, uint256 amount) external onlyOwner {
        require(sUSDC.transfer(to, amount), "StarterPack: withdraw failed");
        emit sUSDCWithdrawn(to, amount);
    }
}
