// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import "./BoringMultipleNFT.sol";
import "./BoringOwnable.sol";
import "./libraries/Base64.sol";
import "./interfaces/IBoringGenerativeNFT.sol";

contract BoringGenerativeNFT is IBoringGenerativeNFT, BoringMultipleNFT, BoringOwnable {
    using Base64 for bytes;

    GeneInfo[] private _traits;
    function traits(uint256 index) external view override returns (GeneInfo memory trait) {
        return _traits[index];
    }

    constructor(string memory name, string memory symbol) public BoringMultipleNFT(name, symbol) {
        this; // Hide empty code block warning
    }

    function traitsCount() public view override returns (uint256 count) {
        count = _traits.length;
    }

    function addTrait(string calldata name, ITrait trait) public override onlyOwner {
        require(_traits.length < 9, "Traits full");
        _traits.push(GeneInfo(trait, name));
    }

    function addTraitData(uint8 trait, bytes calldata data) public onlyOwner {
        // Return value is checked to ensure only real Traits contracts are called
        require(
            _traits[trait].trait.addData(trait, data) == bytes4(
                keccak256("addData(IBoringGenerativeNFT nft, uint8 trait, bytes calldata data)")
            ), "Bad return");
    }

    function _tokenURI(uint256 tokenId) internal view override returns (string memory) {
        TraitsData memory genes = _tokens[tokenId].data;
        uint256 traitCount = _traits.length;
        return abi.encodePacked(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" xml:space=\"preserve\" viewBox=\"0 0 120.7 103.2\">",
            traitCount > 0 ? _traits[0].trait.render(this, tokenId, 0, genes.trait0) : "",
            traitCount > 1 ? _traits[1].trait.render(this, tokenId, 1, genes.trait1) : "",
            traitCount > 2 ? _traits[2].trait.render(this, tokenId, 2, genes.trait2) : "",
            traitCount > 3 ? _traits[3].trait.render(this, tokenId, 3, genes.trait3) : "",
            traitCount > 4 ? _traits[4].trait.render(this, tokenId, 4, genes.trait4) : "",
            traitCount > 5 ? _traits[5].trait.render(this, tokenId, 5, genes.trait5) : "",
            traitCount > 6 ? _traits[6].trait.render(this, tokenId, 6, genes.trait6) : "",
            traitCount > 7 ? _traits[7].trait.render(this, tokenId, 7, genes.trait7) : "",
            traitCount > 8 ? _traits[8].trait.render(this, tokenId, 8, genes.trait8) : "",
            "</svg>"
        ).encode();
    }

    function mint(TraitsData calldata genes, address to) public override onlyOwner {
        _mint(to, genes);
    }

    function batchMint(TraitsData[] calldata genes, address[] calldata to) public override onlyOwner {
        uint256 len = genes.length;
        require(len == to.length, "Length mismatch");
        for(uint256 i=0; i < len; i++) {
            _mint(to[i], genes[i]);
        }
    }
}
