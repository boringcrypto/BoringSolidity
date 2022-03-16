// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./BoringMultipleNFT.sol";
import "./BoringOwnable.sol";
import "./libraries/Base64.sol";
import "./interfaces/IBoringGenerativeNFT.sol";

contract BoringGenerativeNFT is IBoringGenerativeNFT, BoringMultipleNFT, BoringOwnable {
    using Base64 for bytes;

    ITrait[] private _traits;

    function traits(uint256 index) external view override returns (ITrait trait) {
        return _traits[index];
    }

    constructor(string memory name, string memory symbol) BoringMultipleNFT(name, symbol) {
        this; // Hide empty code block warning
    }

    function traitsCount() public view override returns (uint256 count) {
        count = _traits.length;
    }

    function addTrait(string calldata name, ITrait trait) public override onlyOwner {
        uint8 gene = uint8(_traits.length);
        require(_traits.length < 9, "Traits full");
        _traits.push(trait);
        require(_traits[gene].setName(gene, name) == bytes4(keccak256("setName(uint8,string)")), "Bad return");
    }

    function addTraitData(uint8 trait, bytes calldata data) public onlyOwner {
        // Return value is checked to ensure only real Traits contracts are called
        require(_traits[trait].addData(trait, data) == bytes4(keccak256("addData(address,uint8,bytes)")), "Bad return");
    }

    function tokenSVG(uint256 tokenId) public view returns (string memory) {
        TraitsData memory genes = _tokens[tokenId].data;
        uint256 traitCount = _traits.length;

        return
            abi
                .encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 120.7 103.2">',
                traitCount > 0 ? _traits[0].renderSVG(this, tokenId, 0, genes.trait0) : "",
                traitCount > 1 ? _traits[1].renderSVG(this, tokenId, 1, genes.trait1) : "",
                traitCount > 2 ? _traits[2].renderSVG(this, tokenId, 2, genes.trait2) : "",
                traitCount > 3 ? _traits[3].renderSVG(this, tokenId, 3, genes.trait3) : "",
                traitCount > 4 ? _traits[4].renderSVG(this, tokenId, 4, genes.trait4) : "",
                traitCount > 5 ? _traits[5].renderSVG(this, tokenId, 5, genes.trait5) : "",
                traitCount > 6 ? _traits[6].renderSVG(this, tokenId, 6, genes.trait6) : "",
                traitCount > 7 ? _traits[7].renderSVG(this, tokenId, 7, genes.trait7) : "",
                traitCount > 8 ? _traits[8].renderSVG(this, tokenId, 8, genes.trait8) : "",
                "</svg>"
            )
                .encode();
    }

    function _renderTrait(
        uint256 tokenId,
        uint256 traitCount,
        uint8 trait,
        uint8 gene
    ) internal view returns (bytes memory) {
        return abi.encodePacked(traitCount > trait ? _traits[0].renderTrait(this, tokenId, trait, gene) : "", traitCount > trait + 1 ? "," : "");
    }

    function _renderTraits(uint256 tokenId) internal view returns (bytes memory) {
        TraitsData memory genes = _tokens[tokenId].data;
        uint256 traitCount = _traits.length;

        return
            abi.encodePacked(
                _renderTrait(tokenId, traitCount, 0, genes.trait0),
                _renderTrait(tokenId, traitCount, 1, genes.trait1),
                _renderTrait(tokenId, traitCount, 2, genes.trait2),
                _renderTrait(tokenId, traitCount, 3, genes.trait3),
                _renderTrait(tokenId, traitCount, 4, genes.trait4),
                _renderTrait(tokenId, traitCount, 5, genes.trait5),
                _renderTrait(tokenId, traitCount, 6, genes.trait6),
                _renderTrait(tokenId, traitCount, 7, genes.trait7),
                traitCount > 8 ? _traits[8].renderTrait(this, tokenId, 8, genes.trait8) : ""
            );
    }

    function _tokenURI(uint256 tokenId) internal view override returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    abi
                        .encodePacked(
                        '{"image":"data:image/svg+xml;base64,',
                        tokenSVG(tokenId),
                        '","attributes":[',
                        _renderTraits(tokenId),
                        "]}"
                    )
                        .encode()
                )
            );
    }

    function mint(TraitsData calldata genes, address to) public override onlyOwner {
        _mint(to, genes);
    }

    function batchMint(TraitsData[] calldata genes, address[] calldata to) public override onlyOwner {
        uint256 len = genes.length;
        require(len == to.length, "Length mismatch");
        for (uint256 i = 0; i < len; i++) {
            _mint(to[i], genes[i]);
        }
    }
}
