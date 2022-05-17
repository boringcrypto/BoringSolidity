// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./interfaces/IERC721.sol";
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

abstract contract BoringSingleNFT is IERC721, IERC721Metadata {
    /// This contract is an EIP-721 compliant contract that holds only a single NFT (totalSupply = 1)
    using BoringAddress for address;

    // hodler must be set in derived contract
    // Since there is only one NFT, we only track single holder and allowed
    address public hodler;
    address public allowed;
    // solhint-disable-next-line const-name-snakecase
    uint256 public constant totalSupply = 1;

    // operator mappings as per usual
    mapping(address => mapping(address => bool)) public operators;

    function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
        return
            interfaceID == this.supportsInterface.selector || // EIP-165
            interfaceID == 0x80ac58cd; // EIP-721
    }

    function balanceOf(address user) public view returns (uint256) {
        require(user != address(0), "No zero address");
        return user == hodler ? 1 : 0;
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        require(tokenId == 0, "Invalid token ID");
        require(hodler != address(0), "No owner");
        return hodler;
    }

    function approve(address approved, uint256 tokenId) public payable {
        require(tokenId == 0, "Invalid token ID");
        require(msg.sender == hodler || operators[hodler][msg.sender], "Not allowed");
        allowed = approved;
        emit Approval(msg.sender, approved, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public {
        operators[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(tokenId == 0, "Invalid token ID");
        return allowed;
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return operators[owner][operator];
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
        uint256 tokenId
    ) internal {
        require(tokenId == 0, "Invalid token ID");
        require(from == hodler, "From not owner");
        require(msg.sender == hodler || msg.sender == allowed || operators[hodler][msg.sender], "Transfer not allowed");
        require(to != address(0), "No zero address");
        _transferBase(to);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable {
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public payable {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public payable {
        _transfer(from, to, tokenId);
        if (to.isContract()) {
            require(
                ERC721TokenReceiver(to).onERC721Received(msg.sender, from, tokenId, data) ==
                    bytes4(keccak256("onERC721Received(address,address,uint256,bytes)")),
                "Wrong return value"
            );
        }
    }

    function tokenURI(uint256 tokenId) public pure returns (string memory) {
        require(tokenId == 0, "Invalid token ID");
        return _tokenURI();
    }

    function _tokenURI() internal pure virtual returns (string memory);
}
