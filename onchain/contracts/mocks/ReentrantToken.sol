// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IStakingTarget {
    function stake(uint256 amount) external;
    function claim() external;
}

/**
 * @title ReentrantToken
 * @notice Test-only ERC20 that re-enters a target contract on every transferFrom.
 *         Used to verify nonReentrant guards on staking-style contracts.
 */
contract ReentrantToken is ERC20 {
    IStakingTarget public target;
    bool public attackEnabled;
    uint8 public attackMode; // 0 = stake, 1 = claim

    constructor() ERC20("Reentrant Token", "RT") {}

    function setTarget(address t) external { target = IStakingTarget(t); }
    function setAttack(bool enabled, uint8 mode) external {
        attackEnabled = enabled;
        attackMode = mode;
    }
    function mint(address to, uint256 amount) external { _mint(to, amount); }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        bool ok = super.transferFrom(from, to, amount);
        if (attackEnabled && address(target) != address(0)) {
            // attempt re-entry — should be blocked by nonReentrant
            if (attackMode == 0) target.stake(amount);
            else target.claim();
        }
        return ok;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        bool ok = super.transfer(to, amount);
        if (attackEnabled && address(target) != address(0)) {
            if (attackMode == 0) target.stake(amount);
            else target.claim();
        }
        return ok;
    }
}
