// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
import "./interfaces/ITrait.sol";

contract FixedTrait is ITrait {
    string public override name;
    constructor(string memory name_) public {
        name = name_;
    }

    struct Option {
        string name;
        string svg;
    }

    Option[] public options;

    function add(Option memory option) public {
        options.push(option);
    }

    function render(uint8 trait) external view override returns (string memory output) {
        return options[trait].svg;
    }
}

