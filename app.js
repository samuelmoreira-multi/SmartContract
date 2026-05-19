const ADDRESSES = {
  token: "0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8",
  nft: "0xf8e81D47203A594245E36C48e151709F0C19fBe8",
  staking: "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B",
  governance: "0x7EF2e0048f5bAeDe046f6BF797943daF4ED8CB47",
};

// ─── ABIs mínimas ───
const ABI_TOKEN = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const ABI_NFT = [
  "function mintCertificate(address student, string studentName, string courseName, string issuerName)",
  "function getCertificate(uint256 tokenId) view returns (tuple(string studentName, string courseName, string issuerName, uint256 issuedAt))",
];

const ABI_STAKING = [
  "function stake() payable",
  "function unstake(uint256 amount)",
  "function claimReward()",
  "function stakedBalance(address) view returns (uint256)",
  "function calculateReward(address) view returns (uint256)",
  "function getETHPrice() view returns (int256)",
];

const ABI_GOV = [
  "function createProposal(address emitterAddress, bool approveEmitter, string description)",
  "function vote(uint256 proposalId, bool support)",
  "function executeProposal(uint256 proposalId)",
  "function getProposal(uint256 proposalId) view returns (tuple(uint256 id, address emitterAddress, bool approveEmitter, string description, uint256 votesFor, uint256 votesAgainst, uint256 deadline, uint8 status))",
];

// ─── Estado global ───
let provider, signer, userAddress;

// ─── Conectar MetaMask ───
async function connectWallet() {
  if (!window.ethereum) {
    toast("MetaMask não encontrada!", "error");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    document.getElementById("wallet-address").textContent =
      userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
    document.getElementById("wallet-info").style.display = "block";
    document.getElementById("btn-connect").textContent = "CONECTADO ✓";
    document.getElementById("btn-connect").disabled = true;

    await updateStats();
    toast("Carteira conectada com sucesso!", "success");
  } catch (e) {
    toast("Erro ao conectar: " + e.message, "error");
  }
}

// ─── Atualizar stats bar ───
async function updateStats() {
  try {
    const network = await provider.getNetwork();
    document.getElementById("stat-network").textContent =
      network.name === "unknown" ? "Sepolia" : network.name;

    const ethBal = await provider.getBalance(userAddress);
    document.getElementById("stat-eth").textContent =
      parseFloat(ethers.formatEther(ethBal)).toFixed(4) + " ETH";

    const token = new ethers.Contract(ADDRESSES.token, ABI_TOKEN, provider);
    const certBal = await token.balanceOf(userAddress);
    document.getElementById("stat-cert").textContent =
      parseFloat(ethers.formatEther(certBal)).toFixed(2) + " CERT";

    const staking = new ethers.Contract(
      ADDRESSES.staking,
      ABI_STAKING,
      provider,
    );
    const price = await staking.getETHPrice();
    document.getElementById("stat-price").textContent =
      "$ " + (Number(price) / 1e8).toFixed(2);
  } catch (e) {
    console.error("Stats error:", e);
  }
}

