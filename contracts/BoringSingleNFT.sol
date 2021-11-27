// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./libraries/BoringAddress.sol";

// solhint-disable avoid-low-level-calls

interface ERC721TokenReceiver {
    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    ) external returns (bytes4);
}

abstract contract BoringSingleNFT {
    /// This contract is an EIP-721 compliant contract that holds only a single NFT (totalSupply = 1)
    using BoringAddress for address;

    event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
    event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId);
    event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);

    // hodler must be set in derived contract
    // Since there is only one NFT, we only track single holder and allowed
    address public hodler;
    address public allowed;
    uint256 public constant totalSupply = 1;

    // operator mappings as per usual
    mapping(address => mapping(address => bool)) public operators;

    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // EIP-165
            interfaceID == 0x80ac58cd; // EIP-721
    }

    function balanceOf(address _owner) public view returns (uint256) {
        require(_owner != address(0), "No zero address");
        return _owner == hodler ? 1 : 0;
    }

    function ownerOf(uint256 _tokenId) public view returns (address) {
        require(_tokenId == 0, "Invalid token ID");
        require(hodler != address(0), "No owner");
        return hodler;
    }

    function approve(address _approved, uint256 _tokenId) public payable {
        require(_tokenId == 0, "Invalid token ID");
        require(msg.sender == hodler || operators[hodler][msg.sender], "Not allowed");
        allowed = _approved;
        emit Approval(msg.sender, _approved, _tokenId);
    }

    function setApprovalForAll(address _operator, bool _approved) public {
        operators[msg.sender][_operator] = _approved;
        emit ApprovalForAll(msg.sender, _operator, _approved);
    }

    function getApproved(uint256 _tokenId) public view returns (address) {
        require(_tokenId == 0, "Invalid token ID");
        return allowed;
    }

    function isApprovedForAll(address _owner, address _operator) public view returns (bool) {
        return operators[_owner][_operator];
    }

    function _transferBase(address to) internal {
        emit Transfer(hodler, to, 0);
        hodler = to;
        // EIP-721 seems to suggest not to emit the Approval event here as it is indicated by the Transfer event.
        allowed = address(0);
    }

    function _transfer(
        address from,
        address to,
        uint256 _tokenId
    ) internal {
        require(_tokenId == 0, "Invalid token ID");
        require(from == hodler, "From not owner");
        require(msg.sender == hodler || msg.sender == allowed || operators[hodler][msg.sender], "Transfer not allowed");
        require(to != address(0), "No zero address");
        _transferBase(to);
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) public payable {
        _transfer(_from, _to, _tokenId);
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId
    ) public payable {
        safeTransferFrom(_from, _to, _tokenId, "");
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes memory _data
    ) public payable {
        _transfer(_from, _to, _tokenId);
        if (_to.isContract()) {
            require(
                ERC721TokenReceiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data) ==
                    bytes4(keccak256("onERC721Received(address,address,uint256,bytes)")),
                "Wrong return value"
            );
        }
    }

    function tokenURI(uint256 _tokenId) public pure returns (string memory) {
        require(_tokenId == 0, "Invalid token ID");
        return _tokenURI();
    }

    function _tokenURI() internal pure virtual returns (string memory);
}
