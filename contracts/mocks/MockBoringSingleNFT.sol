// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import "../BoringSingleNFT.sol";

contract MockBoringSingleNFT is BoringSingleNFT {
    constructor() {
        hodler = msg.sender;
    }

    function _tokenURI() internal pure override returns (string memory) {
        return "";
    }
}
