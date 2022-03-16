// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../ERC20.sol";

contract MockERC20 is ERC20WithSupply {
    constructor(uint256 _initialAmount) {
        // Give the creator all initial tokens
        balanceOf[msg.sender] = _initialAmount;
        // Update total supply
        totalSupply = _initialAmount;
    }
}
