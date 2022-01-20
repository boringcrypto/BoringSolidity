// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IERC721TokenWrongReceiver {
    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external returns (bytes8);
}
