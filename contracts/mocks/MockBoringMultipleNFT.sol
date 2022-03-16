// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../BoringMultipleNFT.sol";

contract MockBoringMultipleNFT is BoringMultipleNFT {
    constructor() BoringMultipleNFT("Mock", "MK") {
        this; // Hide empty code block warning
    }

    function _tokenURI(uint256) internal pure override returns (string memory) {
        return "";
    }

    function mint(address owner) public {
        _mint(owner, TraitsData(0, 0, 0, 0, 0, 0, 0, 0, 0));
    }
}
