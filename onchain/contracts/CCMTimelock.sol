// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * CCMTimelock — thin wrapper around OZ TimelockController that locks in
 * the protocol-policy 48h minimum delay on construction.
 *
 *  - Mainnet & Base Sepolia rehearsal both reject any minDelay below 48h.
 *  - A separate explicit "smoke" branch is allowed on local Hardhat
 *    (chainId 31337 / 1337) so unit tests can exercise the schedule/execute
 *    flow within reasonable wall-clock time.
 *
 * Wiring (mainnet):
 *  - proposers: [Gnosis Safe 3-of-5]
 *  - executors: [Gnosis Safe 3-of-5]   (or address(0) to permit anyone)
 *  - admin    : address(0)             (timelock self-administers; recommended)
 *
 * After deploy, every privileged contract (CCMToken, CCMVesting, …) must:
 *   1) grant DEFAULT_ADMIN_ROLE / PAUSER_ROLE to this timelock,
 *   2) deployer renounces those same roles.
 * From then on, all admin actions must be scheduled through the multisig
 * and execute only after MIN_DELAY has elapsed.
 */
contract CCMTimelock is TimelockController {
    /// 48 hours — protocol policy floor for any state-changing admin op.
    uint256 public constant MIN_DELAY = 48 hours;

    string public constant VERSION = "1.0.0";

    error CCMTimelock_DelayTooShort(uint256 provided, uint256 required);

    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {
        // Allow short delays only on local chains (Hardhat default 31337,
        // Ganache 1337). On Base Sepolia (84532) and mainnet (8453) the
        // 48h floor is mandatory.
        uint256 cid = block.chainid;
        if (cid != 31337 && cid != 1337) {
            if (minDelay < MIN_DELAY) {
                revert CCMTimelock_DelayTooShort(minDelay, MIN_DELAY);
            }
        }
    }
}
