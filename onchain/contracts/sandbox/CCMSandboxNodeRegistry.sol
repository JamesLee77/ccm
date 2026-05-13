// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title CCMSandboxNodeRegistry
 * @notice Open-registration registry of CCMine nodes for the testnet
 *         visualization layer. Anyone can register their address as a
 *         node (label + optional endpoint URL). Re-registration from the
 *         same address updates in place; unregistration marks the node
 *         inactive but preserves the history slot.
 *
 * @dev Sandbox-only. No access control, no fee. Designed purely to feed
 *      live counters and recent-nodes visualization on testnet.ccmnetwork.net.
 *      Refuses deployment on Base mainnet (chainId 8453).
 */
contract CCMSandboxNodeRegistry {
    struct Node {
        address owner;
        string label;
        string endpoint;
        uint64 registeredAt;
        bool active;
    }

    Node[] private _nodes;
    // owner => nodes[] index + 1 (0 means not registered)
    mapping(address => uint256) public ownerIndex;
    // Count of currently active nodes
    uint256 private _activeCount;

    event NodeRegistered(
        address indexed owner,
        uint256 indexed nodeId,
        string label,
        string endpoint
    );
    event NodeUpdated(
        address indexed owner,
        uint256 indexed nodeId,
        string label,
        string endpoint
    );
    event NodeUnregistered(address indexed owner, uint256 indexed nodeId);

    constructor() {
        require(block.chainid != 8453, "Registry: refuses mainnet");
    }

    function register(string calldata label, string calldata endpoint)
        external
        returns (uint256 nodeId)
    {
        require(bytes(label).length > 0, "Registry: label required");
        require(bytes(label).length <= 64, "Registry: label too long");
        require(bytes(endpoint).length <= 128, "Registry: endpoint too long");

        uint256 idxPlus1 = ownerIndex[msg.sender];
        if (idxPlus1 == 0) {
            _nodes.push(Node({
                owner: msg.sender,
                label: label,
                endpoint: endpoint,
                registeredAt: uint64(block.timestamp),
                active: true
            }));
            nodeId = _nodes.length;
            ownerIndex[msg.sender] = nodeId;
            _activeCount += 1;
            emit NodeRegistered(msg.sender, nodeId, label, endpoint);
        } else {
            nodeId = idxPlus1;
            Node storage n = _nodes[idxPlus1 - 1];
            n.label = label;
            n.endpoint = endpoint;
            if (!n.active) {
                n.active = true;
                _activeCount += 1;
            }
            emit NodeUpdated(msg.sender, nodeId, label, endpoint);
        }
    }

    function update(string calldata label, string calldata endpoint) external {
        uint256 idxPlus1 = ownerIndex[msg.sender];
        require(idxPlus1 != 0, "Registry: not registered");
        require(bytes(label).length > 0, "Registry: label required");
        require(bytes(label).length <= 64, "Registry: label too long");
        require(bytes(endpoint).length <= 128, "Registry: endpoint too long");

        Node storage n = _nodes[idxPlus1 - 1];
        n.label = label;
        n.endpoint = endpoint;
        emit NodeUpdated(msg.sender, idxPlus1, label, endpoint);
    }

    function unregister() external {
        uint256 idxPlus1 = ownerIndex[msg.sender];
        require(idxPlus1 != 0, "Registry: not registered");
        Node storage n = _nodes[idxPlus1 - 1];
        require(n.active, "Registry: already inactive");
        n.active = false;
        _activeCount -= 1;
        emit NodeUnregistered(msg.sender, idxPlus1);
    }

    function count() external view returns (uint256) {
        return _activeCount;
    }

    function totalEver() external view returns (uint256) {
        return _nodes.length;
    }

    function nodeOf(address owner) external view returns (Node memory) {
        uint256 idxPlus1 = ownerIndex[owner];
        if (idxPlus1 == 0) {
            return Node({owner: address(0), label: "", endpoint: "", registeredAt: 0, active: false});
        }
        return _nodes[idxPlus1 - 1];
    }

    /// @notice Returns up to N most recently active nodes in reverse
    ///         chronological order (newest first). Skips inactive nodes.
    function recent(uint256 n) external view returns (Node[] memory) {
        uint256 active = _activeCount;
        uint256 want = n < active ? n : active;
        Node[] memory out = new Node[](want);
        if (want == 0) return out;
        uint256 found = 0;
        uint256 total = _nodes.length;
        for (uint256 i = total; i > 0 && found < want; i--) {
            Node storage node = _nodes[i - 1];
            if (node.active) {
                out[found] = node;
                found += 1;
            }
        }
        return out;
    }
}
