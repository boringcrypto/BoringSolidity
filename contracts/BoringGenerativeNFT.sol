// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import "./BoringMultipleNFT.sol";
import "./BoringOwnable.sol";
import "./libraries/Base64.sol";
import "./interfaces/ITrait.sol";

contract BoringGenerativeNFT is BoringMultipleNFT, BoringOwnable {
    using Base64 for bytes;

    ITrait[] public traits;

    constructor(string memory name, string memory symbol) public BoringMultipleNFT(name, symbol) {
        this; // Hide empty code block warning
    }

    function traitsCount() public view returns (uint256 count) {
        count = traits.length;
    }

    function addTrait(ITrait trait) public onlyOwner {
        require(traits.length < 9, "Traits full");
        traits.push(trait);
    }

    function _tokenURI(uint256 tokenId) internal view override returns (string memory) {
        TraitsData memory genes = _tokens[tokenId].data;
        uint256 traitCount = traits.length;
        return abi.encodePacked(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" viewBox=\"0 0 120.7 103.2\">",
            traitCount > 0 ? traits[0].render(genes.trait0) : "",
            traitCount > 1 ? traits[1].render(genes.trait1) : "",
            traitCount > 2 ? traits[2].render(genes.trait2) : "",
            traitCount > 3 ? traits[3].render(genes.trait3) : "",
            traitCount > 4 ? traits[4].render(genes.trait4) : "",
            traitCount > 5 ? traits[5].render(genes.trait5) : "",
            traitCount > 6 ? traits[6].render(genes.trait6) : "",
            traitCount > 7 ? traits[7].render(genes.trait7) : "",
            traitCount > 8 ? traits[8].render(genes.trait8) : "",
            "</svg>"
        ).encode();
    }

    function mint(TraitsData calldata genes, address to) public onlyOwner {
        _mint(to, genes);
    }

    function batchMint(TraitsData[] calldata genes, address[] calldata to) public onlyOwner {
        uint256 len = genes.length;
        require(len == to.length, "Length mismatch");
        for(uint256 i=0; i < len; i++) {
            _mint(to[i], genes[i]);
        }
    }
}
