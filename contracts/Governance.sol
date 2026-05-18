// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interface mínima do CertificateToken para verificar saldo do votante
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

// Interface mínima do CertificateNFT para aprovar ou revogar emissores
interface ICertificateNFT {
    function setEmitter(address emitter, bool status) external;
}

contract Governance is Ownable {
    IERC20 public certToken; // Token usado para votar
    ICertificateNFT public certNFT; // NFT cujos emissores serão gerenciados

    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 3 days; // Prazo de votação
    uint256 public constant MIN_VOTES = 1e18; // Mínimo de 1 CERT para votar

    // Status possíveis de uma proposta
    enum ProposalStatus {
        Active,
        Approved,
        Rejected
    }

    // Estrutura de dados de uma proposta
    struct Proposal {
        uint256 id;
        address emitterAddress; // Endereço do emissor em votação
        bool approveEmitter; // true = aprovar, false = revogar
        string description; // Descrição da proposta
        uint256 votesFor; // Total de votos a favor (ponderado por saldo)
        uint256 votesAgainst; // Total de votos contra (ponderado por saldo)
        uint256 deadline; // Prazo final para votação
        ProposalStatus status; // Status atual da proposta
    }

    // ID da proposta => dados da proposta
    mapping(uint256 => Proposal) public proposals;

    // ID da proposta => endereço => já votou?
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Evento disparado ao criar uma proposta
    event ProposalCreated(
        uint256 indexed id,
        address emitter,
        string description
    );

    // Evento disparado ao registrar um voto
    event Voted(uint256 indexed id, address indexed voter, bool support);

    // Evento disparado ao executar o resultado da proposta
    event ProposalExecuted(uint256 indexed id, ProposalStatus status);

    constructor(address _certToken, address _certNFT) Ownable(msg.sender) {
        certToken = IERC20(_certToken);
        certNFT = ICertificateNFT(_certNFT);
    }

    // Qualquer holder com pelo menos 1 CERT pode criar uma proposta
    function createProposal(
        address emitterAddress,
        bool approveEmitter,
        string memory description
    ) external {
        require(
            certToken.balanceOf(msg.sender) >= MIN_VOTES,
            "Precisa de pelo menos 1 CERT para propor"
        );

        uint256 id = proposalCount;
        proposalCount++;

        proposals[id] = Proposal({
            id: id,
            emitterAddress: emitterAddress,
            approveEmitter: approveEmitter,
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + VOTING_PERIOD,
            status: ProposalStatus.Active
        });

        emit ProposalCreated(id, emitterAddress, description);
    }

    // Holder vota em uma proposta ativa (peso = saldo de CERT)
    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Active, "Proposta nao esta ativa");
        require(block.timestamp <= p.deadline, "Periodo de votacao encerrado");
        require(
            !hasVoted[proposalId][msg.sender],
            "Voce ja votou nesta proposta"
        );

        uint256 voterBalance = certToken.balanceOf(msg.sender);
        require(
            voterBalance >= MIN_VOTES,
            "Precisa de pelo menos 1 CERT para votar"
        );

        hasVoted[proposalId][msg.sender] = true;

        // Voto ponderado: mais tokens = mais peso
        if (support) {
            p.votesFor += voterBalance;
        } else {
            p.votesAgainst += voterBalance;
        }

        emit Voted(proposalId, msg.sender, support);
    }

    // Executa o resultado da proposta após o período de votação
    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Active, "Proposta ja foi executada");
        require(block.timestamp > p.deadline, "Votacao ainda em andamento");

        if (p.votesFor > p.votesAgainst) {
            p.status = ProposalStatus.Approved;
            // Aplica a decisão no contrato NFT
            certNFT.setEmitter(p.emitterAddress, p.approveEmitter);
        } else {
            p.status = ProposalStatus.Rejected;
        }

        emit ProposalExecuted(proposalId, p.status);
    }

    // Retorna todos os dados de uma proposta pelo ID
    function getProposal(
        uint256 proposalId
    ) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
}
