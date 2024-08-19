"use client";

import { Keypair } from "@solana/web3.js";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Wallet } from "ethers";
import { HDNodeWallet } from "ethers";
import { useState } from "react";
import nacl from "tweetnacl";

export default function Home() {
  const [mnemonic, setMnemonic] = useState("");
  const [mnemonicSecured, setMnemonicSecured] = useState(false);
  const [ethereumWallets, setEthereumWallets] = useState<string[]>([]);
  const [solanaWallets, setSolanaWallets] = useState<string[]>([]);
  const [walletsCreated, setWalletsCreated] = useState(false);

  function generateStarterWallet() {
    // solana
    generateEthereumWallets();

    // ethereum
    generateSolanaWallets();
    setWalletsCreated(true);
  }

  function generateEthereumWallets() {
    const derivationPath = `m/44'/60'/${ethereumWallets.length}'/0'`;
    const hdNode = HDNodeWallet.fromSeed(mnemonicToSeedSync(mnemonic));
    const child = hdNode.derivePath(derivationPath);
    const privateKey = child.privateKey;
    const wallet = new Wallet(privateKey);
    setEthereumWallets([...ethereumWallets, wallet.address]);
  }

  function generateSolanaWallets() {
    const seed = mnemonicToSeedSync(mnemonic);
    const path = `m/44'/501'/${solanaWallets.length}'/0'`;
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    const keypair = Keypair.fromSecretKey(secret);
    setSolanaWallets([...solanaWallets, keypair.publicKey.toString()]);
  }

  return (
    <>
      {!walletsCreated && mnemonic && (
        <>
          <main className="flex min-h-screen flex-col gap-10 items-center p-24">
            <h1 className="text-3xl font-bold">Welcome to Yashletz!</h1>
            <p className="text-2xl">
              Easily manage and use your cryptocurrency.
            </p>
            <p>{mnemonic}</p>

            <label htmlFor="mnemonic-secured">
              <input
                type="checkbox"
                checked={mnemonicSecured}
                onChange={() => setMnemonicSecured(!mnemonicSecured)}
              />{" "}
              Secured
            </label>
            <button onClick={generateStarterWallet} disabled={!mnemonicSecured}>
              Generate Wallet
            </button>
          </main>
        </>
      )}
      {!walletsCreated && !mnemonic && (
        <>
          <main className="flex min-h-screen flex-col gap-10 items-center p-24">
            <h1 className="text-3xl font-bold">Welcome to Yashletz!</h1>
            <p className="text-2xl">
              Easily manage and use your cryptocurrency.
            </p>
            <button onClick={() => setMnemonic(generateMnemonic())}>
              Generate Security phrases
            </button>
          </main>
        </>
      )}
      {walletsCreated && (
        <>
          <main className="flex min-h-screen flex-col gap-10 items-center p-24">
            <h1 className="text-3xl font-bold">Welcome to Yashletz!</h1>
            <p className="text-2xl">
              Easily manage and use your cryptocurrency.
            </p>
            <p>
              Ethereum <button onClick={generateEthereumWallets}>+</button>
            </p>
            <ul>
              {ethereumWallets.map((wallet) => (
                <li key={wallet}>{wallet}</li>
              ))}
            </ul>
            <p>
              Solana <button onClick={generateSolanaWallets}>+</button>
            </p>
            <ul>
              {solanaWallets.map((wallet) => (
                <li key={wallet}>{wallet}</li>
              ))}
            </ul>
          </main>
        </>
      )}
    </>
  );
}
