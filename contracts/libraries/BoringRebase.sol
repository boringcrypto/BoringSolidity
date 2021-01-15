// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "./BoringMath.sol";

struct Rebase {
    uint128 elastic;
    uint128 base;
}

library RebaseLibrary {
    using BoringMath for uint256;
    using BoringMath128 for uint128;

    function toBase(Rebase memory total, uint256 elastic) internal pure returns (uint256 base) {
        base = total.elastic == 0 ? elastic : elastic.mul(total.base) / total.elastic;
    }

    function toElastic(Rebase memory total, uint256 base) internal pure returns (uint256 elastic) {
        elastic = total.base == 0 ? base : base.mul(total.elastic) / total.base;
    }

    function add(Rebase memory total, uint256 elastic) internal pure returns (Rebase memory, uint256 base) {
        base = total.elastic == 0 ? elastic : elastic.mul(total.base) / total.elastic;
        total.elastic = total.elastic.add(elastic.to128());
        total.base = total.base.add(base.to128());
        return (total, base);
    }

    function sub(Rebase memory total, uint256 base) internal pure returns (Rebase memory, uint256 elastic) {
        elastic = total.base == 0 ? base : base.mul(total.elastic) / total.base;
        total.elastic = total.elastic.sub(elastic.to128());
        total.base = total.base.sub(base.to128());
        return (total, elastic);
    }

    function addElastic(Rebase storage total, uint256 elastic) internal returns(uint256 newElastic) {
        newElastic = total.elastic = total.elastic.add(elastic.to128());
    }
}