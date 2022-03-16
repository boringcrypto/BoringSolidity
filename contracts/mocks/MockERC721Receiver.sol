// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interfaces/IERC721TokenReceiver.sol";
import "../BoringMultipleNFT.sol";

contract MockERC721Receiver is IERC721TokenReceiver {
    address public sender;
    address public operator;
    address public from;
    uint256 public tokenId;
    bytes public data;

    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external override returns (bytes4) {
        sender = msg.sender;
        operator = _operator;
        from = _from;
        tokenId = _tokenId;
        data = _data;

        return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
    }

    function returnToken() external {
        BoringMultipleNFT(sender).transferFrom(address(this), from, tokenId);
    }
}
