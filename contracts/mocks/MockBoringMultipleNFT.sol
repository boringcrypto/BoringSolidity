// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "../BoringMultipleNFT.sol";

contract MockBoringMultipleNFT is BoringMultipleNFT {
    constructor() public BoringMultipleNFT("Mock", "MK") { 
        this; // Hide empty code block warning
    }

    function _tokenURI(uint256) internal view override returns (string memory) {
        return "";
    }

    function mint(address owner) public {
        _mint(owner, TraitsData(0, 0, 0, 0, 0, 0, 0, 0, 0));
    }
}
