// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @dev Reverts if the zero address is detected.
 */
error AddressZeroDetected();

/**
 * @dev Reverts if the caller is not the owner of the NFT.
 */
error OnlyNftOwner();

/**
 * @dev Reverts if the price is 0.
 */
error PriceMustBeGreaterThanZero();

/**
 * @dev Reverts if the NFT is already listed.
 */
error AlreadyListed();

/**
 * @dev Reverts if the NFT is not listed.
 */
error NotListed();

/**
 * @dev Reverts if the sender doesn't have enough funds.
 */
error InsufficientFunds();

/**
 * @dev Reverts if the token id is invalid.
 */
error InvalidTokenId();

/**
 * @title NftMarket
 * @dev A marketplace for NFTs.
 */
contract NftMarket is ERC721, Ownable {
    uint private token_counter;
    mapping(uint => string) tokenUris;

    struct Listing {
        address seller;
        uint256 price;
        bool isListed;
    }
    mapping(uint256 => Listing) public listings;

    /**
     * @dev Initializes the contract.
     */
    constructor() ERC721("NftMarket", "NFTM") Ownable(msg.sender) {}

    /**
     * @dev Mints a new NFT.
     * @param _imgUri The URI of the image.
     * @param _to The address to mint the NFT to.
     */
    function mint(string memory _imgUri, address _to) external onlyOwner {
        if (_to == address(0)) {
            revert AddressZeroDetected();
        }
        tokenUris[token_counter] = _imgUri;
        _safeMint(_to, token_counter);
        token_counter++;
    }

    /**
     * @dev Lists a new NFT.
     * @param tokenId The id of the NFT to list.
     * @param price The price of the NFT.
     */
    function listNFT(uint256 tokenId, uint256 price) external {
        if (ownerOf(tokenId) != msg.sender) {
            revert OnlyNftOwner();
        }
        if (listings[tokenId].isListed) {
            revert AlreadyListed();
        }
        if (price == 0) {
            revert PriceMustBeGreaterThanZero();
        }
        listings[tokenId] = Listing(msg.sender, price, true);
    }

    /**
     * @dev Buys a listed NFT.
     * @param tokenId The id of the NFT to buy.
     */
    function buyNFT(uint256 tokenId) public payable {
        if (!listings[tokenId].isListed) {
            revert NotListed();
        }

        if (msg.value < listings[tokenId].price) {
            revert InsufficientFunds();
        }
        address seller = listings[tokenId].seller;
        payable(seller).transfer(msg.value);
        _transfer(seller, msg.sender, tokenId);
        listings[tokenId].isListed = false;
    }

    /**
     * @dev Transfers ownership of a NFT.
     * @param tokenId The id of the NFT to transfer.
     * @param newOwner The address to transfer the NFT to.
     */
    function transferOwnership(uint256 tokenId, address newOwner) external {
        if (newOwner == address(0)) {
            revert AddressZeroDetected();
        }
        if (ownerOf(tokenId) != msg.sender) {
            revert OnlyNftOwner();
        }
        _transfer(msg.sender, newOwner, tokenId);
    }

    /**
     * @dev Returns the base URI of the NFT.
     * @return The base URI of the NFT.
     */
    function _baseURI() internal pure override returns (string memory) {
        // This function returns the base URI of the NFT. The base URI is used to
        // construct the URI of the NFT.
        // The URI of the NFT is constructed by concatenating the base URI with
        // the token ID of the NFT.
        // The base URI is a URI that encodes the metadata of the NFT.
        // The metadata of the NFT is a JSON object that contains information
        // about the NFT, such as its name, description, and image.
        // The JSON object is encoded in base64 and stored in the URI.
        return "data:application/json;base64,";
    }

    /**
     * @dev Returns the URI of the NFT.
     * @param tokenId The id of the NFT.
     * @return The URI of the NFT.
     */
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        if (tokenId >= token_counter) {
            revert InvalidTokenId();
        }
        string memory img = tokenUris[tokenId];
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name": "',
                                name(),
                                '", "description": "A collection of NftMarket NFts", "image": "',
                                img,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    fallback() external payable {}

    receive() external payable {}
}
