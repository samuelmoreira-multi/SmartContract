# CertChain Protocol

Protocolo descentralizado para emissão e validação de certificados digitais na blockchain Ethereum.

---

## Sobre o Projeto

Certificados digitais tradicionais são emitidos de forma centralizada, facilmente falsificáveis e dependem da disponibilidade do emissor para validação. O **CertChain** resolve esse problema registrando cada certificado como um NFT único e imutável na blockchain, com emissores controlados por uma DAO e recompensas dinâmicas para validadores via oráculo Chainlink.

---

## Contratos Deployados — Sepolia Testnet

| Contrato                  | Endereço                                     | Etherscan                                                                              |
| ------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| CertificateToken (ERC-20) | `0x76666c7B31Aa0953A33D399aF45ccd092C9eBC31` | [Ver](https://sepolia.etherscan.io/address/0x76666c7B31Aa0953A33D399aF45ccd092C9eBC31) |
| CertificateNFT (ERC-721)  | `0xbcf3238fCb1984362a4D3BD5c918106188646375` | [Ver](https://sepolia.etherscan.io/address/0xbcf3238fCb1984362a4D3BD5c918106188646375) |
| CertificateStaking        | `0x1067D8E9b93Fb26ba524051e95F21B6B1f0E3e93` | [Ver](https://sepolia.etherscan.io/address/0x1067D8E9b93Fb26ba524051e95F21B6B1f0E3e93) |
| CertificateGovernance     | `0x3d407Cd0F5D5DA19cB30cd8Bd506cBe0c36e5678` | [Ver](https://sepolia.etherscan.io/address/0x3d407Cd0F5D5DA19cB30cd8Bd506cBe0c36e5678) |

---

## Arquitetura

CertificateGovernance (owner de todos os contratos)
├── CertificateToken (ERC-20 — token de crédito CERT)
├── CertificateNFT (ERC-721 — certificado único)
└── CertificateStaking (staking com recompensa via Chainlink)

**Fluxo principal:**

1. Holders de CERT votam na Governance para aprovar emissores
2. Emissor aprovado faz mint do NFT para o aluno
3. Validadores fazem stake de ETH e recebem CERT como recompensa
4. Recompensa é calculada dinamicamente com o preço ETH/USD via Chainlink

---

## Contratos

### CertificateToken.sol — ERC-20

Token fungível usado como crédito e para votação na DAO.

| Função                       | Descrição                        |
| ---------------------------- | -------------------------------- |
| `mint(address, uint256)`     | Emite novos tokens (onlyOwner)   |
| `burn(address, uint256)`     | Queima tokens (onlyOwner)        |
| `transfer(address, uint256)` | Transfere tokens entre carteiras |

### CertificateNFT.sol — ERC-721

Cada certificado é um NFT único com metadados on-chain.

| Função                      | Descrição                            |
| --------------------------- | ------------------------------------ |
| `setEmitter(address, bool)` | Aprova ou revoga emissor (onlyOwner) |
| `mintCertificate(...)`      | Emite certificado NFT (onlyEmitter)  |
| `getCertificate(tokenId)`   | Consulta dados do certificado        |

### CertificateStaking.sol

Staking de ETH com recompensas em CERT, calculadas via Chainlink.

| Função                     | Descrição                           |
| -------------------------- | ----------------------------------- |
| `stake()`                  | Deposita ETH para fazer stake       |
| `unstake(uint256)`         | Retira ETH do stake                 |
| `claimReward()`            | Resgata recompensas em CERT         |
| `calculateReward(address)` | Calcula recompensa pendente         |
| `getETHPrice()`            | Consulta preço ETH/USD no Chainlink |

### CertificateGovernance.sol — DAO

DAO simplificada para aprovação de emissores de certificados.

| Função                        | Descrição                                  |
| ----------------------------- | ------------------------------------------ |
| `createProposal(...)`         | Cria proposta para aprovar/revogar emissor |
| `vote(proposalId, bool)`      | Vota em uma proposta ativa                 |
| `executeProposal(proposalId)` | Executa resultado após prazo               |
| `getProposal(proposalId)`     | Consulta dados de uma proposta             |

---

## Segurança

- `ReentrancyGuard` no CertificateStaking
- `onlyOwner` em todas as funções administrativas
- Padrão checks → effects → interactions no `unstake()`
- Solidity `^0.8.0` com proteção nativa contra overflow
- Sem uso de `tx.origin` para autenticação
- Auditoria via Slither e Mythril — 0 vulnerabilidades críticas

---

## Oráculo Chainlink

O contrato CertificateStaking consome o price feed ETH/USD da Chainlink na Sepolia:

Endereço: 0x694AA1769357215DE4FAC081bf1f309aDC325306
Par: ETH / USD
Decimais: 8

A recompensa diária de CERT é proporcional ao preço atual do ETH — quanto maior o preço, maior a recompensa.

---

## Interface

O arquivo `index.html` é uma interface web standalone (sem frameworks) que conecta com MetaMask e permite:

- Conectar carteira MetaMask
- Ver saldo ETH, CERT e preço ETH/USD em tempo real
- Transferir tokens CERT
- Emitir e consultar certificados NFT
- Fazer stake, unstake e resgatar recompensas
- Criar propostas, votar e executar decisões na DAO

**Como usar:**

1. Abra o `index.html` no navegador
2. Clique em **Conectar MetaMask**
3. Certifique-se de estar na rede **Sepolia**

---

## Tecnologias

| Tecnologia        | Uso                                                   |
| ----------------- | ----------------------------------------------------- |
| Solidity `^0.8.0` | Linguagem dos smart contracts                         |
| OpenZeppelin      | Bibliotecas ERC-20, ERC-721, Ownable, ReentrancyGuard |
| Chainlink         | Price feed ETH/USD on-chain                           |
| ethers.js v6      | Integração Web3 no frontend                           |
| MetaMask          | Carteira e assinatura de transações                   |
| Remix IDE         | Desenvolvimento e deploy                              |
| Sepolia Testnet   | Rede de testes Ethereum                               |

---

## Como Rodar Localmente

1. Clone o repositório

bash
git clone https://github.com/seu-usuario/certchain-protocol.git
cd certchain-protocol

2. Abra o `index.html` diretamente no navegador — não precisa de servidor

3. Configure a MetaMask na rede **Sepolia**

4. Os contratos já estão deployados — basta usar a interface

---

## Estrutura do Repositório

certchain-protocol/
├── contracts/
│ ├── CertificateToken.sol
│ ├── CertificateNFT.sol
│ ├── CertificateStaking.sol
│ └── CertificateGovernance.sol
├── index.html
├── README.md

---

## Licença

MIT
