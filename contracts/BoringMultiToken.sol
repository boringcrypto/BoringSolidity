// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./libraries/BoringAddress.sol";
import "./libraries/BoringMath.sol";
import "./interfaces/IERC1155TokenReceiver.sol";

// solhint-disable avoid-low-level-calls

abstract contract BoringMultipleToken {
    using BoringAddress for address;
    using BoringMath for uint256;

    event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);
    event URI(string _value, uint256 indexed _id);

    // mappings
    mapping(address => mapping(address => bool)) public OperatorIsApprovedForAll; // map of operator approval
    mapping(address => mapping(uint256 => uint256)) public balances; // map of tokens owned by

    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // EIP-165
            interfaceID == 0xd9b67a26; // ERC-165
    }

    function balanceOf(address _owner, uint256 _id) external view returns (uint256) {
        require(_owner != address(0), "No 0 owner");
        return balances[_owner][_id];
    }

    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids) external view returns (uint256[] memory) {
        require(_owners.length == _ids.length);

        uint256[] memory ownersAccount = new uint256[](_owners.length);

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            uint256 id = _ids[i];
            ownersAccount[i] = balances[owner][id];
        }

        return ownersAccount;
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external {
        require(_to != address(0), "No 0 address");
        require(_from == msg.sender || OperatorIsApprovedForAll[_from][msg.sender] == true, "Transfer not allowed");

        balances[_from][_id] = balances[_from][_id].sub(_value);
        balances[_to][_id] = _value.add(balances[_to][_id]);

        emit TransferSingle(msg.sender, _from, _to, _id, _value);

        if (_to.isContract()) {
            require(
                IERC1155TokenReceiver(_to).onERC1155Received(msg.sender, _from, _id, _value, _data) ==
                    bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")),
                "Wrong return value"
            );
        }
    }

    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external {
        require(_to != address(0), "No 0 address");
        require(_ids.length == _values.length);
        require(_from == msg.sender || OperatorIsApprovedForAll[_from][msg.sender] == true, "Transfer not allowed");

        for (uint256 i = 0; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            balances[_from][id] = balances[_from][id].sub(value);
            balances[_to][id] = value.add(balances[_to][id]);
        }

        emit TransferBatch(msg.sender, _from, _to, _ids, _values);

        if (_to.isContract()) {
            require(
                IERC1155TokenReceiver(_to).onERC1155BatchReceived(msg.sender, _from, _ids, _values, _data) ==
                    bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)")),
                "Wrong return value"
            );
        }
    }

    function setApprovalForAll(address _operator, bool _approved) external {
        OperatorIsApprovedForAll[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function isApprovedForAll(address _owner, address _operator) external view returns (bool) {
        return OperatorIsApprovedForAll[_owner][_operator];
    }
}
