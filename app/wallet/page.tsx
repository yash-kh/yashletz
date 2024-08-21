"use client";

import { useCallback, useEffect, useState } from "react";
import { derivePath } from "ed25519-hd-key";
import { Wallet } from "ethers";
import { HDNodeWallet } from "ethers";
import { Keypair } from "@solana/web3.js";
import { mnemonicToSeedSync } from "bip39";
import nacl from "tweetnacl";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DialogClose } from "@radix-ui/react-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

interface LocalWallet {
  name: string;
  publickey: string;
  privateKey: string;
  balance: number;
}

interface WalletType {
  name: string;
  icon: string;
  symbol: string;
  wallets: LocalWallet[];
}

export default function WalletDashboard() {
  const router = useRouter();
  const [mnemonic, setMnemonic] = useState("");
  const [walletTypeList, setWalletTypeList] = useState<WalletType[]>([
    {
      name: "Solana",
      icon: "https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png",
      symbol: "SOL",
      wallets: [],
    },
    {
      name: "Ethereum",
      icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Ethereum-icon-purple.svg/768px-Ethereum-icon-purple.svg.png",
      symbol: "ETH",
      wallets: [],
    },
  ]);
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType>(
    walletTypeList[0]
  );
  const [selectedWallet, setSelectedWallet] = useState<LocalWallet | null>(
    null
  );
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const tempMnemonic = sessionStorage.getItem("mnemonic");
    if (tempMnemonic) {
      setMnemonic(tempMnemonic);
      generateEthereumWallets(tempMnemonic);
      let solanaWallets = generateSolanaWallets(tempMnemonic);
      setSelectedWallet(solanaWallets);
    } else {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchWalletBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWallet?.publickey]);

  async function fetchWalletBalance() {
    if (selectedWallet && selectedWalletType) {
      setFetchingBalance(true);

      try {
        const response = await fetch("/api/balance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            selectedWallet: selectedWallet.publickey,
            selectedWalletType: selectedWalletType.name,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSelectedWallet((old) => {
            if (!old) return old;
            return { ...old, balance: data.balance };
          });
        } else {
          console.error(data.error);
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setFetchingBalance(false);
      }
    }
  }

  function generateEthereumWallets(mnemonic: string) {
    const ethereumWallets = JSON.parse(
      JSON.stringify(walletTypeList[1].wallets)
    );
    const derivationPath = `m/44'/60'/${ethereumWallets.length}'/0'`;
    const hdNode = HDNodeWallet.fromSeed(mnemonicToSeedSync(mnemonic));
    const child = hdNode.derivePath(derivationPath);
    const privateKey = child.privateKey;
    const wallet = new Wallet(privateKey);
    ethereumWallets.push({
      name: "Wallet " + (ethereumWallets.length + 1),
      publickey: wallet.address,
      privateKey: privateKey,
      balance: 0,
    });
    setWalletTypeList((old) => {
      old[1].wallets = ethereumWallets;
      return old;
    });
    return ethereumWallets[ethereumWallets.length - 1];
  }

  function generateSolanaWallets(mnemonic: string) {
    const solanaWallets = JSON.parse(JSON.stringify(walletTypeList[0].wallets));
    const seed = mnemonicToSeedSync(mnemonic);
    const path = `m/44'/501'/${solanaWallets.length}'/0'`;
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    const keypair = Keypair.fromSecretKey(secret);
    solanaWallets.push({
      name: "Wallet " + (solanaWallets.length + 1),
      publickey: keypair.publicKey.toString(),
      privateKey: keypair.secretKey.toString(),
      balance: 0,
    });
    setWalletTypeList((old) => {
      old[0].wallets = solanaWallets;
      return old;
    });
    return solanaWallets[solanaWallets.length - 1];
  }

  const generatePublicKeyView = useCallback((key: string) => {
    return key.slice(0, 4) + "..." + key.slice(-4);
  }, []);

  return (
    <>
      <main className="container flex min-h-screen flex-col gap-10 p-12">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Yashletz</h1>
          <div className="flex">
            <Avatar>
              <AvatarImage src={selectedWalletType.icon} />
              <AvatarFallback>{selectedWalletType.symbol}</AvatarFallback>
            </Avatar>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="ml-3">
                  {selectedWallet?.name || (
                    <Skeleton className="h-4 w-[50px]" />
                    // <div className="space-y-2">
                    //   <Skeleton className="h-4 w-[250px]" />
                    //   <Skeleton className="h-4 w-[200px]" />
                    // </div>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Wallets</DialogTitle>
                </DialogHeader>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-20">
                    <Button variant="secondary">
                      {selectedWalletType.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Select Network</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {walletTypeList.map((wallet) => (
                      <DropdownMenuItem
                        key={wallet.name}
                        onClick={() => {
                          setSelectedWalletType(wallet);
                          setSelectedWallet(wallet.wallets[0]);
                        }}
                      >
                        {wallet.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex flex-col">
                  {selectedWalletType.wallets.map((wallet) => (
                    <DialogClose asChild key={wallet.name}>
                      <div
                        className="flex border rounded p-4 mb-1 hover:bg-gray-200 cursor-pointer"
                        onClick={() => setSelectedWallet(wallet)}
                      >
                        <p>
                          {wallet.name}
                          {" : "}
                          {generatePublicKeyView(wallet.publickey)}
                        </p>
                      </div>
                    </DialogClose>
                  ))}
                  <DialogClose asChild>
                    <Button
                      className="mt-3"
                      onClick={() => {
                        if (selectedWalletType.name === "Solana") {
                          let solanaWallets = generateSolanaWallets(mnemonic);
                          setSelectedWallet(solanaWallets);
                        } else if (selectedWalletType.name === "Ethereum") {
                          let ethereumWallets =
                            generateEthereumWallets(mnemonic);
                          setSelectedWallet(ethereumWallets);
                        }
                      }}
                    >
                      Add Wallet
                    </Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {selectedWallet ? (
          <div>
            <h1 className="text-lg">
              {selectedWallet.name}
              {" : "}
              {generatePublicKeyView(selectedWallet.publickey)}
              <i
                className="fa-solid fa-copy hover:cursor-pointer ml-3 hover:text-green-500"
                onClick={() => {
                  navigator.clipboard
                    .writeText(selectedWallet.publickey)
                    .then(() => {
                      toast({
                        title: "Copied",
                        description: "Public key copied to clipboard",
                        duration: 2000,
                      });
                    });
                }}
              ></i>
            </h1>
            <h1 className="text-lg">
              {fetchingBalance ? (
                <Skeleton className="inline-block h-4 w-[50px] bg-black" />
              ) : (
                selectedWallet.balance
              )}
              {" " + selectedWalletType.symbol}
            </h1>
          </div>
        ) : (
          <Skeleton className="h-4 w-[250px] bg-black" />
        )}
      </main>
    </>
  );
}
