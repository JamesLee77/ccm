// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IPriceSource {
    function getPrice() external view returns (uint256);
}

/**
 * @title CCMSandboxMedianAggregator
 * @notice Read-only median-of-4 aggregator over four IPriceSource oracles.
 *         Used by testnet.ccmnetwork.net visualization to show price
 *         consensus across multiple oracle sources.
 *
 * @dev Sandbox-only — display only. The CCMSandboxStaking contract retains
 *      its own single-oracle binding for yield decay math. This aggregator
 *      is NOT plugged into staking; it exists to feed the OracleConsensusPanel.
 *      Refuses deployment on Base mainnet (chainId 8453).
 */
contract CCMSandboxMedianAggregator {
    IPriceSource[4] public sources;

    constructor(address a, address b, address c, address d) {
        require(block.chainid != 8453, "Aggregator: refuses mainnet");
        require(a != address(0) && b != address(0) && c != address(0) && d != address(0), "Aggregator: zero source");
        sources[0] = IPriceSource(a);
        sources[1] = IPriceSource(b);
        sources[2] = IPriceSource(c);
        sources[3] = IPriceSource(d);
    }

    function sourcePrices() public view returns (uint256[4] memory out) {
        out[0] = sources[0].getPrice();
        out[1] = sources[1].getPrice();
        out[2] = sources[2].getPrice();
        out[3] = sources[3].getPrice();
    }

    /// @notice Median of 4 = average of the 2 middle values after sort.
    function getPrice() external view returns (uint256) {
        uint256[4] memory p = sourcePrices();
        // bubble sort 4 elements
        for (uint256 i = 0; i < 3; i++) {
            for (uint256 j = 0; j < 3 - i; j++) {
                if (p[j] > p[j + 1]) {
                    uint256 tmp = p[j];
                    p[j] = p[j + 1];
                    p[j + 1] = tmp;
                }
            }
        }
        // average of the two middle values, rounded half-up via (a + b + 1) / 2
        // But to avoid changing semantics, use plain (a + b) / 2.
        return (p[1] + p[2]) / 2;
    }

    function name() external pure returns (string memory) {
        return "median-of-4";
    }
}
