// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./interfaces/IBoringGenerativeNFT.sol";

contract FixedTrait is ITrait {
    struct Option {
        string name;
        string svg;
    }

    mapping(IBoringGenerativeNFT => mapping(uint8 => string)) public names;
    mapping(IBoringGenerativeNFT => mapping(uint8 => Option[])) public options;

    function setName(uint8 trait, string calldata name) external override returns (bytes4) {
        names[IBoringGenerativeNFT(msg.sender)][trait] = name;

        return bytes4(keccak256("setName(uint8,string)"));
    }

    function addData(uint8 trait, bytes calldata data) external override returns (bytes4) {
        Option memory option = abi.decode(data, (Option));
        options[IBoringGenerativeNFT(msg.sender)][trait].push(option);

        return bytes4(keccak256("addData(address,uint8,bytes)"));
    }

    function renderTrait(
        IBoringGenerativeNFT nft,
        uint256,
        uint8 trait,
        uint8 gene
    ) external view override returns (string memory output) {
        return string(abi.encodePacked('{"trait_type":"', names[nft][trait], '","value":"', options[nft][trait][gene].name, '"}'));
    }

    function renderSVG(
        IBoringGenerativeNFT nft,
        uint256,
        uint8 trait,
        uint8 gene
    ) external view override returns (string memory output) {
        return options[nft][trait][gene].svg;
    }
}
