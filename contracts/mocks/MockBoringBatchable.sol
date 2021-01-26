// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;
// solhint-disable no-empty-blocks

import "../BoringBatchable.sol";
import "./MockERC20.sol";

contract MockBoringBatchable is MockERC20(10000), BoringBatchable {}
