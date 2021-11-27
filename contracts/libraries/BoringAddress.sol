// SPDX-License-Identifier: MIT

//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

// solhint-disable no-inline-assembly

library BoringAddress {
    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
}
