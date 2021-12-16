// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "../BoringMultipleNFT.sol";

contract MockBoringMultipleNFT is BoringMultipleNFT {
    function _tokenURI(uint256 tokenId) internal view override returns (string memory) {
        return "";
    }

    function mint(address owner) public {
        _mint(owner, 0);
    }
}
