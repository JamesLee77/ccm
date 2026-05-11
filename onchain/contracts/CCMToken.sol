// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CCM Network Token (CCM)
 * @notice Utility token of the CCM Network ecosystem.
 *         Used for carbon mining rewards, DeFi gas, governance, and more.
 *
 * Properties:
 *   - Standard: ERC-20 + Burnable + Capped + Pausable + Permit
 *   - Total supply: 5,000,000,000 (5B) — hard cap
 *   - 18 decimals
 *
 * Roles:
 *   - DEFAULT_ADMIN_ROLE  : grant/revoke other roles (multisig)
 *   - MINTER_ROLE         : mint permission (granted to TGESale, Vesting, Staking)
 *   - PAUSER_ROLE         : emergency pause (multisig only)
 *
 * @dev Utility token under VARA licensing. US persons are blocked at a separate KYC layer.
 */
contract CCMToken is ERC20, ERC20Burnable, ERC20Capped, ERC20Pausable, ERC20Permit, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY = 5_000_000_000 * 10**18; // 5B with 18 decimals

    /// @notice Contract version string. Incremented when deploying a successor.
    string public constant VERSION = "1.0.0";

    event TokensRecovered(address indexed token, address indexed to, uint256 amount);

    constructor(address admin)
        ERC20("CCM Network Token", "CCM")
        ERC20Capped(MAX_SUPPLY)
        ERC20Permit("CCM Network Token")
    {
        require(admin != address(0), "CCM: admin zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /// @notice Mint tokens. Only callable by MINTER_ROLE. Reverts if cap exceeded.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /// @notice Emergency pause of all transfers. Recommended to be controlled by governance (multisig).
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @notice Recover other ERC-20 tokens accidentally sent to this contract (cannot recover self).
    function recoverERC20(address tokenAddr, address to, uint256 amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(tokenAddr != address(this), "CCM: cannot recover self");
        require(to != address(0), "CCM: to zero");
        IERC20(tokenAddr).safeTransfer(to, amount);
        emit TokensRecovered(tokenAddr, to, amount);
    }

    // -------- Required overrides (multiple inheritance) --------

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
