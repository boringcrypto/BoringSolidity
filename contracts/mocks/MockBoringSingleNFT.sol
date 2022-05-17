// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../BoringSingleNFT.sol";

contract MockBoringSingleNFT is BoringSingleNFT {
    constructor() {
        hodler = msg.sender;
    }

    string public override name = "Mock";
    string public override symbol = "MOCK";

    function _tokenURI() internal pure override returns (string memory) {
        return "";
    }
}
