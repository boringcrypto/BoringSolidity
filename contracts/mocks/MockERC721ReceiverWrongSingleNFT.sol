// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "../interfaces/IERC721TokenWrongReceiver.sol";
import "../BoringSingleNFT.sol";

contract MockERC721ReceiverWrongSingleNFT is IERC721TokenWrongReceiver {
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
    ) external override returns (bytes8) {
        sender = msg.sender;
        operator = _operator;
        from = _from;
        tokenId = _tokenId;
        data = _data;

        return bytes8(keccak256(""));
    }

    function returnToken() external {
        BoringSingleNFT(sender).transferFrom(address(this), from, tokenId);
    }
}
