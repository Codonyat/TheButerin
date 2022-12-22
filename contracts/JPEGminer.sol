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
    event Mined(
        address indexed minerAddress,
        uint tokenId,
        uint8 indexed phase,
        uint8 indexed scanId,
        uint cumulativeKiloBytes
    );

    // Tightly packed data structure
    struct Chunk {
        address dataPointer; // I can get kB from this
        uint8 phase; // 0 = B&W, 1 = Color - Blue, 2 = Color - Red, 3 = Resolution
        uint8 tokenIdWithinPhase;
        uint8 scanId;
        uint8 lastTokenIdWithinScan; // Useful for identifying when the scan will be available during mining
        uint8 textLegendId; // Random at mining.
        uint24 frameColor; // 3 bytes is what RGB needs. Random at mining.
    }

    bytes32 private immutable _ROOT;

    string private constant _NAME = "Buterin Card";
    string private constant _SYMBOL = "VIT";
    string private constant _DESCRIPTION = "bla bla bla";

    // Image data
    address public immutable IMAGE_HEADER_POINTER;
    Chunk[] public CHUNKS;
    bytes public IMAGE_FOOTER;

    // Other data
    address public TEXT_LEGENDS_POINTER; // To be uploaded by the 1st miner
    string[] public FRAME_COLORS = [
        "#DB4F54",
        "#D12A2F",
        "#E57D32",
        "#FCBC19",
        "#FCD265",
        "#29A691",
        "#7CA9BF",
        "#315F8C",
        "#543E2E",
        "#1F335D",
        "#3B2B20",
        "#121A33",
        "#261C15",
        "#F7B1A1",
        "#B8D9CE",
        "#E0D7C5"
    ]; // Fidenza palette (HEX coding)

    // bytes("/9k=");

    constructor(bytes32 root, string memory imageHeaderB64, string memory imageFooterB64) ERC721(_NAME, _SYMBOL) {
        _ROOT = root;
        IMAGE_HEADER_POINTER = SSTORE2.write(bytes(imageHeaderB64));
        IMAGE_FOOTER = bytes(imageFooterB64);
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
        bytesSegments[1] = SSTORE2.read(IMAGE_HEADER_POINTER);
        bytesSegments[Nscans + 2] = IMAGE_FOOTER;
        bytesSegments[Nscans + 3] = bytes(
            string.concat(
                "\x7D, \x7B\x22trait_type\x22\x3A \x22phase\x22, \x22value\x22\x3A \x22",
                getPhase(tokenId),
                "\x22\x7D\x5D\x7D"
            )
        );

        // Copy scans
        for (uint256 i = 0; i < Nscans; i++) {
            bytesSegments[i + 2] = SSTORE2.read(CHUNKS[i].dataPointer);
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
        CHUNKS.push(Chunk({dataPointer: SSTORE2.write(bytes(imageChunkB64))}));

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
