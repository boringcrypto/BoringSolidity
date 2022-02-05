// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import "./interfaces/IBoringGenerativeNFT.sol";

contract FixedTrait is ITrait {
    struct Option {
        string name;
        string svg;
    }

    mapping(IBoringGenerativeNFT => mapping(uint8 => Option[])) public options;

    function addData(uint8 trait, bytes calldata data) external override returns (bytes4) {
        Option memory option = abi.decode(data, (Option));
        options[IBoringGenerativeNFT(msg.sender)][trait].push(option);

        return bytes4(keccak256("addData(IBoringGenerativeNFT nft, uint8 trait, bytes calldata data)"));
    }

    function render(IBoringGenerativeNFT nft, uint256, uint8 trait, uint8 gene) external view override returns (string memory output) {
        return options[nft][trait][gene].svg;
    }
}

