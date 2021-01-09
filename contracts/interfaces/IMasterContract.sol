// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IMasterContract {
    function init(bytes calldata data) external payable;
}