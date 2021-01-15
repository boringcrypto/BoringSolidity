// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "../libraries/BoringMath.sol";
import "../libraries/BoringRebase.sol";

contract MockBoringRebase {
    using BoringMath for uint256;
    using RebaseLibrary for Rebase;
    Rebase public total;

    function set(uint256 elastic, uint256 base) public {
        total.elastic = elastic.to128();
        total.base = base.to128();
    }

    function toBase(uint256 elastic) public view returns (uint256 base) {
        base = total.toBase(elastic);
    }

    function toElastic(uint256 base) public view returns (uint256 elastic) {
        elastic = total.toElastic(base);
    }

    function add(uint256 elastic) public returns (uint256 base) {
        (total, base) = total.add(elastic);
    }

    function sub(uint256 base) public returns (uint256 elastic) {
        (total, elastic) = total.sub(base);
    }

    function addElastic(uint256 elastic) public returns (uint256 newElastic) {
        newElastic = total.addElastic(elastic);
        require(newElastic == 150, "MockBoringRebase: test failed");
    }

}
