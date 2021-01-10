// SPDX-License-Identifier: MIT
// solhint-disable no-inline-assembly
// solhint-disable not-rely-on-time

pragma solidity 0.6.12;

// Data part taken out for building of contracts that receive delegate calls
contract ERC20Data {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping (address => uint256)) public allowance;
    mapping(address => uint256) public nonces;
}

contract ERC20 is ERC20Data {
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    function transfer(address to, uint256 amount) public returns (bool success) {
        require(balanceOf[msg.sender] >= amount, "ERC20: balance too low");
        // The following check is pretty much in all ERC20 contracts, but this can only fail if totalSupply >= 2^256
        require(balanceOf[to] + amount >= balanceOf[to], "ERC20: overflow detected");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool success) {
        require(balanceOf[from] >= amount, "ERC20: balance too low");
        require(allowance[from][msg.sender] >= amount, "ERC20: allowance too low");
        // The following check is pretty much in all ERC20 contracts, but this can only fail if totalSupply >= 2^256
        require(balanceOf[to] + amount >= balanceOf[to], "ERC20: overflow detected");
        balanceOf[from] -= amount;
        allowance[from][msg.sender] -= amount;
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
    function DOMAIN_SEPARATOR() public view returns (bytes32){
      uint256 chainId;
      assembly {chainId := chainid()}
      return keccak256(abi.encode(keccak256("EIP712Domain(uint256 chainId,address verifyingContract)"), chainId, address(this)));
    }

    function permit(address owner_, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        require(owner_ != address(0), "ERC20: Owner cannot be 0");
        require(block.timestamp < deadline, "ERC20: Expired");
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01", DOMAIN_SEPARATOR(),
            keccak256(abi.encode(
                // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
                0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9,
                owner_, spender, value, nonces[owner_]++, deadline
            ))
        ));
        address recoveredAddress = ecrecover(digest, v, r, s);
        require(recoveredAddress == owner_, "ERC20: Invalid Signature");
        allowance[owner_][spender] = value;
        emit Approval(owner_, spender, value);
    }
}
