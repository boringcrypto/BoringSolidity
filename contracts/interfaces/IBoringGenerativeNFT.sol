// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import "../BoringMultipleNFT.sol";

struct GeneInfo {
    ITrait trait;
    string name;
}

interface ITrait {
    // Should return bytes4(keccak256("addData(IBoringGenerativeNFT nft, uint8 trait, bytes calldata data)"))
    function addData(uint8 trait, bytes calldata data) external returns (bytes4);
    function render(IBoringGenerativeNFT nft, uint256 tokenId, uint8 trait, uint8 gene) external view returns (string memory output);
}

interface IBoringGenerativeNFT {
    function traits(uint256 index) external view returns (GeneInfo memory trait);
    function traitsCount() external view returns (uint256 count);
    function addTrait(string calldata name, ITrait trait) external;
    function mint(TraitsData calldata genes, address to) external;
    function batchMint(TraitsData[] calldata genes, address[] calldata to) external;
}
