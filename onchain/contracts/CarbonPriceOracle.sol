// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CarbonPriceOracle
 * @notice On-chain reference price for voluntary carbon credits, in USD
 *         per tonne CO2e (18-decimal fixed). Updated by a keeper bot
 *         (Cloudflare Worker) from off-chain market data sources.
 *
 * @dev Implements the IPriceSource interface expected by CCMStaking
 *      (`getPrice() returns (uint256)`). Deployable on Base mainnet (8453)
 *      and Base Sepolia (84532). No chain guard.
 *
 * Roles:
 *   - DEFAULT_ADMIN_ROLE  manages KEEPER_ROLE and tunes the change cap
 *                          (= Timelock on mainnet; same on testnet)
 *   - KEEPER_ROLE         calls updatePrice() — hot path, no delay
 *                          (= Worker hot wallet)
 *
 * Sanity bounds:
 *   - price must be > 0
 *   - between-update change must stay within ±maxChangeBps (default 50%)
 *   - admin can adjust the cap; passing maxChangeBps = 10000 disables it
 */
contract CarbonPriceOracle is AccessControl {
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    /// @notice Current carbon credit reference price, 18-decimal (USD/tonne).
    uint256 public price;

    /// @notice Unix timestamp of the last update.
    uint64 public lastUpdatedAt;

    /// @notice Source label of the last update (e.g., "toucan-bct").
    string public sourceLabel;

    /// @notice Maximum allowed change between updates, in bps. Default 5000 (50%).
    uint16 public maxChangeBps;

    event PriceUpdated(
        uint256 oldPrice,
        uint256 newPrice,
        string source,
        address indexed updater,
        uint64 timestamp
    );
    event MaxChangeBpsUpdated(uint16 oldBps, uint16 newBps);

    error PriceZero();
    error PriceChangeTooLarge(uint256 oldPrice, uint256 newPrice, uint16 maxChangeBps);
    error InvalidBps();

    constructor(address admin, address keeper, uint256 initialPrice, string memory initialSource) {
        require(admin != address(0) && keeper != address(0), "Oracle: zero addr");
        if (initialPrice == 0) revert PriceZero();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KEEPER_ROLE, keeper);
        price = initialPrice;
        sourceLabel = initialSource;
        lastUpdatedAt = uint64(block.timestamp);
        maxChangeBps = 5000;
        emit PriceUpdated(0, initialPrice, initialSource, msg.sender, uint64(block.timestamp));
    }

    /// @notice Push a new price. Only KEEPER_ROLE.
    function updatePrice(uint256 newPrice, string calldata source) external onlyRole(KEEPER_ROLE) {
        if (newPrice == 0) revert PriceZero();
        uint256 old = price;
        uint16 capBps = maxChangeBps;
        if (capBps < 10000) {
            uint256 maxDelta = (old * capBps) / 10000;
            // bounds: [old - maxDelta, old + maxDelta]
            if (newPrice + maxDelta < old || newPrice > old + maxDelta) {
                revert PriceChangeTooLarge(old, newPrice, capBps);
            }
        }
        price = newPrice;
        sourceLabel = source;
        lastUpdatedAt = uint64(block.timestamp);
        emit PriceUpdated(old, newPrice, source, msg.sender, uint64(block.timestamp));
    }

    /// @notice Admin tunes the change cap. Passing 10000 disables the cap.
    function setMaxChangeBps(uint16 newBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newBps > 10000) revert InvalidBps();
        uint16 old = maxChangeBps;
        maxChangeBps = newBps;
        emit MaxChangeBpsUpdated(old, newBps);
    }

    /// @notice IPriceSource interface.
    function getPrice() external view returns (uint256) {
        return price;
    }

    /// @notice Seconds since last update.
    function staleness() external view returns (uint256) {
        return block.timestamp - lastUpdatedAt;
    }
}
