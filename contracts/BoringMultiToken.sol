// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./libraries/BoringAddress.sol";
import "./libraries/BoringMath.sol";
import "./interfaces/IERC1155.sol";
import "./interfaces/IERC1155TokenReceiver.sol";

abstract contract BoringMultipleToken is IERC1155 {
    using BoringAddress for address;
    using BoringMath for uint256;

    event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value);
    event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);
    event URI(string _value, uint256 indexed _id);

    // mappings
    mapping(address => mapping(address => bool)) public override isApprovedForAll; // map of operator approval
    mapping(address => mapping(uint256 => uint256)) public override balanceOf; // map of tokens owned by

    function supportsInterface(bytes4 interfaceID) external view override returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // EIP-165
            interfaceID == 0xd9b67a26; // ERC-1155
    }

    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids)
        external
        view
        override
        returns (uint256[] memory ownersAccount)
    {
        uint256 len = _owners.length;
        require(len == _ids.length, "ERC1155: Length mismatch");

        ownersAccount = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            ownersAccount[i] = balanceOf[_owners[i]][_ids[i]];
        }
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external override {
        require(_to != address(0), "No 0 address");
        require(_from == msg.sender || isApprovedForAll[_from][msg.sender] == true, "Transfer not allowed");

        balanceOf[_from][_id] = balanceOf[_from][_id].sub(_value);
        balanceOf[_to][_id] = _value.add(balanceOf[_to][_id]);

        if (_to.isContract()) {
            require(
                IERC1155TokenReceiver(_to).onERC1155Received(msg.sender, _from, _id, _value, _data) ==
                    bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")),
                "Wrong return value"
            );
        }

        emit TransferSingle(msg.sender, _from, _to, _id, _value);
    }

    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external override {
        require(_to != address(0), "No 0 address");
        require(_ids.length == _values.length, "ERC1155: Length mismatch");
        require(_from == msg.sender || isApprovedForAll[_from][msg.sender] == true, "Transfer not allowed");

        for (uint256 i = 0; i < _ids.length; i++) {
            uint256 id = _ids[i];
            uint256 value = _values[i];
            balanceOf[_from][id] = balanceOf[_from][id].sub(value);
            balanceOf[_to][id] = value.add(balanceOf[_to][id]);
        }

        if (_to.isContract()) {
            require(
                IERC1155TokenReceiver(_to).onERC1155BatchReceived(msg.sender, _from, _ids, _values, _data) ==
                    bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)")),
                "Wrong return value"
            );
        }

        emit TransferBatch(msg.sender, _from, _to, _ids, _values);
    }

    function setApprovalForAll(address _operator, bool _approved) external override {
        isApprovedForAll[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }
}
