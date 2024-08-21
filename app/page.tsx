"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { generateMnemonic } from "bip39";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mnemonic, setMnemonic] = useState("");
  const [mnemonicInputs, setMnemonicInputs] = useState(Array(12).fill(""));
  const [mnemonicSecured, setMnemonicSecured] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const mnemonic = localStorage.getItem("mnemonic");
    const walletTypeList = JSON.parse(
      localStorage.getItem("walletTypeList") || "[]"
    );
    console.log(walletTypeList);
    if (mnemonic && walletTypeList.length > 0) {
      router.push("/wallet");
    } else {
      localStorage.removeItem("mnemonic");
      localStorage.removeItem("walletTypeList");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function generateStarterWallet() {
    localStorage.setItem("mnemonic", mnemonic);
    router.push("/wallet");
  }

  function generateSecurityPhrases() {
    const securityPhrases = generateMnemonic();
    setMnemonicInputs(securityPhrases.split(" "));
  }

  function onPasteCapture(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain");
    if (text) {
      const textArr = text.split(" ");
      if (textArr.length === 12) {
        setMnemonicInputs(textArr);
      } else {
        toast({
          title: "Invalid Mnemonic",
          description: "Please copy and paste exactly 12 words.",
          variant: "destructive",
          duration: 2000,
        });
      }
    }
  }

  function saveSecurityPhrases() {
    if (mnemonicInputs.includes("")) {
      toast({
        title: "Invalid Mnemonic",
        description: "Please enter all 12 words.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    const securityPhrases = mnemonicInputs.join(" ");
    setMnemonic(securityPhrases);
  }

  function copyMnemonicToClipboard(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    navigator.clipboard.writeText(mnemonic).then(() => {
      toast({
        title: "Copied",
        description: "Security Phrases copied to clipboard",
        duration: 2000,
      });
    });
  }

  return (
    <>
      <main className="flex min-h-screen flex-col gap-10 p-12">
        {showWelcomeScreen ? (
          <div className="flex items-center justify-center text-center h-[88vh]">
            <div>
              <h1 className="text-4xl font-bold">Welcome to Yashletz!</h1>
              <p className="text-lg mt-4">
                Manage your cryptocurrency with ease and security.
              </p>
              <Button
                className="mt-8"
                onClick={() => setShowWelcomeScreen(false)}
              >
                Get Started
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold">Welcome to Yashletz!</h1>
            <div>
              <p className="text-lg">
                Easily manage and use your cryptocurrency.
              </p>
              <p className="text-sm text-slate-500">
                {!mnemonic
                  ? "Generate or copy and paste security phrases below."
                  : "Click anywhere in the box below to copy security phrases to clipboard."}
              </p>
            </div>
            <div className="flex">
              {!mnemonic ? (
                <div className="grid grid-cols-3 gap-2 w-fit border p-4 border-slate-300 rounded bg-slate-100 cursor-pointer">
                  {mnemonicInputs.map((input, index) => (
                    <Input
                      key={index}
                      type="text"
                      placeholder={(index + 1).toString()}
                      value={input}
                      onChange={(e) =>
                        setMnemonicInputs([
                          ...mnemonicInputs.slice(0, index),
                          e.target.value,
                          ...mnemonicInputs.slice(index + 1),
                        ])
                      }
                      onPasteCapture={onPasteCapture}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="grid grid-cols-3 gap-2 w-fit border p-4 border-slate-300 rounded bg-green-100 cursor-pointer"
                  onClick={copyMnemonicToClipboard}
                >
                  {mnemonicInputs.map((input, index) => (
                    <Input
                      className="!cursor-pointer"
                      key={index}
                      type="text"
                      value={input}
                      readOnly
                      onClick={copyMnemonicToClipboard}
                    />
                  ))}
                </div>
              )}
            </div>
            {!mnemonic ? (
              <div>
                <Button onClick={generateSecurityPhrases} className="mr-2 mb-2">
                  Generate Security Phrases
                </Button>
                <Button onClick={saveSecurityPhrases}>
                  Use Security Phrases
                </Button>
              </div>
            ) : (
              <div>
                <label className="flex items-center gap-2" htmlFor="secured">
                  <input
                    id="secured"
                    type="checkbox"
                    checked={mnemonicSecured}
                    onChange={() => setMnemonicSecured(!mnemonicSecured)}
                  />
                  Secured
                </label>
                <Button
                  onClick={generateStarterWallet}
                  disabled={!mnemonicSecured}
                  className="mt-2"
                >
                  Generate Wallet
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
