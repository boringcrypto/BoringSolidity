// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "../BoringSingleNFT.sol";

contract MockSingleNFT is BoringSingleNFT {
    function _tokenURI() internal pure override returns (string memory) {
        return "";
    }
}
