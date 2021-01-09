// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;
import "./BoringMath.sol";

struct Rebase {
    uint128 amount;
    uint128 share;
}

library RebaseLibrary {
    using BoringMath for uint256;

    function toShare(Rebase memory total, uint256 amount) internal pure returns (uint256 share) {
        share = total.amount == 0 ? amount : amount.mul(total.share) / total.amount;
    }

    function toAmount(Rebase memory total, uint256 share) internal pure returns (uint256 amount) {
        amount = total.share == 0 ? share : share.mul(total.amount) / total.share;
    }
}