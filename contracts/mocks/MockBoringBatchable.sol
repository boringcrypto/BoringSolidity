// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "../BoringBatchable.sol";
import "./MockERC20.sol";

// solhint-disable no-empty-blocks

contract MockBoringBatchable is MockERC20(10000), BoringBatchable {

}
