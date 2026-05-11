// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * CCMKYCRegistry — single source of truth for "has this address passed KYC".
 *
 * Off-chain KYC providers (Sumsub, Persona, etc.) verify identity. Their
 * results are written here by an OPERATOR address (typically the Safe).
 * Other CCM contracts (TGE, staking, lending, …) can read from this
 * registry instead of maintaining their own per-contract whitelist that
 * inevitably drifts out of sync.
 *
 * Role layout:
 *   - DEFAULT_ADMIN_ROLE  : held by CCMTimelock. Manages KYC_OPERATOR_ROLE
 *                           (grant/revoke). Everything admin-y goes through
 *                           the 48 h timelock + multisig.
 *   - KYC_OPERATOR_ROLE   : held by the Safe (no timelock). Flips per-user
 *                           status. Operational, not governance — needs to
 *                           be fast so a user who just passed Sumsub today
 *                           can participate today.
 *
 * The registry is intentionally minimal: a single `isKYCed(addr)` bool.
 * If we later need tiers / expiry / jurisdiction, we deploy a v2 registry
 * and swap consumers over. We do NOT pack speculative metadata in v1.
 *
 * Read pattern for consumers:
 *
 *     ICCMKYCRegistry public immutable kyc;
 *     ...
 *     require(kyc.isKYCed(buyer), "TGE: not KYCed");
 *
 * Sandbox guard: chainId 8453 (Base mainnet) is allowed; this contract is
 * intentionally suitable for mainnet. The sandbox primitives (CCMSandbox*)
 * are the ones that explicitly refuse mainnet.
 */
contract CCMKYCRegistry is AccessControl {
    /// Operator role — held by the Safe, flips KYC status without timelock.
    bytes32 public constant KYC_OPERATOR_ROLE = keccak256("KYC_OPERATOR_ROLE");

    string public constant VERSION = "1.0.0";

    /// True iff `user` has passed off-chain KYC and is approved to interact
    /// with KYC-gated contracts. Defaults to false.
    mapping(address user => bool) public isKYCed;

    /// Wallclock when the user's status was most recently set, in seconds
    /// since the Unix epoch. Used purely for off-chain audit / forensics —
    /// no on-chain logic depends on this.
    mapping(address user => uint64) public kycedAt;

    /// Running count of distinct addresses whose status is currently true.
    /// Useful for ops dashboards; does NOT enforce any cap.
    uint256 public kycedCount;

    event KYCStatusChanged(address indexed user, bool kyced, uint64 timestamp, address indexed operator);

    error KYCRegistry_ZeroAddress();
    error KYCRegistry_LengthMismatch(uint256 users, uint256 oks);
    error KYCRegistry_EmptyBatch();

    constructor(address admin, address operator) {
        if (admin == address(0) || operator == address(0)) revert KYCRegistry_ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KYC_OPERATOR_ROLE, operator);
    }

    /// Set a single user's KYC status. Idempotent: setting the same value
    /// twice still emits an event (operators rely on event stream as audit
    /// log) but does not double-count `kycedCount`.
    function setKYCed(address user, bool ok) external onlyRole(KYC_OPERATOR_ROLE) {
        if (user == address(0)) revert KYCRegistry_ZeroAddress();
        _setKYCed(user, ok);
    }

    /// Set N users to N statuses. Useful for backfill / bulk import from
    /// an off-chain KYC provider's API.
    function setKYCedBatch(address[] calldata users, bool[] calldata oks)
        external
        onlyRole(KYC_OPERATOR_ROLE)
    {
        uint256 n = users.length;
        if (n == 0) revert KYCRegistry_EmptyBatch();
        if (oks.length != n) revert KYCRegistry_LengthMismatch(n, oks.length);
        for (uint256 i; i < n; ) {
            address u = users[i];
            if (u == address(0)) revert KYCRegistry_ZeroAddress();
            _setKYCed(u, oks[i]);
            unchecked { ++i; }
        }
    }

    /// Set N users to a single uniform status. The common case for daily
    /// approvals (all newly-cleared users get `true`).
    function setKYCedBatchUniform(address[] calldata users, bool ok)
        external
        onlyRole(KYC_OPERATOR_ROLE)
    {
        uint256 n = users.length;
        if (n == 0) revert KYCRegistry_EmptyBatch();
        for (uint256 i; i < n; ) {
            address u = users[i];
            if (u == address(0)) revert KYCRegistry_ZeroAddress();
            _setKYCed(u, ok);
            unchecked { ++i; }
        }
    }

    function _setKYCed(address user, bool ok) internal {
        bool prev = isKYCed[user];
        if (prev != ok) {
            isKYCed[user] = ok;
            if (ok) {
                unchecked { ++kycedCount; }
            } else {
                unchecked { --kycedCount; }
            }
        }
        kycedAt[user] = uint64(block.timestamp);
        emit KYCStatusChanged(user, ok, uint64(block.timestamp), msg.sender);
    }
}
