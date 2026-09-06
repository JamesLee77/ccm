// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title RevertingOracle
 * @notice Test-only IPriceOracle whose `getPrice()` can be switched to revert,
 *         simulating a bricked / self-destructed / misconfigured oracle.
 *         Used to prove staking withdrawals survive oracle failure.
 */
contract RevertingOracle {
    uint256 public price;
    bool public broken;

    constructor(uint256 initialPrice) {
        price = initialPrice;
    }

    function setBroken(bool b) external {
        broken = b;
    }

    function getPrice() external view returns (uint256) {
        require(!broken, "RevertingOracle: down");
        return price;
    }
}
