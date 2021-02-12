// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "./interfaces/IMasterContract.sol";

// solhint-disable no-inline-assembly

contract BoringFactory {
    event LogDeploy(address indexed masterContract, bytes data, address indexed cloneAddress);

    /// @notice Mapping from clone contracts to their masterContract.
    mapping(address => address) public masterContractOf;

    /// @notice Deploys a given master Contract as a clone.
    /// Any ETH transferred with this call is forwarded to the new clone.
    /// Emits `LogDeploy`.
    /// @param masterContract The address of the contract to clone.
    /// @param data Additional abi encoded calldata that is passed to the new clone via `IMasterContract.init`.
    /// @param useCreate2 Creates the clone by using the CREATE2 opcode, in this case `data` will be used as salt.
    // XXX: Should it also return the new address of the clone for better composability?
    function deploy(
        address masterContract,
        bytes calldata data,
        bool useCreate2
    ) public payable {
        require(masterContract != address(0), "BoringFactory: No masterContract");
        bytes20 targetBytes = bytes20(masterContract); // Takes the first 20 bytes of the masterContract's address
        address cloneAddress; // Address where the clone contract will reside.
        bytes32 salt;

        if (useCreate2) {
            // each masterContract has different code already. So clones are distinguished by their data only.
            salt = keccak256(data);
        }

        // Creates clone, more info here: https://blog.openzeppelin.com/deep-dive-into-the-minimal-proxy-contract/
        assembly {
            /*
            0:RETURNDATASIZE(0x3d)
            1:PUSH1(0x60)
            2d = 45
            3:DUP1(0x80)
            4:PUSH1(0x60)
            0a = 10
            6:RETURNDATASIZE(0x3d)
            7:CODECOPY(0x39)
            8:DUP2(0x81)
            9:RETURN(0xf3)
            10:CALLDATASIZE(0x36)
            11:RETURNDATASIZE(0x3d)
            12:RETURNDATASIZE(0x3d)
            13:CALLDATACOPY(0x37)
            14:RETURNDATASIZE(0x3d)
            15:RETURNDATASIZE(0x3d)
            16:RETURNDATASIZE(0x3d)
            17:CALLDATASIZE(0x36)
            18:RETURNDATASIZE(0x3d)
            19:PUSH20(0x73)
            <targetBytes>
            40:GAS(0x5a)
            41:DELEGATECALL(0xf4)
            42:RETURNDATASIZE(0x3d)
            43:DUP3(0x82)
            44:DUP1(0x80)
            45:RETURNDATACOPY(0x3e)
            46:SWAP1(0x90)
            47:RETURNDATASIZE(0x3d)
            48:SWAP2(0x91)
            49:PUSH1(0x60)
            2b = 43
            51:JUMPI(0x57)
            52:REVERT(0xfd)
            53:JUMPDEST(0x5b)
            54:RETURN(0xf3)
            */
            mstore(0, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(0x14, targetBytes)
            mstore(0x28, 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)

            switch useCreate2
            case 0 {
                cloneAddress := create(0, 0, 0x37)
            }
            default {
                cloneAddress := create2(0, 0, 0x37, salt)
            }
        }

        masterContractOf[cloneAddress] = masterContract;

        IMasterContract(cloneAddress).init{value: msg.value}(data);

        emit LogDeploy(masterContract, data, cloneAddress);
    }
}
