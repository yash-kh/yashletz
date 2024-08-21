import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const {
    selectedWallet,
    selectedWalletType,
  }: { selectedWallet: string; selectedWalletType: string } =
    await request.json();

  if (!selectedWallet || !selectedWalletType) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    if (selectedWalletType === "Solana") {
      const raw = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [selectedWallet],
      });

      const requestOptions = {
        method: "POST",
        body: raw,
      };
      
      const reqSol = await fetch(process.env.SOL_URL || "", requestOptions);
      const resSol = await reqSol.json();
      const balance = Number(resSol.result.value) / 10 ** 9;

      return NextResponse.json({ balance });
    }

    if (selectedWalletType === "Ethereum") {
      const raw = JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        params: [selectedWallet, "latest"],
        method: "eth_getBalance",
      });

      const requestOptions = {
        method: "POST",
        body: raw,
      };

      const reqEth = await fetch(process.env.ETH_URL || "", requestOptions);
      const resEth = await reqEth.json();
      const hexBalance = resEth.result;
      const balance = parseInt(hexBalance, 16) / 10 ** 18;

      return NextResponse.json({ balance });
    }

    return NextResponse.json(
      { error: "Unsupported wallet type" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
