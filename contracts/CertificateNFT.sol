// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721, Ownable {
    // Contador para gerar IDs únicos para cada certificado
    uint256 private _nextTokenId;

    // Estrutura com os dados de cada certificado
    struct Certificate {
        string studentName; // Nome do aluno
        string courseName; // Nome do curso
        string issuerName; // Nome da instituição emissora
        uint256 issuedAt; // Data de emissão (timestamp)
    }

    // Relaciona o ID do token com os dados do certificado
    mapping(uint256 => Certificate) public certificates;

    // Endereços autorizados pela DAO a emitir certificados
    mapping(address => bool) public approvedEmitters;

    // Evento disparado quando um certificado é emitido
    event CertificateMinted(uint256 indexed tokenId, address indexed student);

    // Evento disparado quando um emissor é aprovado ou revogado
    event EmitterApproved(address indexed emitter, bool status);

    constructor() ERC721("CertificateNFT", "CNFT") Ownable(msg.sender) {}

    // Owner (Governance) autoriza ou revoga um emissor
    function setEmitter(address emitter, bool status) external onlyOwner {
        approvedEmitters[emitter] = status;
        emit EmitterApproved(emitter, status);
    }

    // Emissor autorizado cria um certificado NFT para o aluno
    function mintCertificate(
        address student,
        string memory studentName,
        string memory courseName,
        string memory issuerName
    ) external {
        require(approvedEmitters[msg.sender], "Emissor nao autorizado");

        uint256 tokenId = _nextTokenId;
        _nextTokenId++;

        // Salva os dados do certificado na blockchain
        certificates[tokenId] = Certificate({
            studentName: studentName,
            courseName: courseName,
            issuerName: issuerName,
            issuedAt: block.timestamp
        });

        _safeMint(student, tokenId);
        emit CertificateMinted(tokenId, student);
    }

    // Consulta os dados de um certificado pelo seu ID
    function getCertificate(
        uint256 tokenId
    ) external view returns (Certificate memory) {
        require(tokenId < _nextTokenId, "Certificado nao existe");
        return certificates[tokenId];
    }
}
