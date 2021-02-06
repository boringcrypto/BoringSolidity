// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

// solhint-disable no-inline-assembly
// solhint-disable not-rely-on-time

// Data part taken out for building of contracts that receive delegate calls
contract ERC20Data {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public nonces;
}

contract ERC20 is ERC20Data {
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    address private constant ZERO_ADDRESS = address(0);

    function transfer(address to, uint256 amount) public returns (bool success) {
        require(to != ZERO_ADDRESS, "ERC20: no zero address");
        require(balanceOf[msg.sender] >= amount, "ERC20: balance too low");
        // The following check is pretty much in all ERC20 contracts, but this can only fail if totalSupply >= 2^256
        require(balanceOf[to] + amount >= balanceOf[to], "ERC20: overflow detected");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public returns (bool success) {
        require(to != ZERO_ADDRESS, "ERC20: no zero address");
        require(balanceOf[from] >= amount, "ERC20: balance too low");
        require(allowance[from][msg.sender] >= amount, "ERC20: allowance too low");
        // The following check is pretty much in all ERC20 contracts, but this can only fail if totalSupply >= 2^256
        require(balanceOf[to] + amount >= balanceOf[to], "ERC20: overflow detected");
        balanceOf[from] -= amount;
        uint256 spenderAllowance = allowance[from][msg.sender];
        // If allowance is infinite, don't decrease it to save on gas.
        if (spenderAllowance != type(uint256).max) {
            allowance[from][msg.sender] = spenderAllowance - amount;
            emit Approval(msg.sender, msg.sender, amount);
        }
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool success) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() public view returns (bytes32) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return keccak256(abi.encode(keccak256("EIP712Domain(uint256 chainId,address verifyingContract)"), chainId, address(this)));
    }

    // See https://eips.ethereum.org/EIPS/eip-191
    string private constant EIP191_PREFIX_FOR_EIP712_STRUCTURED_DATA = "\x19\x01";
    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    bytes32 private constant PERMIT_SIGNATURE_HASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;

    function permit(
        address owner_,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(owner_ != ZERO_ADDRESS, "ERC20: Owner cannot be 0");
        require(block.timestamp < deadline, "ERC20: Expired");
        bytes32 digest =
            keccak256(
                abi.encodePacked(
                    EIP191_PREFIX_FOR_EIP712_STRUCTURED_DATA,
                    DOMAIN_SEPARATOR(),
                    keccak256(abi.encode(PERMIT_SIGNATURE_HASH, owner_, spender, value, nonces[owner_]++, deadline))
                )
            );
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress == owner_, "ERC20: Invalid Signature");
        allowance[owner_][spender] = value;
        emit Approval(owner_, spender, value);
    }
}
