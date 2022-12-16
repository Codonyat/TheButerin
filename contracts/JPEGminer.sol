//SPDX-License-Identifier: MIT

/// @title JPEG Mining
/// @author Xatarrer
/// @notice Unaudited
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Array.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@rari-capital/solmate/src/utils/SSTORE2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/** 
    @dev Return data URL:
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
    https://en.wikipedia.org/wiki/Data_URI_scheme

    @dev Base64 encoding/decoding available at https://github.com/Brechtpd/base64/blob/main/base64.sol
    
    @dev Large efficient immutable storage: https://github.com/0xsequence/sstore2/blob/master/contracts/SSTORE2.sol
*/

contract JPEGminer is ERC721Enumerable, Ownable {
    event Mined(address indexed minerAddress, string indexed phase); // ALSO RECORD BYTES

    // Packed into 256 bits
    // THESE ARE UPDATED BY MINERS
    struct Chunk {
        address dataPointer; // I can get kB from this
        uint24 tokenIdFirstInScan;
        uint24 tokenIdLastInScan;
        uint24 scanId;
        uint24 frameColor; // 3 bytes is what RGB needs
    }

    bytes32 private immutable _ROOT;

    string private constant _NAME = "Buterin Card";
    string private constant _SYMBOL = "VIT";
    string private constant _DESCRIPTION =
        "JPEG Mining is a collaborative effort to store %2a%2athe largest on-chain image%2a%2a %281.5MB in Base64 format %26 1.1MB in binary%29. "
        "The image is split into 100 pieces which are uploaded by every wallet that calls the function mine%28%29. "
        "Thanks to the %2a%2aprogressive JPEG%2a%2a technology the image is viewable since its first piece is mined, "
        "and its quality gradually improves until the last piece is mined.  %5Cr  %5Cr"
        "As the image's quality improves over each successive mining, it goes through 3 different clear phases%3A  %5Cr"
        "1. image is %2a%2black & white%2a%2 only,  %5Cr2. %2a%2color%2a%2 is added, and  %5Cr3. %2a%2resolution%2a%2 improves until the final version.  %5Cr"
        "The B&W phase is the shortest and only lasts 11 uploads, "
        "the color phase last 22 uploads, and the resolution phase is the longest with 67 uploads.  %5Cr  %5Cr"
        "Every JPEG miner gets an NFT of the image with the quality at the time of minting.  %5Cr  %5Cr"
        "Art by Logan Turner. Idea and code by Xatarrer.";

    // Image data
    address private immutable _IMAGE_HEADER_POINTER;
    Chunk[] private _CHUNKS;
    bytes private _IMAGE_FOOTER;

    // bytes("/9k=");

    constructor(
        bytes32 root,
        string memory imageHeaderB64,
        string memory imageFooterB64
    ) ERC721(_NAME, _SYMBOL) {
        _ROOT = root;
        _IMAGE_HEADER_POINTER = SSTORE2.write(bytes(imageHeaderB64));
        _IMAGE_FOOTER = bytes(imageFooterB64);
    }

    /// @return JSON with properties
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        uint256 Nscans = tokenId + 1;

        // Create big array of bytes and copy necessary segments
        bytes[] memory bytesSegments = new bytes[](Nscans + 4);
        bytesSegments[0] = bytes(
            string.concat(
                "data:application/json;charset=UTF-8,\x7B\x22name\x22\x3A\x22",
                _NAME,
                "\x22,\x22description\x22\x3A\x22",
                _DESCRIPTION,
                "\x22,\x22image\x22\x3A\x22data:image/jpeg;base64,"
            )
        );
        bytesSegments[1] = SSTORE2.read(_IMAGE_HEADER_POINTER);
        bytesSegments[Nscans + 2] = _IMAGE_FOOTER;
        bytesSegments[Nscans + 3] = bytes(
            string.concat(
                "\x7D, \x7B\x22trait_type\x22\x3A \x22phase\x22, \x22value\x22\x3A \x22",
                getPhase(tokenId),
                "\x22\x7D\x5D\x7D"
            )
        );

        // Copy scans
        for (uint256 i = 0; i < Nscans; i++) {
            bytesSegments[i + 2] = SSTORE2.read(_CHUNKS[i].dataPointer);
        }

        bytes memory URI = Array.join(bytesSegments);

        return string(URI);
    }

    function getPhase(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");

        if (tokenId <= 10) return "Black & White";
        else if (tokenId <= 32) return "Color";
        else return "Resolution";
    }

    /// @param imageChunkB64 Piece of image data in base64
    function mine(string calldata imageChunkB64, bytes32[] calldata proof) external {
        // Check hash matches
        _verifyDataChunk(proof, imageChunkB64);

        // SSTORE2 scan
        _CHUNKS.push(Chunk({dataPointer: SSTORE2.write(bytes(imageChunkB64))}));

        // Mint scan
        uint256 tokenId = totalSupply();
        _mint(msg.sender, tokenId);

        emit Mined(msg.sender, getPhase(tokenId));
    }

    function _verifyDataChunk(bytes32[] calldata proof, string calldata imageChunkB64) private view {
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(totalSupply(), imageChunkB64))));
        require(MerkleProof.verifyCalldata(proof, _ROOT, leaf), "Invalid data");
    }
}
