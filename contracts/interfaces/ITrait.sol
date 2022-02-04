// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface ITrait {
    function name() external view returns (string memory name_);
    function render(uint8 trait) external view returns (string memory output);
}
