// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../BoringMultipleNFT.sol";

struct GeneInfo {
    ITrait trait;
    string name;
}

interface ITrait {
    // Should return bytes4(keccak256("setName(uint8,string)"))
    function setName(uint8 trait, string calldata name) external returns (bytes4);

    // Should return bytes4(keccak256("addData(address,uint8,bytes)"))
    function addData(uint8 trait, bytes calldata data) external returns (bytes4);

    function renderTrait(
        IBoringGenerativeNFT nft,
        uint256 tokenId,
        uint8 trait,
        uint8 gene
    ) external view returns (string memory output);

    function renderSVG(
        IBoringGenerativeNFT nft,
        uint256 tokenId,
        uint8 trait,
        uint8 gene
    ) external view returns (string memory output);
}

interface IBoringGenerativeNFT {
    function traits(uint256 index) external view returns (ITrait trait);

    function traitsCount() external view returns (uint256 count);

    function addTrait(string calldata name, ITrait trait) external;

    function mint(TraitsData calldata genes, address to) external;

    function batchMint(TraitsData[] calldata genes, address[] calldata to) external;
}
