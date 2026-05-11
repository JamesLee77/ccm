// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockPriceOracle
 * @notice Test-only IPriceOracle implementation. Allows arbitrary price setting
 *         to verify CCMStaking yield decay across price scenarios.
 *
 * @dev DO NOT use in production. For mainnet use Chainlink AggregatorV3 wrapper
 *      or a multisig-controlled custom oracle with TWAP.
 */
contract MockPriceOracle {
    uint256 public price;
    address public owner;

    event PriceUpdated(uint256 oldPrice, uint256 newPrice);

    constructor(uint256 initialPrice) {
        price = initialPrice;
        owner = msg.sender;
    }

    function setPrice(uint256 newPrice) external {
        require(msg.sender == owner, "MockOracle: not owner");
        emit PriceUpdated(price, newPrice);
        price = newPrice;
    }

    function getPrice() external view returns (uint256) {
        return price;
    }
}