// ─── Token: transferir ───
async function transferToken() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  const to = document.getElementById("token-to").value;
  const amount = document.getElementById("token-amount").value;
  if (!to || !amount) {
    toast("Preencha todos os campos", "error");
    return;
  }
  try {
    const token = new ethers.Contract(ADDRESSES.token, ABI_TOKEN, signer);
    const tx = await token.transfer(to, ethers.parseEther(amount));
    toast("Transação enviada, aguardando confirmação...", "info");
    await tx.wait();
    toast(
      "Transferência realizada! TX: " + tx.hash.slice(0, 12) + "...",
      "success",
    );
    await updateStats();
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Token: ver saldo ───
async function getTokenBalance() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  try {
    const token = new ethers.Contract(ADDRESSES.token, ABI_TOKEN, provider);
    const bal = await token.balanceOf(userAddress);
    showResult("result-token", "Saldo: " + ethers.formatEther(bal) + " CERT");
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── NFT: emitir certificado ───
async function mintNFT() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  const student = document.getElementById("nft-student").value;
  const name = document.getElementById("nft-name").value;
  const course = document.getElementById("nft-course").value;
  const issuer = document.getElementById("nft-issuer").value;
  if (!student || !name || !course || !issuer) {
    toast("Preencha todos os campos", "error");
    return;
  }
  try {
    const nft = new ethers.Contract(ADDRESSES.nft, ABI_NFT, signer);
    const tx = await nft.mintCertificate(student, name, course, issuer);
    toast("Emitindo certificado, aguardando confirmação...", "info");
    await tx.wait();
    toast(
      "Certificado emitido! TX: " + tx.hash.slice(0, 12) + "...",
      "success",
    );
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── NFT: consultar certificado ───
async function getCertificate() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  const id = document.getElementById("nft-query-id").value;
  try {
    const nft = new ethers.Contract(ADDRESSES.nft, ABI_NFT, provider);
    const cert = await nft.getCertificate(id);
    const date = new Date(Number(cert.issuedAt) * 1000).toLocaleDateString(
      "pt-BR",
    );
    showResult(
      "result-nft",
      "Aluno: " +
        cert.studentName +
        "\n" +
        "Curso: " +
        cert.courseName +
        "\n" +
        "Emissor: " +
        cert.issuerName +
        "\n" +
        "Data: " +
        date,
    );
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Staking: fazer stake ───
async function doStake() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  const amount = document.getElementById("stake-amount").value;
  if (!amount) {
    toast("Informe o valor", "error");
    return;
  }
  try {
    const staking = new ethers.Contract(ADDRESSES.staking, ABI_STAKING, signer);
    const tx = await staking.stake({ value: ethers.parseEther(amount) });
    toast("Stake enviado, aguardando confirmação...", "info");
    await tx.wait();
    toast("Stake realizado! TX: " + tx.hash.slice(0, 12) + "...", "success");
    await updateStats();
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Staking: retirar stake ───
async function doUnstake() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  const amount = document.getElementById("unstake-amount").value;
  if (!amount) {
    toast("Informe o valor", "error");
    return;
  }
  try {
    const staking = new ethers.Contract(ADDRESSES.staking, ABI_STAKING, signer);
    const tx = await staking.unstake(ethers.parseEther(amount));
    toast("Retirada enviada, aguardando confirmação...", "info");
    await tx.wait();
    toast("Stake retirado! TX: " + tx.hash.slice(0, 12) + "...", "success");
    await updateStats();
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Staking: resgatar recompensas ───
async function claimReward() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  try {
    const staking = new ethers.Contract(ADDRESSES.staking, ABI_STAKING, signer);
    const tx = await staking.claimReward();
    toast("Resgatando recompensas...", "info");
    await tx.wait();
    toast(
      "Recompensas resgatadas! TX: " + tx.hash.slice(0, 12) + "...",
      "success",
    );
    await updateStats();
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Staking: ver info ───
async function getStakingInfo() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  try {
    const staking = new ethers.Contract(
      ADDRESSES.staking,
      ABI_STAKING,
      provider,
    );
    const bal = await staking.stakedBalance(userAddress);
    const reward = await staking.calculateReward(userAddress);
    showResult(
      "result-staking",
      "Em stake: " +
        ethers.formatEther(bal) +
        " ETH\n" +
        "Recompensa pendente: " +
        ethers.formatEther(reward) +
        " CERT",
    );
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Governance: criar proposta ───
async function createProposal() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  const emitter = document.getElementById("gov-emitter").value;
  const desc = document.getElementById("gov-desc").value;
  if (!emitter || !desc) {
    toast("Preencha todos os campos", "error");
    return;
  }
  try {
    const gov = new ethers.Contract(ADDRESSES.governance, ABI_GOV, signer);
    const tx = await gov.createProposal(emitter, true, desc);
    toast("Proposta criada, aguardando confirmação...", "info");
    await tx.wait();
    toast("Proposta criada! TX: " + tx.hash.slice(0, 12) + "...", "success");
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Governance: votar ───
async function vote(support) {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  const id = document.getElementById("gov-proposal-id").value;
  if (id === "") {
    toast("Informe o ID da proposta", "error");
    return;
  }
  try {
    const gov = new ethers.Contract(ADDRESSES.governance, ABI_GOV, signer);
    const tx = await gov.vote(id, support);
    toast("Voto enviado, aguardando confirmação...", "info");
    await tx.wait();
    toast("Voto registrado! TX: " + tx.hash.slice(0, 12) + "...", "success");
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Governance: executar proposta ───
async function executeProposal() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  const id = document.getElementById("gov-exec-id").value;
  if (id === "") {
    toast("Informe o ID da proposta", "error");
    return;
  }
  try {
    const gov = new ethers.Contract(ADDRESSES.governance, ABI_GOV, signer);
    const tx = await gov.executeProposal(id);
    toast("Executando proposta...", "info");
    await tx.wait();
    toast("Proposta executada! TX: " + tx.hash.slice(0, 12) + "...", "success");
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Governance: consultar proposta ───
async function getProposal() {
  if (!signer) {
    toast("Conecte a carteira primeiro", "error");
    return;
  }
  const id = document.getElementById("gov-exec-id").value;
  if (id === "") {
    toast("Informe o ID da proposta", "error");
    return;
  }
  try {
    const gov = new ethers.Contract(ADDRESSES.governance, ABI_GOV, provider);
    const p = await gov.getProposal(id);
    const status = ["Ativa", "Aprovada", "Rejeitada"][p.status];
    const deadline = new Date(Number(p.deadline) * 1000).toLocaleDateString(
      "pt-BR",
    );
    showResult(
      "result-gov",
      "Emissor: " +
        p.emitterAddress +
        "\n" +
        "Descrição: " +
        p.description +
        "\n" +
        "A favor: " +
        ethers.formatEther(p.votesFor) +
        " CERT\n" +
        "Contra: " +
        ethers.formatEther(p.votesAgainst) +
        " CERT\n" +
        "Prazo: " +
        deadline +
        "\n" +
        "Status: " +
        status,
    );
  } catch (e) {
    toast("Erro: " + e.message, "error");
  }
}

// ─── Helpers ───
function showResult(id, text) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.add("visible");
}

function toast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
