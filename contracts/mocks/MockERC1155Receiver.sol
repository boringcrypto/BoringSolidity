// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "../interfaces/IERC1155TokenReceiver.sol";
import "../ERC1155.sol";

contract MockERC1155Receiver is IERC1155TokenReceiver {
    address public sender;
    address public operator;
    address public from;
    uint256 public id;
    uint256 public value;
    uint256[] public ids; 
    uint256[] public values;
    bytes public data; // don't think it should be same arg for onERC1155Received and onERC1155BatchReceived for this mock contract 

    function onERC1155Received(
        address _operator,
        address _from,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) external override returns (bytes4) {
        sender = msg.sender;
        operator = _operator;
        from = _from;
        id = _id;
        value = _value;
        data = _data;

        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

    function returnSingleToken() external {
        ERC1155(sender).safeTransferFrom(address(this), from, id, value, data);
    }


      function onERC1155BatchReceived(
        address _operator,
        address _from,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) external override returns (bytes4) {
        sender = msg.sender;
        operator = _operator;
        from = _from;
        ids = _ids;
        values = _values;
        data = _data;

        return bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"));
    }

    function returnBatchToken() external {
        ERC1155(sender).safeBatchTransferFrom(address(this), from, ids, values, data);
    }
}