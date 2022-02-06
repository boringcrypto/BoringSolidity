// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "../ERC1155.sol";

contract MockERC1155 is ERC1155 {

    uint256 public uniqueness; 

    mapping (uint256 => address) public creators;

   function create(uint256 _initialSupply, string calldata _uri) external returns(uint256 _id) {

    _id = ++uniqueness;
    creators[_id] = msg.sender;
    // balanceOf[ msg.sender][_id] = _initialSupply;

    // Transfer event with mint semantic
    emit TransferSingle(msg.sender, address(0), address(0), _id, _initialSupply);

    if (bytes(_uri).length > 0)
        emit URI(_uri, _id);
}


  function mint(
      address to, 
      uint256 id,
      uint256 value) public {
        _mint(to, id, value );
    }

    function burn(
        address from,
        uint256 id,
        uint256 value) public {
        _burn(from, id, value);
    }

}
