// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../libraries/BoringRebase.sol";

contract MockBoringRebase {
    using RebaseLibrary for Rebase;
    Rebase public total;

    function set(uint128 elastic, uint128 base) public {
        total.elastic = elastic;
        total.base = base;
    }

    function toBase(uint256 elastic, bool roundUp) public view returns (uint256 base) {
        base = total.toBase(elastic, roundUp);
    }

    function toElastic(uint256 base, bool roundUp) public view returns (uint256 elastic) {
        elastic = total.toElastic(base, roundUp);
    }

    function add(uint256 elastic, bool roundUp) public returns (uint256 base) {
        (total, base) = total.add(elastic, roundUp);
    }

    function sub(uint256 base, bool roundUp) public returns (uint256 elastic) {
        (total, elastic) = total.sub(base, roundUp);
    }

    function add2(uint256 base, uint256 elastic) public {
        total = total.add(base, elastic);
    }

    function sub2(uint256 base, uint256 elastic) public {
        total = total.sub(base, elastic);
    }

    function addElastic(uint256 elastic) public returns (uint256 newElastic) {
        newElastic = total.addElastic(elastic);
        require(newElastic == 150, "MockBoringRebase: test failed");
    }

    function subElastic(uint256 elastic) public returns (uint256 newElastic) {
        newElastic = total.subElastic(elastic);
        require(newElastic == 110, "MockBoringRebase: test failed");
    }
}
