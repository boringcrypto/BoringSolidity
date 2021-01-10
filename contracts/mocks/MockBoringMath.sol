// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "../libraries/BoringMath.sol";

contract MockBoringMath {
    using BoringMath for uint256;
    using BoringMath128 for uint128;

    function add(uint256 a, uint256 b) public pure returns (uint256 c) {
        c = a.add(b);
    }

    function sub(uint256 a, uint256 b) public pure returns (uint256 c) {
        c = a.sub(b);
    }

    function mul(uint256 a, uint256 b) public pure returns (uint256 c) {
        c = a.mul(b);
    }

    function to128(uint256 a) public pure returns (uint128 c) {
        c = a.to128();
    }

    function add128(uint128 a, uint128 b) public pure returns (uint128 c) {
        c = a.add(b);
    }

    function sub128(uint128 a, uint128 b) public pure returns (uint128 c) {
        c = a.sub(b);
    }
}
