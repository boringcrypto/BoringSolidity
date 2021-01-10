// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
import "../libraries/BoringMath.sol";
import "../libraries/BoringRebase.sol";

contract MockBoringRebase {
    using BoringMath for uint256;
    using RebaseLibrary for Rebase;
    Rebase public total;

    function set(uint256 amount, uint256 share) public {
        total.amount = amount.to128();
        total.share = share.to128();
    }

    function toShare(uint256 amount) public view returns (uint256 share) {
        share = total.toShare(amount);
    }

    function toAmount(uint256 share) public view returns (uint256 amount) {
        amount = total.toAmount(share);
    }
}
